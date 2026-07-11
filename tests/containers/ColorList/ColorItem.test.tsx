import * as Sentry from '@sentry/nextjs';
import userEvent from '@testing-library/user-event';

import { BLUE, createColorEntry, CRIMSON, GREEN } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { act, fireEvent, render, screen } from '~/test-utils';
import { trackEvent } from '~/utils/analytics';
import { getChromaAsPercentage, getRandomColor, toOklch } from '~/utils/color';
import { createPalette, getDefaultGlobalOptions } from '~/utils/generator';

import ColorItem from '~/containers/ColorList/ColorItem';

import type { ColorEntry } from '~/types';

vi.mock('~/utils/analytics', () => ({
  trackEvent: vi.fn(),
  trackPage: vi.fn(),
}));

// Keep the real module but stub captureException so it is assertable (ESM exports
// are not directly spyable via vi.spyOn).
vi.mock('@sentry/nextjs', async importOriginal => {
  const actual = await importOriginal<typeof import('@sentry/nextjs')>();

  return { ...actual, captureException: vi.fn() };
});

// Keep real implementations but make each export a spy so individual calls can be
// overridden per test (toOklch throwing, getRandomColor returning a fixed color).
vi.mock('~/utils/color', { spy: true });

function createDefaultProps(overrides: Partial<Parameters<typeof ColorItem>[0]> = {}) {
  return {
    colorEntry: createColorEntry('Primary', CRIMSON),
    index: 0,
    isOnlyColor: false,
    saturationOverride: getDefaultGlobalOptions(CRIMSON).saturationOverride,
    ...overrides,
  };
}

function renderActive(propsOverrides: Partial<Parameters<typeof ColorItem>[0]> = {}) {
  const props = createDefaultProps(propsOverrides);

  setupStore([props.colorEntry]);

  return { ...render(<ColorItem {...props} />), props };
}

// The color mode lives behind a HeroUI Dropdown whose menu opens asynchronously.
// Its findByRole polling can't advance under vitest fake timers, so switch to real
// timers and drive the menu with userEvent (the next test's beforeEach restores fake timers).
async function selectMode(name: 'OKLCH' | 'HSL' | 'RGB') {
  vi.useRealTimers();

  const user = userEvent.setup();

  await user.click(screen.getByRole('button', { name: /color mode/i }));
  await user.click(await screen.findByRole('menuitemradio', { name }));
}

function setupStore(colors: ColorEntry[], activeIndex: number | null = 0) {
  const palette = createPalette(CRIMSON);

  palette.colors = colors;

  getGeneratorStore().setState({
    ...palette,
    activeColorId: activeIndex === null ? null : (colors[activeIndex]?.id ?? null),
  });
}

