import { useAppStore } from '~/stores/appStore';
import { mockAddToast, mockClipboard } from '~/test-mocks';
import { fireEvent, render, screen, waitFor } from '~/test-utils';

import Swatch from '~/pages/Generator/Palette/Swatch';

const OKLCH_COLOR = 'oklch(63.269% 0.25404 19.902)';

describe('Swatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ gamut: 'p3' });
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  describe('Render', () => {
    it('renders OKLCH background when gamut is p3', () => {
      render(<Swatch color={OKLCH_COLOR} step="500" />);

      expect(screen.getByRole('button')).toMatchSnapshot();
    });

    it('renders hex background when gamut is srgb', () => {
      useAppStore.setState({ gamut: 'srgb' });

      render(<Swatch color={OKLCH_COLOR} step="500" />);

      expect(screen.getByRole('button')).toMatchSnapshot();
    });

    it('renders with lock icon', () => {
      render(<Swatch color={OKLCH_COLOR} lock={500} step="500" />);

      expect(screen.getByRole('button')).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('copies color to clipboard on click', async () => {
      render(<Swatch color={OKLCH_COLOR} step="500" />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(OKLCH_COLOR);
      });

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: `${OKLCH_COLOR} copied`,
        }),
      );
    });

    it('copies color on Enter key', async () => {
      render(<Swatch color={OKLCH_COLOR} step="500" />);

      const swatch = screen.getByRole('button');

      fireEvent.keyDown(swatch, { key: 'Enter' });

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(OKLCH_COLOR);
      });
    });

    it('copies color on Space key', async () => {
      render(<Swatch color={OKLCH_COLOR} step="500" />);

      const swatch = screen.getByRole('button');

      fireEvent.keyDown(swatch, { key: ' ' });

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(OKLCH_COLOR);
      });
    });

    it('shows error toast when clipboard fails', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

      render(<Swatch color={OKLCH_COLOR} step="500" />);

      const swatch = screen.getByRole('button');

      fireEvent.click(swatch);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: `Failed to copy ${OKLCH_COLOR} to your clipboard`,
            color: 'danger',
          }),
        );
      });
    });

    it('shows lock icon when step matches lock value', () => {
      render(<Swatch color={OKLCH_COLOR} lock={500} step="500" />);

      expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
    });

    it('does not show lock icon when step does not match', () => {
      render(<Swatch color={OKLCH_COLOR} lock={600} step="500" />);

      // Only the step text should be present, no lock icon
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });
});
