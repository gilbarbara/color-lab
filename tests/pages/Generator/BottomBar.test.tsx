import { useAppStore } from '~/stores/appStore';
import { usePaletteStore } from '~/stores/paletteStore';
import { createTestPalette } from '~/test-fixtures';
import { fireEvent, render, screen } from '~/test-utils';
import { MAX_COLORS } from '~/utils/palette';

import BottomBar from '~/pages/Generator/BottomBar';

vi.mock('~/utils/color', async importOriginal => {
  const actual = await importOriginal<typeof import('~/utils/color')>();

  return {
    ...actual,
    getRandomColor: () => 'oklch(63.27% 0.254 19.9)',
  };
});

describe('BottomBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePaletteStore.setState(createTestPalette(2));
    useAppStore.setState({ showBottomBar: false });
  });

  describe('Render', () => {
    it('renders correctly in closed state', () => {
      render(<BottomBar />);

      expect(screen.getByTestId('BottomBar')).toMatchSnapshot();
    });

    it('renders correctly in open state', () => {
      useAppStore.setState({ showBottomBar: true });
      render(<BottomBar />);

      expect(screen.getByTestId('BottomBar')).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('toggles open/closed on header click', () => {
      render(<BottomBar />);

      const header = screen.getByTestId('BottomBarHeader');

      fireEvent.click(header);

      expect(useAppStore.getState().showBottomBar).toBe(true);

      fireEvent.click(header);

      expect(useAppStore.getState().showBottomBar).toBe(false);
    });

    it('toggles on Enter key', () => {
      render(<BottomBar />);

      const header = screen.getByTestId('BottomBarHeader');

      fireEvent.keyDown(header, { key: 'Enter' });

      expect(useAppStore.getState().showBottomBar).toBe(true);
    });

    it('toggles on Space key', () => {
      render(<BottomBar />);

      const header = screen.getByTestId('BottomBarHeader');

      fireEvent.keyDown(header, { key: ' ' });

      expect(useAppStore.getState().showBottomBar).toBe(true);
    });

    it('Add Color button adds a new color', () => {
      useAppStore.setState({ showBottomBar: true });
      render(<BottomBar />);

      const initialColors = usePaletteStore.getState().colors.length;

      const addButton = screen.getByRole('button', { name: /add color/i });

      fireEvent.click(addButton);

      expect(usePaletteStore.getState().colors).toHaveLength(initialColors + 1);
    });

    it('Add Color is disabled at MAX_COLORS', () => {
      usePaletteStore.setState(createTestPalette(MAX_COLORS));
      useAppStore.setState({ showBottomBar: true });
      render(<BottomBar />);

      const addButton = screen.getByRole('button', { name: /add color/i });

      expect(addButton).toBeDisabled();
    });

    it('displays color circles for each color', () => {
      usePaletteStore.setState(createTestPalette(3));
      render(<BottomBar />);

      const colorBoxes = screen.getAllByTestId('ColorBox');

      expect(colorBoxes).toHaveLength(3);
    });
  });
});
