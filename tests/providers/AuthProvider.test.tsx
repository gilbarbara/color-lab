import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useAuth } from '~/hooks/useAuth';
import AuthProvider from '~/providers/AuthProvider';
import { useAuthStore } from '~/stores/authStore';
import { account } from '~/utils/appwrite';

vi.mock('~/utils/appwrite', () => ({
  account: {
    get: vi.fn(),
    create: vi.fn(),
    createEmailPasswordSession: vi.fn(),
    createMagicURLToken: vi.fn(),
    createOAuth2Session: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

const mockUser = {
  $id: 'user-123',
  $createdAt: '2024-01-01T00:00:00.000Z',
  $updatedAt: '2024-01-01T00:00:00.000Z',
  name: 'Test User',
  email: 'test@example.com',
  phone: '',
  emailVerification: true,
  phoneVerification: false,
  mfa: false,
  prefs: {},
  targets: [],
  accessedAt: '2024-01-01T00:00:00.000Z',
  registration: '2024-01-01T00:00:00.000Z',
  status: true,
  labels: [],
  passwordUpdate: '2024-01-01T00:00:00.000Z',
  hashOptions: {},
  hash: '',
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('providers/AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      error: null,
      status: 'idle',
      user: null,
    });
  });

  describe('session restoration', () => {
    it('restores session on mount when user exists', async () => {
      vi.mocked(account.get).mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(account.get).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
    });

    it('sets unauthenticated when no session exists', async () => {
      vi.mocked(account.get).mockRejectedValueOnce(new Error('No session'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('loginWithEmail', () => {
    it('creates session and fetches user on success', async () => {
      vi.mocked(account.get).mockRejectedValueOnce(new Error('No session'));
      vi.mocked(account.createEmailPasswordSession).mockResolvedValueOnce({} as never);
      vi.mocked(account.get).mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithEmail('test@example.com', 'password123');
      });

      expect(account.createEmailPasswordSession).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('sets error on login failure', async () => {
      vi.mocked(account.get).mockRejectedValueOnce(new Error('No session'));
      vi.mocked(account.createEmailPasswordSession).mockRejectedValueOnce(
        new Error('Invalid credentials'),
      );

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
    it('creates account, then session, and fetches user', async () => {
      vi.mocked(account.get).mockRejectedValueOnce(new Error('No session'));
      vi.mocked(account.create).mockResolvedValueOnce({} as never);
      vi.mocked(account.createEmailPasswordSession).mockResolvedValueOnce({} as never);
      vi.mocked(account.get).mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signupWithEmail('test@example.com', 'password123', 'Test User');
      });

      expect(account.create).toHaveBeenCalledWith({
        userId: expect.any(String),
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
      expect(account.createEmailPasswordSession).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('sets error on signup failure', async () => {
      vi.mocked(account.get).mockRejectedValueOnce(new Error('No session'));
      vi.mocked(account.create).mockRejectedValueOnce(new Error('Email already exists'));

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
    it('calls createOAuth2Session with Google provider', async () => {
      vi.mocked(account.get).mockRejectedValueOnce(new Error('No session'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.loginWithOAuth('google');
      });

      expect(account.createOAuth2Session).toHaveBeenCalledWith({
        provider: 'google',
        success: expect.stringContaining('/auth/callback'),
        failure: expect.stringContaining('/auth/callback?error=oauth_failed'),
      });
    });

    it('calls createOAuth2Session with GitHub provider', async () => {
      vi.mocked(account.get).mockRejectedValueOnce(new Error('No session'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.loginWithOAuth('github');
      });

      expect(account.createOAuth2Session).toHaveBeenCalledWith({
        provider: 'github',
        success: expect.stringContaining('/auth/callback'),
        failure: expect.stringContaining('/auth/callback?error=oauth_failed'),
      });
    });
  });

  describe('sendMagicLink', () => {
    it('calls createMagicURLToken with email', async () => {
      vi.mocked(account.get).mockRejectedValueOnce(new Error('No session'));
      vi.mocked(account.createMagicURLToken).mockResolvedValueOnce({} as never);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.sendMagicLink('test@example.com');
      });

      expect(account.createMagicURLToken).toHaveBeenCalledWith({
        userId: expect.any(String),
        email: 'test@example.com',
        url: expect.stringContaining('/auth/callback'),
      });
    });

    it('sets error on magic link failure', async () => {
      vi.mocked(account.get).mockRejectedValueOnce(new Error('No session'));
      vi.mocked(account.createMagicURLToken).mockRejectedValueOnce(new Error('Rate limited'));

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
    it('deletes session and clears user', async () => {
      vi.mocked(account.get).mockResolvedValueOnce(mockUser);
      vi.mocked(account.deleteSession).mockResolvedValueOnce({} as never);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(account.deleteSession).toHaveBeenCalledWith({ sessionId: 'current' });
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('clears user even if session deletion fails', async () => {
      vi.mocked(account.get).mockResolvedValueOnce(mockUser);
      vi.mocked(account.deleteSession).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // The logout function uses finally, so user is cleared even if deleteSession fails
      try {
        await act(async () => {
          await result.current.logout();
        });
      } catch {
        // Network error is expected but swallowed by finally
      }

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
