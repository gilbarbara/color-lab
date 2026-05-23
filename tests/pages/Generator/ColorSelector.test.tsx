import { usePaletteStore } from '~/stores/paletteStore';
import { BLUE, CRIMSON } from '~/test-fixtures';
import { act, fireEvent, render, screen } from '~/test-utils';
import { toOklch } from '~/utils/color';
import { createPalette, getDefaultGlobalOptions } from '~/utils/palette';

import ColorSelector from '~/pages/Generator/ColorList/ColorSelector';

import type { ColorEntry, GlobalScaleOptions } from '~/types';

function createColorEntry(
  name: string,
  value: string,
  overrides?: ColorEntry['overrides'],
): ColorEntry {
  return {
    id: crypto.randomUUID(),
    name,
    value: toOklch(value),
    ...(overrides && { overrides }),
  };
}

function createDefaultProps(overrides: Partial<Parameters<typeof ColorSelector>[0]> = {}) {
  const globalOptions: GlobalScaleOptions = getDefaultGlobalOptions(CRIMSON);

  return {
    colorEntry: createColorEntry('Primary', CRIMSON),
    globalOptions,
    index: 0,
    isOnlyColor: false,
    ...overrides,
  };
}

function renderActive(propsOverrides: Partial<Parameters<typeof ColorSelector>[0]> = {}) {
  const props = createDefaultProps(propsOverrides);

  setupStore([props.colorEntry]);

  return { ...render(<ColorSelector {...props} />), props };
}

function setupStore(colors: ColorEntry[], activeIndex: number | null = 0) {
  const palette = createPalette(CRIMSON);

  palette.colors = colors;

  usePaletteStore.setState({
    ...palette,
    activeColorId: activeIndex === null ? null : (colors[activeIndex]?.id ?? null),
  });
}

describe('ColorSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Render', () => {
    it('renders correctly in OKLCH mode', () => {
      const { container } = renderActive();

      expect(container).toMatchSnapshot();
    });

    it('renders correctly in HSL mode', () => {
      const { container } = renderActive();

      fireEvent.click(screen.getByLabelText('Switch to HSL'));

      expect(container).toMatchSnapshot();
    });

    it('renders correctly in RGB mode', () => {
      const { container } = renderActive();

      fireEvent.click(screen.getByLabelText('Switch to RGB'));

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('starts in OKLCH mode', () => {
      renderActive();

      expect(screen.getByLabelText('Switch to OKLCH')).toBeInTheDocument();
    });

    it('updates color name on Enter key', () => {
      renderActive();

      const input = screen.getByDisplayValue('Primary');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      const storeColors = usePaletteStore.getState().colors;

      expect(storeColors[0].name).toBe('New Name');
    });

    it('saves color name on blur', () => {
      renderActive();

      const input = screen.getByDisplayValue('Primary');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.blur(input);

      const storeColors = usePaletteStore.getState().colors;

      expect(storeColors[0].name).toBe('New Name');
    });

    it('discards color name on Escape', () => {
      renderActive();

      const input = screen.getByDisplayValue('Primary');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Escape' });
      fireEvent.blur(input);

      const storeColors = usePaletteStore.getState().colors;

      expect(storeColors[0].name).toBe('Primary');
      expect(screen.getByDisplayValue('Primary')).toBeInTheDocument();
    });

    it('shows remove confirmation on first click', () => {
      renderActive();

      const removeButton = screen.getByRole('button', { name: /remove color/i });
      const initialCount = usePaletteStore.getState().colors.length;

      fireEvent.click(removeButton);

      expect(usePaletteStore.getState().colors).toHaveLength(initialCount);
    });

    it('removes color on second click within 2 seconds', () => {
      const colors = [createColorEntry('Primary', CRIMSON), createColorEntry('Secondary', BLUE)];

      setupStore(colors);

      render(<ColorSelector {...createDefaultProps({ colorEntry: colors[0] })} />);

      const removeButton = screen.getByRole('button', { name: /remove color/i });

      fireEvent.click(removeButton);

      expect(usePaletteStore.getState().colors).toHaveLength(2);

      fireEvent.click(removeButton);

      expect(usePaletteStore.getState().colors).toHaveLength(1);
    });

    it('resets remove confirmation after 2 seconds', () => {
      const colors = [createColorEntry('Primary', CRIMSON), createColorEntry('Secondary', BLUE)];

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
      renderActive({ isOnlyColor: true });

      const removeButton = screen.getByRole('button', { name: /remove color/i });

      expect(removeButton).toBeDisabled();
    });

    it('opens options popover on gear click', () => {
      renderActive();

      const optionsButton = screen.getByRole('button', { name: /change color options/i });

      fireEvent.click(optionsButton);

      expect(optionsButton).toBeInTheDocument();
    });

    it('activates color in store on first click of inactive item', () => {
      const colors = [createColorEntry('Primary', CRIMSON), createColorEntry('Secondary', BLUE)];

      setupStore(colors, 0);

      render(<ColorSelector {...createDefaultProps({ colorEntry: colors[1], index: 1 })} />);

      expect(usePaletteStore.getState().activeColorId).toBe(colors[0].id);

      fireEvent.click(screen.getByTestId('ColorSelector'));

      expect(usePaletteStore.getState().activeColorId).toBe(colors[1].id);
    });

    it('reflects external name change when prop updates with same id (URL sync)', () => {
      const entry = createColorEntry('Primary', CRIMSON);

      setupStore([entry]);

      const { rerender } = render(<ColorSelector {...createDefaultProps({ colorEntry: entry })} />);

      expect(screen.getByDisplayValue('Primary')).toBeInTheDocument();

      const renamed = { ...entry, name: 'Brand' };

      act(() => {
        setupStore([renamed]);
      });

      rerender(<ColorSelector {...createDefaultProps({ colorEntry: renamed })} />);

      expect(screen.getByDisplayValue('Brand')).toBeInTheDocument();
    });

    it('preserves in-progress name edit when prop changes externally', () => {
      const entry = createColorEntry('Primary', CRIMSON);

      setupStore([entry]);

      const { rerender } = render(<ColorSelector {...createDefaultProps({ colorEntry: entry })} />);

      const input = screen.getByDisplayValue('Primary') as HTMLInputElement;

      act(() => {
        input.focus();
      });
      fireEvent.change(input, { target: { value: 'Foo' } });

      expect(screen.getByDisplayValue('Foo')).toBeInTheDocument();

      const renamed = { ...entry, name: 'Brand' };

      act(() => {
        setupStore([renamed]);
      });

      rerender(<ColorSelector {...createDefaultProps({ colorEntry: renamed })} />);

      // Draft is preserved while editing; external prop change does not override
      expect(screen.getByDisplayValue('Foo')).toBeInTheDocument();
    });
  });
});
