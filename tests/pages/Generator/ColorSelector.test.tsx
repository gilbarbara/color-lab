import { usePaletteStore } from '~/stores/paletteStore';
import { act, fireEvent, render, screen } from '~/test-utils';
import { createPalette, getDefaultGlobalOptions } from '~/utils/palette';

import ColorSelector from '~/pages/Generator/ColorList/ColorSelector';

import type { ColorEntry, GlobalScaleOptions } from '~/types';

function createColorEntry(
  name: string,
  value: string,
  overrides?: ColorEntry['overrides'],
): ColorEntry {
  return { id: crypto.randomUUID(), name, value, ...(overrides && { overrides }) };
}

const TEST_COLOR = 'oklch(0.55 0.22 27)';

function createDefaultProps(overrides: Partial<Parameters<typeof ColorSelector>[0]> = {}) {
  const globalOptions: GlobalScaleOptions = getDefaultGlobalOptions(TEST_COLOR);

  return {
    colorEntry: createColorEntry('Primary', TEST_COLOR),
    globalOptions,
    index: 0,
    isOnlyColor: false,
    ...overrides,
  };
}

function setupStore(colors?: ColorEntry[]) {
  const palette = createPalette(TEST_COLOR);

  if (colors) {
    palette.colors = colors;
  }

  usePaletteStore.setState(palette);

  return palette;
}

describe('ColorSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    setupStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Render', () => {
    it('renders correctly in HSL mode', () => {
      const { container } = render(<ColorSelector {...createDefaultProps()} />);

      expect(container).toMatchSnapshot();
    });

    it('renders correctly in OKLCH mode', () => {
      const props = createDefaultProps({
        colorEntry: createColorEntry('Primary', 'oklch(0.7 0.2 120)'),
      });
      const { container } = render(<ColorSelector {...props} />);

      // Click mode button twice to get to OKLCH (HSL → RGB → OKLCH)
      const modeButton = screen.getByRole('button', { name: /hsl/i });

      fireEvent.click(modeButton);
      fireEvent.click(screen.getByRole('button', { name: /rgb/i }));

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('starts in HSL mode', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      const modeButton = screen.getByRole('button', { name: /hsl/i });

      expect(modeButton).toBeInTheDocument();
    });

    it('cycles through HSL → RGB → OKLCH modes', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      // Initially HSL
      const modeButton = screen.getByRole('button', { name: /hsl/i });

      expect(modeButton).toBeInTheDocument();

      // Click → RGB
      fireEvent.click(modeButton);

      expect(screen.getByRole('button', { name: /rgb/i })).toBeInTheDocument();

      // Click → OKLCH
      fireEvent.click(screen.getByRole('button', { name: /rgb/i }));

      expect(screen.getByRole('button', { name: /oklch/i })).toBeInTheDocument();

      // Click → back to HSL
      fireEvent.click(screen.getByRole('button', { name: /oklch/i }));

      expect(screen.getByRole('button', { name: /hsl/i })).toBeInTheDocument();
    });

    it('updates color name on Enter key', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('Primary');

      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      const storeColors = usePaletteStore.getState().colors;

      expect(storeColors[0].name).toBe('New Name');
    });

    it('reverts name on blur without Enter', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('Primary');

      fireEvent.change(input, { target: { value: 'New Name' } });

      expect(screen.getByDisplayValue('New Name')).toBeInTheDocument();

      fireEvent.blur(input);

      expect(screen.getByDisplayValue('Primary')).toBeInTheDocument();
    });

    it('shows remove confirmation on first click', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      const removeButton = screen.getByRole('button', { name: /remove color/i });
      const initialCount = usePaletteStore.getState().colors.length;

      fireEvent.click(removeButton);

      expect(usePaletteStore.getState().colors).toHaveLength(initialCount);
    });

    it('removes color on second click within 2 seconds', () => {
      const colors = [
        createColorEntry('Primary', TEST_COLOR),
        createColorEntry('Secondary', 'oklch(0.7 0.15 180)'),
      ];

      setupStore(colors);

      render(<ColorSelector {...createDefaultProps({ colorEntry: colors[0] })} />);

      const removeButton = screen.getByRole('button', { name: /remove color/i });

      fireEvent.click(removeButton);

      expect(usePaletteStore.getState().colors).toHaveLength(2);

      fireEvent.click(removeButton);

      expect(usePaletteStore.getState().colors).toHaveLength(1);
    });

    it('resets remove confirmation after 2 seconds', () => {
      const colors = [
        createColorEntry('Primary', TEST_COLOR),
        createColorEntry('Secondary', 'oklch(0.7 0.15 180)'),
      ];

      setupStore(colors);

      render(<ColorSelector {...createDefaultProps({ colorEntry: colors[0] })} />);

      const removeButton = screen.getByRole('button', { name: /remove color/i });

      fireEvent.click(removeButton);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      fireEvent.click(removeButton);

      expect(usePaletteStore.getState().colors).toHaveLength(2);

      fireEvent.click(removeButton);

      expect(usePaletteStore.getState().colors).toHaveLength(1);
    });

    it('disables remove when isOnlyColor is true', () => {
      render(<ColorSelector {...createDefaultProps({ isOnlyColor: true })} />);

      const removeButton = screen.getByRole('button', { name: /remove color/i });

      expect(removeButton).toBeDisabled();
    });

    it('opens options popover on gear click', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      const optionsButton = screen.getByRole('button', { name: /change color options/i });

      fireEvent.click(optionsButton);

      expect(optionsButton).toBeInTheDocument();
    });

    it('stores color values as OKLCH', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      const storeValue = usePaletteStore.getState().colors[0].value;

      expect(storeValue).toMatch(/^oklch\(/);
    });
  });
});
