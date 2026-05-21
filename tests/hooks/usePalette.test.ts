import { act, renderHook } from '@testing-library/react';

import usePalette from '~/hooks/usePalette';
import { usePaletteStore } from '~/stores/paletteStore';
import { BLUE, CRIMSON, GREEN } from '~/test-fixtures';
import { getChromaAsPercentage } from '~/utils/color';
import { createPalette, getDefaultGlobalOptions } from '~/utils/palette';

vi.mock('react-router', () => ({
  useLocation: () => ({ pathname: '/', search: '' }),
  useNavigate: () => vi.fn(),
}));

describe('hooks/usePalette', () => {
  beforeEach(() => {
    const palette = createPalette(CRIMSON);

    usePaletteStore.setState({ ...palette, activeColorId: palette.colors[0].id });
  });

  describe('computed values', () => {
    it('returns baseSaturation from first color', () => {
      const { result } = renderHook(() => usePalette('baseSaturation'));

      expect(result.current.baseSaturation).toBe(getChromaAsPercentage(CRIMSON));
    });

    it('returns defaultOptions from first color', () => {
      const { result } = renderHook(() => usePalette('defaultOptions'));

      expect(result.current.defaultOptions).toEqual(getDefaultGlobalOptions(CRIMSON));
    });

    it('updates baseSaturation when first color changes', () => {
      const { result } = renderHook(() => usePalette('baseSaturation', 'updateColor'));

      const initialSaturation = result.current.baseSaturation;

      act(() => {
        result.current.updateColor(0, { value: GREEN });
      });

      expect(result.current.baseSaturation).toBe(getChromaAsPercentage(GREEN));
      expect(result.current.baseSaturation).not.toBe(initialSaturation);
    });

    it('updates defaultOptions when first color changes', () => {
      const { result } = renderHook(() => usePalette('defaultOptions', 'updateColor'));

      act(() => {
        result.current.updateColor(0, { value: BLUE });
      });

      expect(result.current.defaultOptions).toEqual(getDefaultGlobalOptions(BLUE));
    });
  });

  describe('actions', () => {
    it('addColor updates state', () => {
      const { result } = renderHook(() => usePalette('addColor', 'colors'));

      act(() => {
        result.current.addColor(GREEN);
      });

      expect(result.current.colors).toHaveLength(2);
      expect(result.current.colors[1].value).toBe(GREEN);
    });

    it('addColor with custom name', () => {
      const { result } = renderHook(() => usePalette('addColor', 'colors'));

      act(() => {
        result.current.addColor(GREEN, 'Custom');
      });

      expect(result.current.colors[1].name).toBe('Custom');
    });

    it('removeColor updates state', () => {
      const { result } = renderHook(() => usePalette('addColor', 'colors', 'removeColor'));

      act(() => {
        result.current.addColor(GREEN);
      });

      expect(result.current.colors).toHaveLength(2);

      act(() => {
        result.current.removeColor(0);
      });

      expect(result.current.colors).toHaveLength(1);
      expect(result.current.colors[0].value).toBe(GREEN);
    });

    it('updateColor updates state', () => {
      const { result } = renderHook(() => usePalette('colors', 'updateColor'));

      act(() => {
        result.current.updateColor(0, { name: 'New Name' });
      });

      expect(result.current.colors[0].name).toBe('New Name');
    });

    it('setColorOverride updates state', () => {
      const { result } = renderHook(() => usePalette('colors', 'setColorOverride'));

      act(() => {
        result.current.setColorOverride(0, { maxLightness: 0.9 });
      });

      expect(result.current.colors[0].overrides).toEqual({ maxLightness: 0.9 });
    });

    it('clearColorOverrides updates state', () => {
      const { result } = renderHook(() =>
        usePalette('clearColorOverrides', 'colors', 'setColorOverride'),
      );

      act(() => {
        result.current.setColorOverride(0, { maxLightness: 0.9 });
      });

      expect(result.current.colors[0].overrides).toBeDefined();

      act(() => {
        result.current.clearColorOverrides(0);
      });

      expect(result.current.colors[0].overrides).toBeUndefined();
    });

    it('updateGlobalOptions updates state', () => {
      const { result } = renderHook(() => usePalette('globalOptions', 'updateGlobalOptions'));

      act(() => {
        result.current.updateGlobalOptions({ lightnessCurve: 2.0 });
      });

      expect(result.current.globalOptions.lightnessCurve).toBe(2.0);
    });

    it('resetGlobalOptions resets to defaults', () => {
      const { result } = renderHook(() =>
        usePalette('globalOptions', 'resetGlobalOptions', 'updateGlobalOptions'),
      );

      act(() => {
        result.current.updateGlobalOptions({ lightnessCurve: 2.0, steps: 15 });
      });

      expect(result.current.globalOptions.lightnessCurve).toBe(2.0);

      act(() => {
        result.current.resetGlobalOptions();
      });

      const expectedDefaults = getDefaultGlobalOptions(CRIMSON);

      expect(result.current.globalOptions.lightnessCurve).toBe(expectedDefaults.lightnessCurve);
      expect(result.current.globalOptions.steps).toBe(expectedDefaults.steps);
    });

    it('resetPalette creates new palette', () => {
      const { result } = renderHook(() =>
        usePalette('addColor', 'colors', 'globalOptions', 'resetPalette', 'updateGlobalOptions'),
      );

      act(() => {
        result.current.addColor(GREEN);
        result.current.updateGlobalOptions({ lightnessCurve: 2.0 });
      });

      expect(result.current.colors).toHaveLength(2);

      act(() => {
        result.current.resetPalette();
      });

      expect(result.current.colors).toHaveLength(1);
      expect(result.current.colors[0].name).toBe('Primary');
      expect(result.current.globalOptions).toEqual(
        getDefaultGlobalOptions(result.current.colors[0].value),
      );
    });
  });

  describe('activeColor', () => {
    it('initializes activeColorId to first color id', () => {
      const { result } = renderHook(() => usePalette('activeColorId', 'colors'));

      expect(result.current.activeColorId).toBe(result.current.colors[0].id);
    });

    it('setActiveColor with valid id updates active', () => {
      const { result } = renderHook(() =>
        usePalette('activeColorId', 'addColor', 'colors', 'setActiveColor'),
      );

      act(() => {
        result.current.addColor(GREEN);
      });

      const secondId = result.current.colors[1].id;

      act(() => {
        result.current.setActiveColor(secondId);
      });

      expect(result.current.activeColorId).toBe(secondId);
    });

    it('setActiveColor with unknown id is a no-op', () => {
      const { result } = renderHook(() => usePalette('activeColorId', 'setActiveColor'));
      const initialActive = result.current.activeColorId;

      act(() => {
        result.current.setActiveColor('does-not-exist');
      });

      expect(result.current.activeColorId).toBe(initialActive);
    });

    it('addColor activates the new color', () => {
      const { result } = renderHook(() => usePalette('activeColorId', 'addColor', 'colors'));

      act(() => {
        result.current.addColor(GREEN);
      });

      expect(result.current.activeColorId).toBe(result.current.colors[1].id);
    });

    it('removeColor of active picks next neighbor', () => {
      const { result } = renderHook(() =>
        usePalette('activeColorId', 'addColor', 'colors', 'removeColor', 'setActiveColor'),
      );

      act(() => {
        result.current.addColor(GREEN);
        result.current.addColor(BLUE);
      });

      const middleId = result.current.colors[1].id;
      const lastId = result.current.colors[2].id;

      act(() => {
        result.current.setActiveColor(middleId);
      });

      expect(result.current.activeColorId).toBe(middleId);

      act(() => {
        result.current.removeColor(1);
      });

      expect(result.current.activeColorId).toBe(lastId);
    });

    it('removeColor of last (active) falls back to previous', () => {
      const { result } = renderHook(() =>
        usePalette('activeColorId', 'addColor', 'colors', 'removeColor', 'setActiveColor'),
      );

      act(() => {
        result.current.addColor(GREEN);
      });

      const firstId = result.current.colors[0].id;
      const lastId = result.current.colors[1].id;

      act(() => {
        result.current.setActiveColor(lastId);
      });

      act(() => {
        result.current.removeColor(1);
      });

      expect(result.current.activeColorId).toBe(firstId);
    });

    it('removeColor of non-active leaves active unchanged', () => {
      const { result } = renderHook(() =>
        usePalette('activeColorId', 'addColor', 'colors', 'removeColor', 'setActiveColor'),
      );

      act(() => {
        result.current.addColor(GREEN);
      });

      const firstId = result.current.colors[0].id;

      act(() => {
        result.current.setActiveColor(firstId);
      });

      act(() => {
        result.current.removeColor(1);
      });

      expect(result.current.activeColorId).toBe(firstId);
    });

    it('resetPalette sets active to new first color', () => {
      const { result } = renderHook(() =>
        usePalette('activeColorId', 'addColor', 'colors', 'resetPalette', 'setActiveColor'),
      );

      act(() => {
        result.current.addColor(GREEN);
      });

      act(() => {
        result.current.setActiveColor(result.current.colors[1].id);
      });

      act(() => {
        result.current.resetPalette();
      });

      expect(result.current.activeColorId).toBe(result.current.colors[0].id);
    });
  });

  describe('subscription stability', () => {
    it('action-only consumer never re-renders on unrelated state changes', () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;

        return usePalette('addColor');
      });

      const initialAddColor = result.current.addColor;

      expect(renderCount).toBe(1);

      act(() => {
        usePaletteStore.getState().updateColor(0, { name: 'Renamed' });
      });
      expect(renderCount).toBe(1);

      act(() => {
        usePaletteStore.getState().updateGlobalOptions({ lightnessCurve: 1.5 });
      });
      expect(renderCount).toBe(1);

      act(() => {
        usePaletteStore.getState().setActiveColor(usePaletteStore.getState().colors[0].id);
      });
      expect(renderCount).toBe(1);

      expect(result.current.addColor).toBe(initialAddColor);
    });

    it('generatorUrl consumer ignores active/preview changes', () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;

        return usePalette('generatorUrl');
      });

      const initialUrl = result.current.generatorUrl;

      expect(renderCount).toBe(1);

      act(() => {
        usePaletteStore.getState().setPreviewColor(usePaletteStore.getState().colors[0].id);
      });
      expect(renderCount).toBe(1);

      act(() => {
        usePaletteStore.getState().updateColor(0, { value: GREEN });
      });
      expect(renderCount).toBe(2);
      expect(result.current.generatorUrl).not.toBe(initialUrl);
    });

    it('activeColorId consumer ignores globalOptions changes', () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;

        return usePalette('activeColorId');
      });

      expect(renderCount).toBe(1);

      act(() => {
        usePaletteStore.getState().updateGlobalOptions({ lightnessCurve: 2 });
      });
      expect(renderCount).toBe(1);

      act(() => {
        usePaletteStore.getState().addColor(GREEN);
      });
      expect(renderCount).toBe(2);
      expect(result.current.activeColorId).toBe(usePaletteStore.getState().colors[1].id);
    });

    it('baseSaturation consumer ignores globalOptions changes', () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;

        return usePalette('baseSaturation');
      });

      const initial = result.current.baseSaturation;

      expect(renderCount).toBe(1);

      act(() => {
        usePaletteStore.getState().updateGlobalOptions({ lightnessCurve: 2 });
      });
      expect(renderCount).toBe(1);

      act(() => {
        usePaletteStore.getState().updateColor(0, { value: GREEN });
      });
      expect(renderCount).toBe(2);
      expect(result.current.baseSaturation).not.toBe(initial);
    });

    it('returned object stays shallow-stable across unrelated mutations', () => {
      const { result } = renderHook(() => usePalette('colors', 'globalOptions'));

      const previous = result.current;

      act(() => {
        usePaletteStore.getState().setActiveColor(usePaletteStore.getState().colors[0].id);
      });

      expect(result.current).toBe(previous);
    });
  });
});
