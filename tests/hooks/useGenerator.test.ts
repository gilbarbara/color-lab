import { act, renderHook } from '@testing-library/react';

import useGenerator from '~/hooks/useGenerator';
import { BLUE, CRIMSON, GREEN } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { getChromaAsPercentage } from '~/utils/color';
import { createPalette, getDefaultGlobalOptions } from '~/utils/generator';

/** Id of the color at `index` in the shared per-test store. */
const colorIdAt = (index = 0) => getGeneratorStore().getState().colors[index].id;

describe('hooks/useGenerator', () => {
  beforeEach(() => {
    const palette = createPalette(CRIMSON);

    getGeneratorStore().setState({ ...palette, activeColorId: palette.colors[0].id });
  });

  describe('computed values', () => {
    it('returns baseSaturation from first color', () => {
      const { result } = renderHook(() => useGenerator('baseSaturation'));

      expect(result.current.baseSaturation).toBe(getChromaAsPercentage(CRIMSON));
    });

    it('returns defaultOptions from first color', () => {
      const { result } = renderHook(() => useGenerator('defaultOptions'));

      expect(result.current.defaultOptions).toEqual(getDefaultGlobalOptions(CRIMSON));
    });

    it('updates baseSaturation when first color changes', () => {
      const { result } = renderHook(() => useGenerator('baseSaturation', 'updateColor'));

      const initialSaturation = result.current.baseSaturation;

      act(() => {
        result.current.updateColor(colorIdAt(), { value: GREEN });
      });

      expect(result.current.baseSaturation).toBe(getChromaAsPercentage(GREEN));
      expect(result.current.baseSaturation).not.toBe(initialSaturation);
    });

    it('updates defaultOptions when first color changes', () => {
      const { result } = renderHook(() => useGenerator('defaultOptions', 'updateColor'));

      act(() => {
        result.current.updateColor(colorIdAt(), { value: BLUE });
      });

      expect(result.current.defaultOptions).toEqual(getDefaultGlobalOptions(BLUE));
    });

    it('hasCustomCurves is false at defaults (object hueShift compared deeply)', () => {
      const { result } = renderHook(() => useGenerator('hasCustomCurves'));

      expect(result.current.hasCustomCurves).toBe(false);
    });

    it('hasCustomCurves is false for a { x, x } lightnessCurve equal to the scalar default (moot Split)', () => {
      const { result } = renderHook(() => useGenerator('hasCustomCurves', 'updateGlobalOptions'));
      const scalar = getDefaultGlobalOptions(CRIMSON).lightnessCurve;

      act(() => {
        result.current.updateGlobalOptions({
          lightnessCurve: { low: scalar as number, high: scalar as number },
        });
      });

      expect(result.current.hasCustomCurves).toBe(false);
    });

    it('hasCustomCurves is true for a non-default { x, x } lightnessCurve', () => {
      const { result } = renderHook(() => useGenerator('hasCustomCurves', 'updateGlobalOptions'));

      act(() => {
        result.current.updateGlobalOptions({ lightnessCurve: { low: 1.5, high: 1.5 } });
      });

      expect(result.current.hasCustomCurves).toBe(true);
    });

    it('returns usedGroups in COLOR_GROUPS order, deduped', () => {
      act(() => {
        getGeneratorStore().getState().addColor(GREEN);
        getGeneratorStore().getState().addColor(BLUE);
      });

      const { result } = renderHook(() => useGenerator('usedGroups', 'updateColor'));

      act(() => {
        result.current.updateColor(colorIdAt(0), { group: 'semantic' });
        result.current.updateColor(colorIdAt(1), { group: 'brand' });
        result.current.updateColor(colorIdAt(2), { group: 'semantic' });
      });

      expect(result.current.usedGroups).toEqual(['brand', 'semantic']);
    });

    // The projection is a joined string, and `''.split(',')` yields `['']`, not `[]`.
    it('returns an empty usedGroups when no color has a group', () => {
      const { result } = renderHook(() => useGenerator('usedGroups'));

      expect(result.current.usedGroups).toEqual([]);
    });

    it('hasCustomCurves is true for a non-zero hueShift', () => {
      const { result } = renderHook(() => useGenerator('hasCustomCurves', 'updateGlobalOptions'));

      act(() => {
        result.current.updateGlobalOptions({ hueShift: { low: -15, high: 20 } });
      });

      expect(result.current.hasCustomCurves).toBe(true);
    });
  });

  describe('actions', () => {
    it('addColor updates state', () => {
      const { result } = renderHook(() => useGenerator('addColor', 'colors'));

      act(() => {
        result.current.addColor(GREEN);
      });

      expect(result.current.colors).toHaveLength(2);
      expect(result.current.colors[1].value).toBe(GREEN);
    });

    it('addColor with custom name', () => {
      const { result } = renderHook(() => useGenerator('addColor', 'colors'));

      act(() => {
        result.current.addColor(GREEN, 'Custom');
      });

      expect(result.current.colors[1].name).toBe('Custom');
    });

    it('removeColor updates state', () => {
      const { result } = renderHook(() => useGenerator('addColor', 'colors', 'removeColor'));

      act(() => {
        result.current.addColor(GREEN);
      });

      expect(result.current.colors).toHaveLength(2);

      act(() => {
        result.current.removeColor(colorIdAt());
      });

      expect(result.current.colors).toHaveLength(1);
      expect(result.current.colors[0].value).toBe(GREEN);
    });

    it('updateColor updates state', () => {
      const { result } = renderHook(() => useGenerator('colors', 'updateColor'));

      act(() => {
        result.current.updateColor(colorIdAt(), { name: 'New Name' });
      });

      expect(result.current.colors[0].name).toBe('New Name');
    });

    it('setColorOverride updates state', () => {
      const { result } = renderHook(() => useGenerator('colors', 'setColorOverride'));

      act(() => {
        result.current.setColorOverride(colorIdAt(), { maxLightness: 0.9 });
      });

      expect(result.current.colors[0].overrides).toEqual({ maxLightness: 0.9 });
    });

    it('clearColorOverrides updates state', () => {
      const { result } = renderHook(() =>
        useGenerator('clearColorOverrides', 'colors', 'setColorOverride'),
      );

      act(() => {
        result.current.setColorOverride(colorIdAt(), { maxLightness: 0.9 });
      });

      expect(result.current.colors[0].overrides).toBeDefined();

      act(() => {
        result.current.clearColorOverrides(colorIdAt());
      });

      expect(result.current.colors[0].overrides).toBeUndefined();
    });

    it('updateGlobalOptions updates state', () => {
      const { result } = renderHook(() => useGenerator('globalOptions', 'updateGlobalOptions'));

      act(() => {
        result.current.updateGlobalOptions({ lightnessCurve: 2.0 });
      });

      expect(result.current.globalOptions.lightnessCurve).toBe(2.0);
    });

    it('resetGlobalOptions resets to defaults', () => {
      const { result } = renderHook(() =>
        useGenerator('globalOptions', 'resetGlobalOptions', 'updateGlobalOptions'),
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
        useGenerator('addColor', 'colors', 'globalOptions', 'resetPalette', 'updateGlobalOptions'),
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
      const { result } = renderHook(() => useGenerator('activeColorId', 'colors'));

      expect(result.current.activeColorId).toBe(result.current.colors[0].id);
    });

    it('setActiveColor with valid id updates active', () => {
      const { result } = renderHook(() =>
        useGenerator('activeColorId', 'addColor', 'colors', 'setActiveColor'),
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
      const { result } = renderHook(() => useGenerator('activeColorId', 'setActiveColor'));
      const initialActive = result.current.activeColorId;

      act(() => {
        result.current.setActiveColor('does-not-exist');
      });

      expect(result.current.activeColorId).toBe(initialActive);
    });

    it('addColor activates the new color', () => {
      const { result } = renderHook(() => useGenerator('activeColorId', 'addColor', 'colors'));

      act(() => {
        result.current.addColor(GREEN);
      });

      expect(result.current.activeColorId).toBe(result.current.colors[1].id);
    });

    it('removeColor of active picks next neighbor', () => {
      const { result } = renderHook(() =>
        useGenerator('activeColorId', 'addColor', 'colors', 'removeColor', 'setActiveColor'),
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

      let returnedId: string | null = null;

      act(() => {
        returnedId = result.current.removeColor(middleId);
      });

      expect(result.current.activeColorId).toBe(lastId);
      expect(returnedId).toBe(lastId);
    });

    it('removeColor of last (active) falls back to previous', () => {
      const { result } = renderHook(() =>
        useGenerator('activeColorId', 'addColor', 'colors', 'removeColor', 'setActiveColor'),
      );

      act(() => {
        result.current.addColor(GREEN);
      });

      const firstId = result.current.colors[0].id;
      const lastId = result.current.colors[1].id;

      act(() => {
        result.current.setActiveColor(lastId);
      });

      let returnedId: string | null = null;

      act(() => {
        returnedId = result.current.removeColor(lastId);
      });

      expect(result.current.activeColorId).toBe(firstId);
      expect(returnedId).toBe(firstId);
    });

    it('removeColor of non-active leaves active unchanged', () => {
      const { result } = renderHook(() =>
        useGenerator('activeColorId', 'addColor', 'colors', 'removeColor', 'setActiveColor'),
      );

      act(() => {
        result.current.addColor(GREEN);
      });

      const firstId = result.current.colors[0].id;
      const lastId = result.current.colors[1].id;

      act(() => {
        result.current.setActiveColor(firstId);
      });

      let returnedId: string | null = null;

      act(() => {
        returnedId = result.current.removeColor(lastId);
      });

      expect(result.current.activeColorId).toBe(firstId);
      expect(returnedId).toBe(firstId);
    });

    it('resetPalette sets active to new first color', () => {
      const { result } = renderHook(() =>
        useGenerator('activeColorId', 'addColor', 'colors', 'resetPalette', 'setActiveColor'),
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

        return useGenerator('addColor');
      });

      const initialAddColor = result.current.addColor;

      expect(renderCount).toBe(1);

      act(() => {
        getGeneratorStore().getState().updateColor(colorIdAt(), { name: 'Renamed' });
      });
      expect(renderCount).toBe(1);

      act(() => {
        getGeneratorStore().getState().updateGlobalOptions({ lightnessCurve: 1.5 });
      });
      expect(renderCount).toBe(1);

      act(() => {
        getGeneratorStore().getState().setActiveColor(getGeneratorStore().getState().colors[0].id);
      });
      expect(renderCount).toBe(1);

      expect(result.current.addColor).toBe(initialAddColor);
    });

    it('generatorUrl consumer ignores active/preview changes', () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;

        return useGenerator('generatorUrl');
      });

      const initialUrl = result.current.generatorUrl;

      expect(renderCount).toBe(1);

      act(() => {
        getGeneratorStore().getState().setPreviewColor(getGeneratorStore().getState().colors[0].id);
      });
      expect(renderCount).toBe(1);

      act(() => {
        getGeneratorStore().getState().updateColor(colorIdAt(), { value: GREEN });
      });
      expect(renderCount).toBe(2);
      expect(result.current.generatorUrl).not.toBe(initialUrl);
    });

    it('activeColorId consumer ignores globalOptions changes', () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;

        return useGenerator('activeColorId');
      });

      expect(renderCount).toBe(1);

      act(() => {
        getGeneratorStore().getState().updateGlobalOptions({ lightnessCurve: 2 });
      });
      expect(renderCount).toBe(1);

      act(() => {
        getGeneratorStore().getState().addColor(GREEN);
      });
      expect(renderCount).toBe(2);
      expect(result.current.activeColorId).toBe(getGeneratorStore().getState().colors[1].id);
    });

    it('baseSaturation consumer ignores globalOptions changes', () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;

        return useGenerator('baseSaturation');
      });

      const initial = result.current.baseSaturation;

      expect(renderCount).toBe(1);

      act(() => {
        getGeneratorStore().getState().updateGlobalOptions({ lightnessCurve: 2 });
      });
      expect(renderCount).toBe(1);

      act(() => {
        getGeneratorStore().getState().updateColor(colorIdAt(), { value: GREEN });
      });
      expect(renderCount).toBe(2);
      expect(result.current.baseSaturation).not.toBe(initial);
    });

    it('colorCount consumer ignores color edits', () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;

        return useGenerator('colorCount');
      });

      expect(result.current.colorCount).toBe(1);
      expect(renderCount).toBe(1);

      act(() => {
        getGeneratorStore().getState().updateColor(colorIdAt(), { value: GREEN });
      });
      expect(renderCount).toBe(1);

      act(() => {
        getGeneratorStore().getState().addColor(BLUE);
      });
      expect(renderCount).toBe(2);
      expect(result.current.colorCount).toBe(2);

      act(() => {
        getGeneratorStore().getState().removeColor(colorIdAt(1));
      });
      expect(renderCount).toBe(3);
      expect(result.current.colorCount).toBe(1);
    });

    it('usedGroups consumer ignores color edits and only re-renders when the group set changes', () => {
      act(() => {
        getGeneratorStore().getState().addColor(GREEN);
      });

      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;

        return useGenerator('usedGroups');
      });

      const initial = result.current.usedGroups;

      expect(renderCount).toBe(1);

      act(() => {
        getGeneratorStore().getState().updateColor(colorIdAt(), { value: BLUE });
      });
      expect(renderCount).toBe(1);

      act(() => {
        getGeneratorStore().getState().updateGlobalOptions({ lightnessCurve: 2 });
      });
      expect(renderCount).toBe(1);

      // Same array identity across unrelated edits — the consumer can use it as a hook dep.
      expect(result.current.usedGroups).toBe(initial);

      act(() => {
        getGeneratorStore().getState().updateColor(colorIdAt(0), { group: 'brand' });
      });
      expect(renderCount).toBe(2);
      expect(result.current.usedGroups).toEqual(['brand']);

      // A second color joining a group already in use leaves the set unchanged.
      act(() => {
        getGeneratorStore().getState().updateColor(colorIdAt(1), { group: 'brand' });
      });
      expect(renderCount).toBe(2);
      expect(result.current.usedGroups).toEqual(['brand']);
    });

    it('returned object stays shallow-stable across unrelated mutations', () => {
      const { result } = renderHook(() => useGenerator('colors', 'globalOptions'));

      const previous = result.current;

      act(() => {
        getGeneratorStore().getState().setActiveColor(getGeneratorStore().getState().colors[0].id);
      });

      expect(result.current).toBe(previous);
    });
  });
});
