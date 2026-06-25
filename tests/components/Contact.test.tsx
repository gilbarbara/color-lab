import { request } from '@gilbarbara/helpers';

import { fireEvent, render, screen, waitFor } from '~/test-utils';

import Contact from '~/components/Contact';

vi.mock('@gilbarbara/helpers', async importOriginal => {
  const actual = await importOriginal<typeof import('@gilbarbara/helpers')>();

  return {
    ...actual,
    request: vi.fn(),
  };
});

const mockRequest = vi.mocked(request);

describe('Contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders correctly', () => {
      const { container } = render(<Contact />);

      expect(container).toMatchSnapshot();
    });

    it('renders modal correctly when open', async () => {
      const { container } = render(<Contact />);

      fireEvent.click(screen.getByRole('button', { name: /feedback/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });

    it('prefills the email field with the signed-in user email', async () => {
      render(<Contact />, {
        authState: { isAuthenticated: true, user: { email: 'user@example.com' } },
      });

      fireEvent.click(screen.getByRole('button', { name: /feedback/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText(/e-mail address/i)).toHaveValue('user@example.com');
    });

    it('leaves the email field empty when signed out', async () => {
      render(<Contact />);

      fireEvent.click(screen.getByRole('button', { name: /feedback/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText(/e-mail address/i)).toHaveValue('');
    });
  });

  describe('Behavior', () => {
    it('shows validation error for short message', async () => {
      render(<Contact />);

      fireEvent.click(screen.getByRole('button', { name: /feedback/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const messageInput = screen.getByPlaceholderText(/feedback, suggestions or bug reports/i);
      const emailInput = screen.getByPlaceholderText(/e-mail address/i);

      fireEvent.change(messageInput, { target: { value: 'short' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      fireEvent.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(
          screen.getByText('The message must be at least 10 characters long.'),
        ).toBeInTheDocument();
      });

      expect(mockRequest).not.toHaveBeenCalled();
    });

    it('shows success message on successful submission', async () => {
      mockRequest.mockResolvedValue({} as Response);

      render(<Contact />);

      fireEvent.click(screen.getByRole('button', { name: /feedback/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const messageInput = screen.getByPlaceholderText(/feedback, suggestions or bug reports/i);
      const emailInput = screen.getByPlaceholderText(/e-mail address/i);

      fireEvent.change(messageInput, {
        target: { value: 'This is a valid message that is long enough' },
      });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      fireEvent.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText('Message sent successfully')).toBeInTheDocument();
      });

      expect(mockRequest).toHaveBeenCalledWith('https://submit-form.com/OsJcU0zeI', {
        method: 'POST',
        body: { email: 'test@example.com', message: 'This is a valid message that is long enough' },
      });
    });

    it('shows error message on failed submission', async () => {
      mockRequest.mockRejectedValue(new Error('Network error'));

      render(<Contact />);

      fireEvent.click(screen.getByRole('button', { name: /feedback/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const messageInput = screen.getByPlaceholderText(/feedback, suggestions or bug reports/i);
      const emailInput = screen.getByPlaceholderText(/e-mail address/i);

      fireEvent.change(messageInput, {
        target: { value: 'This is a valid message that is long enough' },
      });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      fireEvent.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to send. Try again.')).toBeInTheDocument();
      });
    });
  });
});
