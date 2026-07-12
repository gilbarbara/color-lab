import { useAppStore } from '~/stores/appStore';
import { CRIMSON } from '~/test-fixtures';
import { mockAddToast, mockClipboard } from '~/test-mocks';
import { fireEvent, render, screen, waitFor } from '~/test-utils';

import Swatch from '~/containers/Palette/Swatch';

describe('Swatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ gamut: 'p3' });
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  describe('Render', () => {
    it('renders OKLCH background when gamut is p3', () => {
      render(<Swatch color={CRIMSON} step="500" />);

      expect(screen.getByRole('button')).toMatchSnapshot();
    });

    it('renders hex background when gamut is srgb', () => {
      useAppStore.setState({ gamut: 'srgb' });

      render(<Swatch color={CRIMSON} step="500" />);

      expect(screen.getByRole('button')).toMatchSnapshot();
    });

    it('renders with lock icon and step className', () => {
      render(<Swatch color={CRIMSON} lock={500} step="500" stepClassName="text-sm/4" />);

      expect(screen.getByRole('button')).toMatchSnapshot();
    });

    it('names the swatch with the color name when given one', () => {
      render(<Swatch color={CRIMSON} name="Primary" step="500" />);

      expect(screen.getByRole('button')).toHaveAccessibleName('Copy Primary 500');
    });

    it('falls back to the step alone without a name', () => {
      render(<Swatch color={CRIMSON} step="500" />);

      expect(screen.getByRole('button')).toHaveAccessibleName('Copy 500');
    });

    it('announces the lock state, which the icon alone does not convey', () => {
      render(<Swatch color={CRIMSON} lock={500} name="Primary" step="500" />);

      expect(screen.getByRole('button')).toHaveAccessibleName('Copy Primary 500, locked');
    });
  });

  describe('Behavior', () => {
    it('copies color to clipboard on click', async () => {
      render(<Swatch color={CRIMSON} step="500" />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(CRIMSON);
      });

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: `${CRIMSON} copied`,
        }),
      );
    });

    it('shows error toast when clipboard fails', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

      render(<Swatch color={CRIMSON} step="500" />);

      const swatch = screen.getByRole('button');

      fireEvent.click(swatch);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: `Failed to copy ${CRIMSON} to your clipboard`,
            color: 'danger',
          }),
        );
      });
    });

    it('renders presentational (no copy) when interactive is false', async () => {
      render(<Swatch color={CRIMSON} interactive={false} step="500" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('500'));

      await waitFor(() => {
        expect(mockClipboard.writeText).not.toHaveBeenCalled();
      });
      expect(mockAddToast).not.toHaveBeenCalled();
    });

    it('shows lock icon when step matches lock value', () => {
      render(<Swatch color={CRIMSON} lock={500} step="500" />);

      expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
    });

    it('does not show lock icon when step does not match', () => {
      render(<Swatch color={CRIMSON} lock={600} step="500" />);

      // Only the step text should be present, no lock icon
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });
});
