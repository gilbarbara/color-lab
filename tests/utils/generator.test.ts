import { createColorEntry, createTestPalette, CRIMSON, GREEN, SLATE, WHITE } from '~/test-fixtures';
import {
  addColor,
  clearColorOverrides,
  createPalette,
  CURVE_OPTION_KEYS,
  getDefaultColorName,
  getDefaultGlobalOptions,
  getEffectiveOptions,
  MAX_COLORS,
  removeColor,
  reorderColors,
  resetGlobalOptions,
  resetPalette,
  setColorOverride,
  updateColor,
  updateGlobalOptions,
} from '~/utils/generator';

import type { GeneratorState } from '~/types';

describe('utils/generator', () => {
  describe('getDefaultGlobalOptions', () => {
    it('defaults hueShift to a zero scalar (Simple mode)', () => {
      expect(getDefaultGlobalOptions(CRIMSON).hueShift).toBe(0);
    });
  });

  describe('CURVE_OPTION_KEYS', () => {
    it('includes hueShift', () => {
      expect(CURVE_OPTION_KEYS).toContain('hueShift');
    });
  });

  describe('createPalette', () => {
    it('creates palette with random color when no arg provided', () => {
      const palette = createPalette();

      expect(palette.colors).toHaveLength(1);
      expect(palette.colors[0].name).toBe('Primary');
      expect(palette.colors[0].value).toMatch(/^oklch\(/);
      // globalOptions should use computed defaults based on the random color
      expect(palette.globalOptions).toEqual(getDefaultGlobalOptions(palette.colors[0].value));
    });

    it('creates palette with provided color', () => {
      const palette = createPalette(CRIMSON);

      expect(palette.colors).toHaveLength(1);
      expect(palette.colors[0].value).toBe(CRIMSON);
      // Saturation should be computed from the provided color
      expect(palette.globalOptions).toEqual(getDefaultGlobalOptions(CRIMSON));
    });
  });

  describe('resetPalette', () => {
    it('creates a new palette with random color', () => {
      const palette = resetPalette();

      expect(palette.colors).toHaveLength(1);
      expect(palette.colors[0].name).toBe('Primary');
      // globalOptions should use computed defaults based on the random color
      expect(palette.globalOptions).toEqual(getDefaultGlobalOptions(palette.colors[0].value));
    });
  });

  describe('addColor', () => {
    it('adds color with default name', () => {
      const initial = createTestPalette(1);
      const result = addColor(initial, GREEN);

      expect(result.colors).toHaveLength(2);
      expect(result.colors[1].name).toBe('Secondary');
      expect(result.colors[1].value).toBe(GREEN);
    });

    it('adds color with custom name', () => {
      const initial = createTestPalette(1);
      const result = addColor(initial, GREEN, 'Custom Name');

      expect(result.colors[1].name).toBe('Custom Name');
    });

    it('returns unchanged state at MAX_COLORS', () => {
      const initial = createTestPalette(MAX_COLORS);
      const result = addColor(initial, GREEN);

      expect(result).toBe(initial);
      expect(result.colors).toHaveLength(MAX_COLORS);
    });

    it('preserves existing state (immutable)', () => {
      const initial = createTestPalette(1);
      const originalColors = initial.colors;

      addColor(initial, GREEN);

      expect(initial.colors).toBe(originalColors);
      expect(initial.colors).toHaveLength(1);
    });
  });

  describe('removeColor', () => {
    it('removes color by id', () => {
      const initial = createTestPalette(3);
      const result = removeColor(initial, initial.colors[1].id);

      expect(result.colors).toHaveLength(2);
      expect(result.colors[0].name).toBe('Primary');
      expect(result.colors[1].name).toBe('Tertiary');
    });

    it('returns unchanged state for an unknown id', () => {
      const initial = createTestPalette(2);

      expect(removeColor(initial, 'nope')).toBe(initial);
    });

    it('returns unchanged state when only one color remains', () => {
      const initial = createTestPalette(1);
      const result = removeColor(initial, initial.colors[0].id);

      expect(result).toBe(initial);
      expect(result.colors).toHaveLength(1);
    });

    it('preserves other colors', () => {
      const initial = createTestPalette(3);
      const result = removeColor(initial, initial.colors[0].id);

      expect(result.colors).toHaveLength(2);
      expect(result.colors[0].name).toBe('Secondary');
      expect(result.colors[1].name).toBe('Tertiary');
    });
  });

  describe('reorderColors', () => {
    it('reorders colors to match the given ids', () => {
      const initial = createTestPalette(3);
      const [first, second, third] = initial.colors;
      const result = reorderColors(initial, [second.id, third.id, first.id]);

      expect(result.colors.map(c => c.name)).toEqual(['Secondary', 'Tertiary', 'Primary']);
      // Same objects moved (ids ride along) — cheap re-render, stable React keys.
      expect(result.colors[0]).toBe(second);
      expect(result.colors[2]).toBe(first);
    });

    it('changes the base (colors[0]) when a color moves to the front', () => {
      const initial = createTestPalette(3);
      const [first, second, third] = initial.colors;
      const result = reorderColors(initial, [third.id, first.id, second.id]);

      expect(result.colors[0]).toBe(third);
    });

    it('returns the same state reference when order is unchanged', () => {
      const initial = createTestPalette(3);
      const ids = initial.colors.map(c => c.id);

      expect(reorderColors(initial, ids)).toBe(initial);
    });

    it('ignores unknown ids', () => {
      const initial = createTestPalette(2);
      const [first, second] = initial.colors;
      const result = reorderColors(initial, ['missing', second.id, first.id]);

      expect(result.colors.map(c => c.name)).toEqual(['Secondary', 'Primary']);
    });

    it('appends colors absent from the id list in original order', () => {
      const initial = createTestPalette(3);
      const [first, second, third] = initial.colors;
      // Only reference the last color; the rest must be appended, order preserved.
      const result = reorderColors(initial, [third.id]);

      expect(result.colors.map(c => c.name)).toEqual(['Tertiary', 'Primary', 'Secondary']);
      expect(result.colors[1]).toBe(first);
      expect(result.colors[2]).toBe(second);
    });

    it('never drops or duplicates colors', () => {
      const initial = createTestPalette(3);
      const ids = initial.colors.map(c => c.id);
      const result = reorderColors(initial, [ids[1], ids[1], ids[0], ids[2]]);

      expect(result.colors).toHaveLength(3);
      expect(new Set(result.colors.map(c => c.id)).size).toBe(3);
    });
  });

  describe('updateColor', () => {
    it('updates color name', () => {
      const initial = createTestPalette(1);
      const result = updateColor(initial, initial.colors[0].id, { name: 'New Name' });

      expect(result.colors[0].name).toBe('New Name');
      expect(result.colors[0].value).toBe(initial.colors[0].value);
    });

    it('updates color value', () => {
      const initial = createTestPalette(1);
      const result = updateColor(initial, initial.colors[0].id, { value: WHITE });

      expect(result.colors[0].value).toBe(WHITE);
      expect(result.colors[0].name).toBe(initial.colors[0].name);
    });

    it('returns unchanged state for an unknown id', () => {
      const initial = createTestPalette(1);

      expect(updateColor(initial, 'nope', { name: 'Test' })).toBe(initial);
    });

    it('updates the target color, not its neighbors', () => {
      const initial = createTestPalette(3);
      const result = updateColor(initial, initial.colors[2].id, { name: 'New Name' });

      expect(result.colors.map(c => c.name)).toEqual(['Primary', 'Secondary', 'New Name']);
    });

    it('preserves other fields when updating', () => {
      const initial: GeneratorState = {
        colors: [createColorEntry('Primary', CRIMSON, { steps: 9 })],
        globalOptions: getDefaultGlobalOptions(CRIMSON),
      };
      const result = updateColor(initial, initial.colors[0].id, { name: 'New Name' });

      expect(result.colors[0].overrides).toEqual({ steps: 9 });
    });
  });

  describe('setColorOverride', () => {
    it('sets overrides that differ from global', () => {
      const initial = createTestPalette(1);
      const result = setColorOverride(initial, initial.colors[0].id, { maxLightness: 0.9 });

      expect(result.colors[0].overrides).toEqual({ maxLightness: 0.9 });
    });

    it('merges with existing overrides', () => {
      const initial: GeneratorState = {
        colors: [createColorEntry('Primary', CRIMSON, { steps: 9 })],
        globalOptions: getDefaultGlobalOptions(CRIMSON),
      };
      const result = setColorOverride(initial, initial.colors[0].id, { maxLightness: 0.9 });

      expect(result.colors[0].overrides).toEqual({ steps: 9, maxLightness: 0.9 });
    });

    it('strips key when update matches current global', () => {
      const initial: GeneratorState = {
        colors: [createColorEntry('Primary', CRIMSON, { maxLightness: 0.5 })],
        globalOptions: getDefaultGlobalOptions(CRIMSON),
      };
      const globalMaxLightness = initial.globalOptions.maxLightness;
      const result = setColorOverride(initial, initial.colors[0].id, {
        maxLightness: globalMaxLightness,
      });

      expect(result.colors[0].overrides).toBeUndefined();
    });

    it('strips matching keys but keeps differing ones', () => {
      const initial: GeneratorState = {
        colors: [createColorEntry('Primary', CRIMSON, { steps: 9, maxLightness: 0.5 })],
        globalOptions: getDefaultGlobalOptions(CRIMSON),
      };
      const result = setColorOverride(initial, initial.colors[0].id, {
        steps: initial.globalOptions.steps,
      });

      expect(result.colors[0].overrides).toEqual({ maxLightness: 0.5 });
    });

    it('returns unchanged state for an unknown id', () => {
      const initial = createTestPalette(1);

      expect(setColorOverride(initial, 'nope', { steps: 9 })).toBe(initial);
    });

    it('strips a deep-equal object override', () => {
      const initial: GeneratorState = {
        colors: [createColorEntry('Primary', CRIMSON)],
        globalOptions: { ...getDefaultGlobalOptions(CRIMSON), hueShift: { low: -15, high: 20 } },
      };
      const result = setColorOverride(initial, initial.colors[0].id, {
        hueShift: { low: -15, high: 20 },
      });

      expect(result.colors[0].overrides).toBeUndefined();
    });

    it('keeps a { low, high } override against a scalar global (shape preserves Split mode)', () => {
      const initial: GeneratorState = {
        colors: [createColorEntry('Primary', CRIMSON)],
        globalOptions: { ...getDefaultGlobalOptions(CRIMSON), lightnessCurve: 1.3 },
      };
      const result = setColorOverride(initial, initial.colors[0].id, {
        lightnessCurve: { low: 1.3, high: 1.3 },
      });

      expect(result.colors[0].overrides).toEqual({ lightnessCurve: { low: 1.3, high: 1.3 } });
    });

    it('keeps a moot hueShift { 0, 0 } override so per-color Split stays reachable', () => {
      const initial: GeneratorState = {
        colors: [createColorEntry('Primary', CRIMSON)],
        globalOptions: getDefaultGlobalOptions(CRIMSON),
      };
      const result = setColorOverride(initial, initial.colors[0].id, {
        hueShift: { low: 0, high: 0 },
      });

      expect(result.colors[0].overrides).toEqual({ hueShift: { low: 0, high: 0 } });
    });
  });

  describe('clearColorOverrides', () => {
    it('removes overrides', () => {
      const initial: GeneratorState = {
        colors: [createColorEntry('Primary', CRIMSON, { steps: 9 })],
        globalOptions: getDefaultGlobalOptions(CRIMSON),
      };
      const result = clearColorOverrides(initial, initial.colors[0].id);

      expect(result.colors[0].overrides).toBeUndefined();
    });

    it('returns unchanged state for an unknown id', () => {
      const initial = createTestPalette(1);

      expect(clearColorOverrides(initial, 'nope')).toBe(initial);
    });
  });

  describe('updateGlobalOptions', () => {
    it('merges partial updates', () => {
      const initial = createTestPalette(1);
      const result = updateGlobalOptions(initial, { lightnessCurve: 2.0 });

      expect(result.globalOptions.lightnessCurve).toBe(2.0);
      // steps should remain at default value (11)
      expect(result.globalOptions.steps).toBe(11);
    });

    it('preserves unspecified options', () => {
      const initial = createTestPalette(1);
      const result = updateGlobalOptions(initial, { steps: 15 });

      // mode and maxLightness should remain at default values
      expect(result.globalOptions.mode).toBe('light');
      expect(result.globalOptions.maxLightness).toBe(0.97);
    });
  });

  describe('resetGlobalOptions', () => {
    it('resets to defaults while keeping colors', () => {
      const initial: GeneratorState = {
        colors: [createColorEntry('Custom', SLATE)],
        globalOptions: { ...getDefaultGlobalOptions(SLATE), lightnessCurve: 2.5, steps: 20 },
      };
      const result = resetGlobalOptions(initial);

      // Should reset to computed defaults based on first color
      expect(result.globalOptions).toEqual(getDefaultGlobalOptions(SLATE));
      expect(result.colors).toEqual(initial.colors);
    });
  });

  describe('getEffectiveOptions', () => {
    it('omits saturation when saturationOverride is false (default)', () => {
      const color = createColorEntry('Primary', CRIMSON);
      const globalOptions = getDefaultGlobalOptions(CRIMSON);
      const result = getEffectiveOptions(color, globalOptions);

      // saturationOverride is stripped, and saturation is omitted when override is false
      expect(result.saturation).toBeUndefined();
      expect((result as Record<string, unknown>).saturationOverride).toBeUndefined();
    });

    it('includes saturation when saturationOverride is true', () => {
      const color = createColorEntry('Primary', CRIMSON);
      const globalOptions = { ...getDefaultGlobalOptions(CRIMSON), saturationOverride: true };
      const result = getEffectiveOptions(color, globalOptions);

      expect(result.saturation).toBe(globalOptions.saturation);
    });

    it('merges overrides with global options', () => {
      const color = createColorEntry('Primary', CRIMSON, { steps: 15 });
      const globalOptions = getDefaultGlobalOptions(CRIMSON);
      const result = getEffectiveOptions(color, globalOptions);

      expect(result.steps).toBe(15);
      expect(result.mode).toBe('light');
    });

    it('override wins over global', () => {
      const globalOptions = { ...getDefaultGlobalOptions(CRIMSON), maxLightness: 0.95 };
      const color = createColorEntry('Primary', CRIMSON, { maxLightness: 0.8 });
      const result = getEffectiveOptions(color, globalOptions);

      expect(result.maxLightness).toBe(0.8);
    });
  });

  describe('getDefaultColorName', () => {
    it('returns named colors for index 0-9', () => {
      expect(getDefaultColorName(0)).toBe('Primary');
      expect(getDefaultColorName(1)).toBe('Secondary');
      expect(getDefaultColorName(2)).toBe('Tertiary');
      expect(getDefaultColorName(3)).toBe('Accent');
      expect(getDefaultColorName(4)).toBe('Color 5');
      expect(getDefaultColorName(9)).toBe('Color 10');
    });

    it('returns "Color N" for index >= 10', () => {
      expect(getDefaultColorName(10)).toBe('Color 11');
      expect(getDefaultColorName(15)).toBe('Color 16');
    });
  });
});
