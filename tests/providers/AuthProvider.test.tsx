import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';

import useAuth from '~/hooks/useAuth';
import AuthProvider from '~/providers/AuthProvider';
import { useAuthStore } from '~/stores/authStore';

const mockOnAuthStateChanged = vi.fn();
const mockSignInWithEmailAndPassword = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockUpdateProfile = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockSendSignInLinkToEmail = vi.fn();
const mockSignOut = vi.fn();
const mockLinkWithCredential = vi.fn();

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: (...arguments_: unknown[]) => mockOnAuthStateChanged(...arguments_),
  signInWithEmailAndPassword: (...arguments_: unknown[]) =>
    mockSignInWithEmailAndPassword(...arguments_),
  createUserWithEmailAndPassword: (...arguments_: unknown[]) =>
    mockCreateUserWithEmailAndPassword(...arguments_),
  updateProfile: (...arguments_: unknown[]) => mockUpdateProfile(...arguments_),
  signInWithPopup: (...arguments_: unknown[]) => mockSignInWithPopup(...arguments_),
  sendSignInLinkToEmail: (...arguments_: unknown[]) => mockSendSignInLinkToEmail(...arguments_),
  signOut: (...arguments_: unknown[]) => mockSignOut(...arguments_),
  linkWithCredential: (...arguments_: unknown[]) => mockLinkWithCredential(...arguments_),
  GoogleAuthProvider: Object.assign(vi.fn(), {
    credentialFromError: vi.fn(() => 'mock-google-credential'),
  }),
  GithubAuthProvider: Object.assign(vi.fn(), {
    credentialFromError: vi.fn(() => 'mock-github-credential'),
  }),
}));

vi.mock('~/utils/firebase', async importOriginal => ({
  ...(await importOriginal<typeof import('~/utils/firebase')>()),
  getFirebaseAuth: () => ({}),
}));

const mockIdentifyUser = vi.fn();
const mockResetUser = vi.fn();

vi.mock('~/utils/analytics', () => ({
  identifyUser: (...arguments_: unknown[]) => mockIdentifyUser(...arguments_),
  resetUser: (...arguments_: unknown[]) => mockResetUser(...arguments_),
}));