describe('ColorItem', () => {
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

    it('renders correctly in HSL mode', async () => {
      const { container } = renderActive();

      await selectMode('HSL');

      expect(container).toMatchSnapshot();
    });

    it('renders correctly in RGB mode', async () => {
      const { container } = renderActive();

      await selectMode('RGB');

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('starts in OKLCH mode', () => {
      renderActive();

      expect(screen.getByRole('button', { name: /color mode/i })).toHaveTextContent('OKLCH');
    });

    it('updates color name on Enter key', () => {
      renderActive();

      const input = screen.getByDisplayValue('Primary');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      const storeColors = getGeneratorStore().getState().colors;

      expect(storeColors[0].name).toBe('New Name');
    });

    it('saves color name on blur', () => {
      renderActive();

      const input = screen.getByDisplayValue('Primary');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.blur(input);

      const storeColors = getGeneratorStore().getState().colors;

      expect(storeColors[0].name).toBe('New Name');
    });

    it('discards color name on Escape', () => {
      renderActive();

      const input = screen.getByDisplayValue('Primary');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Escape' });
      fireEvent.blur(input);

      const storeColors = getGeneratorStore().getState().colors;

      expect(storeColors[0].name).toBe('Primary');
      expect(screen.getByDisplayValue('Primary')).toBeInTheDocument();
    });

    it('shows remove confirmation on first click', () => {
      renderActive();

      const removeButton = screen.getByRole('button', { name: /remove color/i });
      const initialCount = getGeneratorStore().getState().colors.length;

      fireEvent.click(removeButton);

      expect(getGeneratorStore().getState().colors).toHaveLength(initialCount);
    });

    it('removes color on second click within 2 seconds', () => {
      const colors = [createColorEntry('Primary', CRIMSON), createColorEntry('Secondary', BLUE)];

      setupStore(colors);

      render(<ColorItem {...createDefaultProps({ colorEntry: colors[0] })} />);

      const removeButton = screen.getByRole('button', { name: /remove color/i });

      fireEvent.click(removeButton);

      expect(getGeneratorStore().getState().colors).toHaveLength(2);

      fireEvent.click(removeButton);

      expect(getGeneratorStore().getState().colors).toHaveLength(1);
    });

    it('resets remove confirmation after 2 seconds', () => {
      const colors = [createColorEntry('Primary', CRIMSON), createColorEntry('Secondary', BLUE)];

      setupStore(colors);

      render(<ColorItem {...createDefaultProps({ colorEntry: colors[0] })} />);

      const removeButton = screen.getByRole('button', { name: /remove color/i });

      fireEvent.click(removeButton);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      fireEvent.click(removeButton);

      expect(getGeneratorStore().getState().colors).toHaveLength(2);

      fireEvent.click(removeButton);

      expect(getGeneratorStore().getState().colors).toHaveLength(1);
    });

    it('disables remove when isOnlyColor is true', () => {
      renderActive({ isOnlyColor: true });

      const removeButton = screen.getByRole('button', { name: /remove color/i });

      expect(removeButton).toBeDisabled();
    });

    it('opens options on gear click and tracks the event', () => {
      renderActive();

      fireEvent.click(screen.getByRole('button', { name: /change color options/i }));

      expect(trackEvent).toHaveBeenCalledWith('color:options');
    });

    it('activates color in store on first click of inactive item', () => {
      const colors = [createColorEntry('Primary', CRIMSON), createColorEntry('Secondary', BLUE)];

      setupStore(colors, 0);

      render(<ColorItem {...createDefaultProps({ colorEntry: colors[1], index: 1 })} />);

      expect(getGeneratorStore().getState().activeColorId).toBe(colors[0].id);

      fireEvent.click(screen.getByTestId('ColorItem'));

      expect(getGeneratorStore().getState().activeColorId).toBe(colors[1].id);
    });

    it('reflects external name change when prop updates with same id (URL sync)', () => {
      const entry = createColorEntry('Primary', CRIMSON);

      setupStore([entry]);

      const { rerender } = render(<ColorItem {...createDefaultProps({ colorEntry: entry })} />);

      expect(screen.getByDisplayValue('Primary')).toBeInTheDocument();

      const renamed = { ...entry, name: 'Brand' };

      act(() => {
        setupStore([renamed]);
      });

      rerender(<ColorItem {...createDefaultProps({ colorEntry: renamed })} />);

      expect(screen.getByDisplayValue('Brand')).toBeInTheDocument();
    });

    it('preserves in-progress name edit when prop changes externally', () => {
      const entry = createColorEntry('Primary', CRIMSON);

      setupStore([entry]);

      const { rerender } = render(<ColorItem {...createDefaultProps({ colorEntry: entry })} />);

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

      rerender(<ColorItem {...createDefaultProps({ colorEntry: renamed })} />);

      // Draft is preserved while editing; external prop change does not override
      expect(screen.getByDisplayValue('Foo')).toBeInTheDocument();
    });

    it('updates the color and syncs global saturation when editing the first color', () => {
      renderActive();

      fireEvent.change(screen.getByLabelText('Color value'), { target: { value: '00ff00' } });

      act(() => {
        vi.advanceTimersByTime(16);
      });

      const expected = toOklch('#00ff00');
      const state = getGeneratorStore().getState();

      expect(state.colors[0].value).toBe(expected);
      expect(state.globalOptions.saturation).toBe(getChromaAsPercentage(expected));
    });

    it('does not sync global saturation when editing a non-first color', () => {
      const colors = [createColorEntry('Primary', CRIMSON), createColorEntry('Secondary', BLUE)];

      setupStore(colors, 1);

      render(<ColorItem {...createDefaultProps({ colorEntry: colors[1], index: 1 })} />);

      const initialSaturation = getGeneratorStore().getState().globalOptions.saturation;

      fireEvent.change(screen.getByLabelText('Color value'), { target: { value: '00ff00' } });

      act(() => {
        vi.advanceTimersByTime(16);
      });

      const state = getGeneratorStore().getState();

      expect(state.colors[1].value).toBe(toOklch('#00ff00'));
      expect(state.globalOptions.saturation).toBe(initialSaturation);
    });

    it('captures invalid color values via Sentry without mutating the store', () => {
      renderActive();

      const originalValue = getGeneratorStore().getState().colors[0].value;

      // Arm the throw only for the next toOklch call (the handler's), after all
      // setup calls (createColorEntry / getDefaultGlobalOptions) have run.
      vi.mocked(toOklch).mockImplementationOnce(() => {
        throw new Error('bad color');
      });

      fireEvent.change(screen.getByLabelText('Color value'), { target: { value: '00ff00' } });

      act(() => {
        vi.advanceTimersByTime(16);
      });

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: { source: 'ColorItem', call: 'handleChangeColor' },
        }),
      );
      expect(getGeneratorStore().getState().colors[0].value).toBe(originalValue);
    });

    it('sets a random color and tracks the event', () => {
      vi.mocked(getRandomColor).mockReturnValueOnce(GREEN);

      renderActive();

      fireEvent.click(screen.getByRole('button', { name: /random color/i }));

      act(() => {
        vi.advanceTimersByTime(16);
      });

      expect(trackEvent).toHaveBeenCalledWith('color:randomize');
      expect(getGeneratorStore().getState().colors[0].value).toBe(GREEN);
    });

    it('sets the preview color and tracks the event', () => {
      const spy = vi.spyOn(getGeneratorStore().getState(), 'setPreviewColor');

      const { props } = renderActive();

      fireEvent.click(screen.getByRole('button', { name: /view live preview/i }));

      expect(spy).toHaveBeenCalledExactlyOnceWith(props.colorEntry.id);
    });

    it('switches the color mode and tracks the change', async () => {
      renderActive();

      await selectMode('HSL');

      expect(trackEvent).toHaveBeenCalledWith('color:mode', { value: 'hsl' });
      // The value input reflects the new mode: hex instead of an oklch() string.
      const input = screen.getByLabelText('Color value') as HTMLInputElement;

      expect(input.value).not.toContain('oklch');
    });

    it('ignores a click on the already-active mode', async () => {
      renderActive();

      await selectMode('OKLCH');

      expect(trackEvent).not.toHaveBeenCalledWith('color:mode', expect.anything());
    });
  });
});
