import { useAppStore } from '~/stores/appStore';
import { fireEvent, render, screen, waitFor } from '~/test-utils';

import Login from '~/components/Login';

const mockLoginWithEmail = vi.fn();
const mockLoginWithOAuth = vi.fn();
const mockLogout = vi.fn();
const mockSendMagicLink = vi.fn();
const mockSignupWithEmail = vi.fn();

vi.mock('~/hooks/useAuth', () => ({
  default: () => ({
    error: null,
    isAuthenticated: false,
    isLoading: false,
    loginWithEmail: mockLoginWithEmail,
    loginWithOAuth: mockLoginWithOAuth,
    logout: mockLogout,
    sendMagicLink: mockSendMagicLink,
    signupWithEmail: mockSignupWithEmail,
    user: null,
  }),
}));

function renderLogin({ showLoginModal = false } = {}) {
  useAppStore.setState({ showLoginModal });

  return render(<Login />);
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginWithEmail.mockResolvedValue(undefined);
    mockSignupWithEmail.mockResolvedValue(undefined);
    mockSendMagicLink.mockResolvedValue(undefined);
    useAppStore.setState({ showLoginModal: false });
  });

  describe('Render', () => {
    it('renders nothing when modal is closed', () => {
      const { container } = renderLogin({ showLoginModal: false });

      expect(container).toMatchSnapshot();
    });

    it('renders modal when open', async () => {
      const { container } = renderLogin({ showLoginModal: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('shows OAuth buttons', async () => {
      renderLogin({ showLoginModal: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument();
    });

    it('shows tabs for Login, Sign Up, and Magic Link', async () => {
      renderLogin({ showLoginModal: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByRole('tab', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /sign up/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /magic link/i })).toBeInTheDocument();
    });

    it('shows login form by default', async () => {
      renderLogin({ showLoginModal: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
    });

    it('switches to sign up tab and shows name field', async () => {
      renderLogin({ showLoginModal: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('switches to magic link tab', async () => {
      renderLogin({ showLoginModal: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: /magic link/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
      });
    });

    it('calls loginWithOAuth with google on Google button click', async () => {
      renderLogin({ showLoginModal: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

      expect(mockLoginWithOAuth).toHaveBeenCalledWith('google');
    });

    it('calls loginWithOAuth with github on GitHub button click', async () => {
      renderLogin({ showLoginModal: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /continue with github/i }));

      expect(mockLoginWithOAuth).toHaveBeenCalledWith('github');
    });

    it('calls loginWithEmail on login form submit and closes modal', async () => {
      renderLogin({ showLoginModal: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const emailInputs = screen.getAllByLabelText(/email/i);
      const passwordInputs = screen.getAllByLabelText(/password/i);

      fireEvent.change(emailInputs[0], { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });

      fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

      await waitFor(() => {
        expect(mockLoginWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(useAppStore.getState().showLoginModal).toBe(false);
      });
    });

    it('calls signupWithEmail on signup form submit and closes modal', async () => {
      renderLogin({ showLoginModal: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInputs = screen.getAllByLabelText(/email/i);
      const passwordInputs = screen.getAllByLabelText(/password/i);

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInputs[0], { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockSignupWithEmail).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'Test User',
        );
      });

      await waitFor(() => {
        expect(useAppStore.getState().showLoginModal).toBe(false);
      });
    });

    it('calls sendMagicLink and shows success message', async () => {
      renderLogin({ showLoginModal: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: /magic link/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
      });

      const emailInputs = screen.getAllByLabelText(/email/i);

      fireEvent.change(emailInputs[0], { target: { value: 'test@example.com' } });

      fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

      await waitFor(() => {
        expect(mockSendMagicLink).toHaveBeenCalledWith('test@example.com');
      });

      await waitFor(() => {
        expect(screen.getByText(/check your email for the login link/i)).toBeInTheDocument();
      });
    });

    it('keeps modal open when login fails', async () => {
      mockLoginWithEmail.mockRejectedValueOnce(new Error('Invalid credentials'));

      renderLogin({ showLoginModal: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const emailInputs = screen.getAllByLabelText(/email/i);
      const passwordInputs = screen.getAllByLabelText(/password/i);

      fireEvent.change(emailInputs[0], { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInputs[0], { target: { value: 'wrongpassword' } });

      fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

      await waitFor(() => {
        expect(mockLoginWithEmail).toHaveBeenCalled();
      });

      // Modal should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(useAppStore.getState().showLoginModal).toBe(true);
    });
  });
});
