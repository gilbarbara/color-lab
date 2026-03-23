import { useAuthStore } from '~/stores/authStore';
import { render, screen, waitFor } from '~/test-utils';
import { account } from '~/utils/appwrite';

import AuthCallback from '~/pages/AuthCallback';

vi.mock('~/utils/appwrite', () => ({
  account: {
    get: vi.fn(),
    createSession: vi.fn(),
  },
}));

const mockNavigate = vi.fn();

vi.mock('react-router', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router')>();

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

function renderWithRouter(initialPath: string) {
  return render(<AuthCallback />, { initialEntries: [initialPath] });
}

describe('pages/AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      error: null,
      status: 'idle',
      user: null,
    });
  });

  describe('Render', () => {
    it('shows loading spinner and message', () => {
      vi.mocked(account.get).mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithRouter('/auth/callback');

      // HeroUI Spinner uses animate-spinner classes
      expect(document.querySelector('.animate-spinner-ease-spin')).toBeInTheDocument();
      expect(screen.getByText('Completing authentication...')).toBeInTheDocument();
    });
  });

  describe('OAuth flow', () => {
    it('redirects to home on OAuth success', async () => {
      vi.mocked(account.get).mockResolvedValueOnce(mockUser);

      renderWithRouter('/auth/callback');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });

      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('redirects to home on OAuth error', async () => {
      renderWithRouter('/auth/callback?error=oauth_failed');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });

      expect(useAuthStore.getState().error).toBe('Authentication failed');
    });

    it('sets unauthenticated status when no session exists', async () => {
      vi.mocked(account.get).mockRejectedValueOnce(new Error('No session'));

      renderWithRouter('/auth/callback');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });

      expect(useAuthStore.getState().status).toBe('unauthenticated');
    });
  });

  describe('Magic Link flow', () => {
    it('verifies magic link and redirects on success', async () => {
      vi.mocked(account.createSession).mockResolvedValueOnce({} as never);
      vi.mocked(account.get).mockResolvedValueOnce(mockUser);

      renderWithRouter('/auth/callback?userId=user-123&secret=secret-token');

      await waitFor(() => {
        expect(screen.getByText('Verifying magic link...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(account.createSession).toHaveBeenCalledWith({
          userId: 'user-123',
          secret: 'secret-token',
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });

      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('handles magic link verification failure', async () => {
      vi.mocked(account.createSession).mockRejectedValueOnce(new Error('Invalid or expired link'));

      renderWithRouter('/auth/callback?userId=user-123&secret=invalid-token');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });

      expect(useAuthStore.getState().error).toBe('Invalid or expired link');
    });
  });
});
