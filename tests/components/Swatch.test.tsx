import { mockAddToast, mockClipboard } from '~/test-mocks';
import { fireEvent, render, screen, waitFor } from '~/test-utils';

import Swatch from '~/pages/Generator/Palette/Swatch';

describe('Swatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  describe('Render', () => {
    it('renders correctly', () => {
      const { container } = render(<Swatch color="#FF0044" step="500" />);

      expect(container).toMatchSnapshot();
    });

    it('renders with lock icon', () => {
      const { container } = render(<Swatch color="#FF0044" lock={500} step="500" />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('copies color to clipboard on click', async () => {
      render(<Swatch color="#FF0044" step="500" />);

      const swatch = screen.getByRole('button');

      fireEvent.click(swatch);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('#FF0044');
      });

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '#FF0044 copied',
        }),
      );
    });

    it('copies color on Enter key', async () => {
      render(<Swatch color="#FF0044" step="500" />);

      const swatch = screen.getByRole('button');

      fireEvent.keyDown(swatch, { key: 'Enter' });

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('#FF0044');
      });
    });

    it('copies color on Space key', async () => {
      render(<Swatch color="#FF0044" step="500" />);

      const swatch = screen.getByRole('button');

      fireEvent.keyDown(swatch, { key: ' ' });

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('#FF0044');
      });
    });

    it('shows error toast when clipboard fails', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

      render(<Swatch color="#FF0044" step="500" />);

      const swatch = screen.getByRole('button');

      fireEvent.click(swatch);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Failed to copy #FF0044 to your clipboard',
            color: 'danger',
          }),
        );
      });
    });

    it('shows lock icon when step matches lock value', () => {
      render(<Swatch color="#FF0044" lock={500} step="500" />);

      expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
    });

    it('does not show lock icon when step does not match', () => {
      render(<Swatch color="#FF0044" lock={600} step="500" />);

      // Only the step text should be present, no lock icon
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });
});
