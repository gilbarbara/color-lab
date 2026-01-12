import { useAppStore } from '~/stores/appStore';
import { usePaletteStore } from '~/stores/paletteStore';
import { fireEvent, render, screen } from '~/test-utils';
import { createPalette, MAX_COLORS } from '~/utils/palette';

import BottomBar from '~/pages/Generator/BottomBar';

import type { ColorEntry, PaletteState } from '~/types';

vi.mock('~/utils/color', async importOriginal => {
  const actual = await importOriginal<typeof import('~/utils/color')>();

  return {
    ...actual,
    getRandomColor: () => 'oklch(0.65 0.15 180)',
  };
});

function createColorEntry(
  name: string,
  value: string,
  overrides?: ColorEntry['overrides'],
): ColorEntry {
  return { id: crypto.randomUUID(), name, value, ...(overrides && { overrides }) };
}

function createTestPalette(colorCount = 1): PaletteState {
  const basePalette = createPalette('#FF0044');
  const colorNames = ['Primary', 'Secondary', 'Tertiary', 'Accent'];

  return {
    ...basePalette,
    colors: Array.from({ length: colorCount }, (_, index) =>
      createColorEntry(
        colorNames[index] || `Color ${index + 1}`,
        `#FF00${index.toString().padStart(2, '0')}`,
      ),
    ),
  };
}

describe('BottomBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePaletteStore.setState(createTestPalette(2));
    useAppStore.setState({ showBottomBar: false });
  });

  describe('Render', () => {
    it('renders correctly in closed state', () => {
      const { container } = render(<BottomBar />);

      expect(container).toMatchSnapshot();
    });

    it('renders correctly in open state', () => {
      useAppStore.setState({ showBottomBar: true });
      const { container } = render(<BottomBar />);

      expect(container).toMatchSnapshot();
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

      expect(usePaletteStore.getState().colors.length).toBe(initialColors + 1);
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

      // Should have 3 color circles
      const colorCircles = screen
        .getAllByRole('button')
        .filter(button => button.getAttribute('data-id')?.match(/^\d+-#/));

      expect(colorCircles.length).toBe(3);
    });
  });
});
