import { useAuthStore } from '~/stores/authStore';
import { render, screen, waitFor } from '~/test-utils';

import AuthCallback from '~/pages/AuthCallback';

const mockIsSignInWithEmailLink = vi.fn();
const mockSignInWithEmailLink = vi.fn();

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  isSignInWithEmailLink: (...arguments_: unknown[]) => mockIsSignInWithEmailLink(...arguments_),
  signInWithEmailLink: (...arguments_: unknown[]) => mockSignInWithEmailLink(...arguments_),
}));

vi.mock('~/utils/firebase', () => ({
  auth: {},
}));

const mockNavigate = vi.fn();

vi.mock('react-router', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router')>();

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderWithRouter(initialPath: string) {
  return render(<AuthCallback />, { initialEntries: [initialPath] });
}

describe('pages/AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSignInWithEmailLink.mockReturnValue(false);
    useAuthStore.setState({
      error: null,
      status: 'idle',
      user: null,
    });
  });

  describe('Render', () => {
    it('shows loading spinner and message', () => {
      renderWithRouter('/auth/callback');

      expect(document.querySelector('.animate-spinner-ease-spin')).toBeInTheDocument();
      expect(screen.getByText('Completing authentication...')).toBeInTheDocument();
    });
  });

  describe('Non-magic-link visits', () => {
    it('redirects to home when no magic link detected', async () => {
      renderWithRouter('/auth/callback');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });
  });

  describe('Magic Link flow', () => {
    it('verifies magic link and redirects on success', async () => {
      mockIsSignInWithEmailLink.mockReturnValue(true);
      mockSignInWithEmailLink.mockResolvedValueOnce({});
      localStorage.setItem('emailForSignIn', 'test@example.com');

      renderWithRouter('/auth/callback');

      await waitFor(() => {
        expect(screen.getByText('Verifying magic link...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockSignInWithEmailLink).toHaveBeenCalledWith(
          expect.anything(),
          'test@example.com',
          expect.any(String),
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });

      // Email should be cleared from localStorage
      expect(localStorage.getItem('emailForSignIn')).toBeNull();
    });

    it('handles magic link verification failure', async () => {
      mockIsSignInWithEmailLink.mockReturnValue(true);
      mockSignInWithEmailLink.mockRejectedValueOnce(new Error('Invalid or expired link'));
      localStorage.setItem('emailForSignIn', 'test@example.com');

      renderWithRouter('/auth/callback');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });

      expect(useAuthStore.getState().error).toBe('Invalid or expired link');
    });

    it('handles missing email in localStorage', async () => {
      mockIsSignInWithEmailLink.mockReturnValue(true);
      localStorage.removeItem('emailForSignIn');

      renderWithRouter('/auth/callback');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });

      expect(useAuthStore.getState().error).toBe('Please enter your email to complete sign-in');
    });
  });
});
