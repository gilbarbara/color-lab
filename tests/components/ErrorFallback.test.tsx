import { fireEvent, render, screen } from '~/test-utils';
import { trackEvent } from '~/utils/analytics';

import ErrorFallback from '~/components/ErrorFallback';

vi.mock('~/utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('ErrorFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders correctly', () => {
      // Stub stack to keep snapshot portable across machines/CI.
      const error = new Error('boom');

      error.stack = 'Error: boom\n    at <test>';

      render(<ErrorFallback error={error} resetError={vi.fn()} />);

      expect(screen.getByTestId('ErrorFallback')).toMatchSnapshot();
    });

    it('renders details for non-Error values', () => {
      render(<ErrorFallback error="string error" resetError={vi.fn()} />);

      expect(screen.getByTestId('ErrorFallback-details')).toHaveTextContent('string error');
    });

    it('renders reference id when eventId is provided', () => {
      render(
        <ErrorFallback error={new Error('boom')} eventId="abc123def456" resetError={vi.fn()} />,
      );

      const reference = screen.getByTestId('ErrorFallback-reference');

      expect(reference).toBeInTheDocument();
      expect(reference).toHaveTextContent('Reference:');
      expect(reference).toHaveTextContent('abc123def456');
    });

    it('hides reference when eventId is absent', () => {
      render(<ErrorFallback error={new Error('boom')} resetError={vi.fn()} />);

      expect(screen.queryByTestId('ErrorFallback-reference')).not.toBeInTheDocument();
    });
  });

  describe('Behavior', () => {
    it('calls resetError when "Try again" is clicked', () => {
      const resetError = vi.fn();

      render(<ErrorFallback error={new Error('boom')} resetError={resetError} />);

      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      expect(resetError).toHaveBeenCalledTimes(1);
      expect(trackEvent).toHaveBeenCalledWith('error-action', { action: 'reset' });
    });

    it('reloads the page when "Reload page" is clicked', () => {
      const reload = vi.fn();
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...originalLocation, reload },
      });

      render(<ErrorFallback error={new Error('boom')} resetError={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /reload page/i }));

      expect(reload).toHaveBeenCalledTimes(1);
      expect(trackEvent).toHaveBeenCalledWith('error-action', { action: 'reload' });

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });
  });
});
