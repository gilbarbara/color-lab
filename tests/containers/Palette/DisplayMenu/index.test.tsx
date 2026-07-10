import { waitFor } from '@testing-library/react';

import { useAppStore } from '~/stores/appStore';
import { mockIsP3Supported } from '~/test-mocks';
import { fireEvent, render, screen } from '~/test-utils';

import DisplayMenu from '~/containers/Palette/DisplayMenu';

const mockTrackEvent = vi.fn();

vi.mock('~/utils/analytics', () => ({
  trackEvent: (...arguments_: unknown[]) => mockTrackEvent(...arguments_),
  trackPage: vi.fn(),
}));

describe('DisplayMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsP3Supported.mockReturnValue(true);
    useAppStore.setState({ gamut: 'p3', view: 'list', showPreview: true });
  });

  describe('Render', () => {
    it('renders the trigger', () => {
      const { container } = render(<DisplayMenu />);

      expect(container).toMatchSnapshot();
    });

    it('renders the popover', async () => {
      render(<DisplayMenu />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('View')).toBeInTheDocument();
      });

      expect(screen.getByTestId('DisplayMenu')).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('send event when opening the menu', async () => {
      render(<DisplayMenu />);

      fireEvent.click(screen.getByRole('button', { name: 'Display Options' }));

      expect(screen.getByTestId('DisplayMenu')).toBeInTheDocument();

      expect(mockTrackEvent).toHaveBeenCalledExactlyOnceWith('app:display_menu');

      // Close the popover
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      expect(screen.queryByTestId('DisplayMenu')).not.toBeInTheDocument();

      expect(mockTrackEvent).toHaveBeenCalledOnce();
    });
  });
});