const mockFirebaseUser = {
  uid: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  providerData: [{ providerId: 'password' }],
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('providers/AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockOnAuthStateChanged.mockImplementation(
      (_auth: unknown, callback: (user: unknown) => void) => {
        // Simulate no user initially
        callback(null);

        return vi.fn(); // unsubscribe
      },
    );

    useAuthStore.setState({
      error: null,
      provider: null,
      status: 'idle',
      user: null,
    });
  });

  describe('session restoration', () => {
    it('restores session on mount when user exists', async () => {
      mockOnAuthStateChanged.mockImplementation(
        (_auth: unknown, callback: (user: unknown) => void) => {
          callback(mockFirebaseUser);

          return vi.fn();
        },
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.user).toEqual({
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        providerData: [{ providerId: 'password', photoURL: undefined }],
      });

      expect(mockIdentifyUser).toHaveBeenCalledWith('user-123', {
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('sets unauthenticated when no session exists', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Firebase auth is dynamic-imported after mount, so wait for the settled
      // (no-longer-loading) state rather than the transient false-while-loading.
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      // Initial anonymous state must NOT reset — that would rotate the posthog
      // session id and orphan the already-sent $pageview.
      expect(mockResetUser).not.toHaveBeenCalled();
      expect(mockIdentifyUser).not.toHaveBeenCalled();
    });

    it('resets analytics only on a genuine logout, not the initial anonymous state', async () => {
      let capturedCallback: (user: unknown) => void = () => {};

      mockOnAuthStateChanged.mockImplementation(
        (_auth: unknown, callback: (user: unknown) => void) => {
          capturedCallback = callback;
          callback(mockFirebaseUser);

          return vi.fn();
        },
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(mockResetUser).not.toHaveBeenCalled();

      act(() => {
        capturedCallback(null);
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      expect(mockResetUser).toHaveBeenCalled();
    });
  });

  describe('loginWithEmail', () => {
    it('calls signInWithEmailAndPassword on success', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: mockFirebaseUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithEmail('test@example.com', 'password123');
      });

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123',
      );
    });

    it('sets error on login failure', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      try {
        await act(async () => {
          await result.current.loginWithEmail('test@example.com', 'wrongpassword');
        });
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.error).toBe('Invalid credentials');
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('signupWithEmail', () => {
    it('creates account with displayName', async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockFirebaseUser });
      mockUpdateProfile.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signupWithEmail('test@example.com', 'password123', 'Test User');
      });

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123',
      );
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockFirebaseUser, {
        displayName: 'Test User',
      });
    });

    it('sets error on signup failure', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(new Error('Email already exists'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      try {
        await act(async () => {
          await result.current.signupWithEmail('test@example.com', 'password123');
        });
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.error).toBe('Email already exists');
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('loginWithOAuth', () => {
    it('calls signInWithPopup with Google provider', async () => {
      mockSignInWithPopup.mockResolvedValueOnce({ user: mockFirebaseUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithOAuth('google');
      });

      expect(mockSignInWithPopup).toHaveBeenCalledWith(expect.anything(), expect.any(Object));
    });

    it('calls signInWithPopup with GitHub provider', async () => {
      mockSignInWithPopup.mockResolvedValueOnce({ user: mockFirebaseUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithOAuth('github');
      });

      expect(mockSignInWithPopup).toHaveBeenCalledWith(expect.anything(), expect.any(Object));
    });

    it('stores pending credential on account-exists error', async () => {
      const authError = Object.assign(new Error('account exists'), {
        code: 'auth/account-exists-with-different-credential',
        customData: { email: 'test@example.com' },
      });

      mockSignInWithPopup.mockRejectedValueOnce(authError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithOAuth('github');
      });

      await waitFor(() => {
        expect(result.current.error).toContain('already linked to Google');
      });

      expect(useAuthStore.getState().pendingCredential).toBe('mock-github-credential');
    });

    it('links pending credential on subsequent OAuth success', async () => {
      useAuthStore.setState({ pendingCredential: 'mock-pending-credential' as never });
      mockSignInWithPopup.mockResolvedValueOnce({ user: mockFirebaseUser });
      mockLinkWithCredential.mockResolvedValueOnce({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithOAuth('google');
      });

      expect(mockLinkWithCredential).toHaveBeenCalledWith(
        mockFirebaseUser,
        'mock-pending-credential',
      );
      expect(useAuthStore.getState().pendingCredential).toBeNull();
    });
  });

  describe('sendMagicLink', () => {
    it('calls sendSignInLinkToEmail with email', async () => {
      mockSendSignInLinkToEmail.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.sendMagicLink('test@example.com');
      });

      expect(mockSendSignInLinkToEmail).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        expect.objectContaining({
          url: expect.stringContaining('/auth/callback'),
          handleCodeInApp: true,
        }),
      );
    });

    it('sets error on magic link failure', async () => {
      mockSendSignInLinkToEmail.mockRejectedValueOnce(new Error('Rate limited'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      try {
        await act(async () => {
          await result.current.sendMagicLink('test@example.com');
        });
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.error).toBe('Rate limited');
      });
    });
  });

  describe('logout', () => {
    it('signs out and clears user', async () => {
      mockOnAuthStateChanged.mockImplementation(
        (_auth: unknown, callback: (user: unknown) => void) => {
          callback(mockFirebaseUser);

          return vi.fn();
        },
      );
      mockSignOut.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('clears user even if signOut fails', async () => {
      mockOnAuthStateChanged.mockImplementation(
        (_auth: unknown, callback: (user: unknown) => void) => {
          callback(mockFirebaseUser);

          return vi.fn();
        },
      );
      mockSignOut.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      try {
        await act(async () => {
          await result.current.logout();
        });
      } catch {
        // Network error expected
      }

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
