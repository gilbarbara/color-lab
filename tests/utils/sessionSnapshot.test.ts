import { DESIGN_SYSTEM_PRESETS } from '~/config/presets';
import { createColorEntry, createTestPalette, CRIMSON, GREEN } from '~/test-fixtures';
import {
  buildSessionSnapshotProps,
  isEngagedSession,
  type SnapshotAppState,
  type SnapshotGeneratorState,
} from '~/utils/sessionSnapshot';

import type { GlobalScaleOptions } from '~/types';

function generatorState(overrides: Partial<SnapshotGeneratorState> = {}): SnapshotGeneratorState {
  const base = createTestPalette(1);

  return {
    chartColorIds: new Set<string>(),
    colors: base.colors,
    globalOptions: base.globalOptions,
    ...overrides,
  };
}

const appState: SnapshotAppState = {
  colorSpacing: 'wide',
  gamut: 'srgb',
  groupFilter: [],
  paletteId: null,
  showBottomBar: false,
  showColorOptionsPanel: false,
  showPaletteOptionsPanel: false,
  showPreview: true,
  showSidebar: true,
  view: 'list',
};

const env = { isAuthenticated: false, isDark: false };

describe('utils/sessionSnapshot', () => {
  describe('isEngagedSession', () => {
    it('is false for a fresh default palette', () => {
      expect(isEngagedSession(generatorState())).toBe(false);
    });

    it('is true when a curve option is customized', () => {
      const base = generatorState();

      expect(
        isEngagedSession(
          generatorState({ globalOptions: { ...base.globalOptions, minLightness: 0.1 } }),
        ),
      ).toBe(true);
    });

    it('is true when a palette option is customized', () => {
      const base = generatorState();

      expect(
        isEngagedSession(generatorState({ globalOptions: { ...base.globalOptions, steps: 5 } })),
      ).toBe(true);
    });

    it('is true with more than one color', () => {
      expect(isEngagedSession(generatorState({ colors: createTestPalette(2).colors }))).toBe(true);
    });

    it('is true when a color has an override', () => {
      const colors = [createColorEntry('Primary', CRIMSON, { hueShift: 10 })];

      expect(isEngagedSession(generatorState({ colors }))).toBe(true);
    });

    it('is true when a group is assigned', () => {
      const colors = [createColorEntry('Primary', CRIMSON, undefined, 'brand')];

      expect(isEngagedSession(generatorState({ colors }))).toBe(true);
    });
  });

  describe('buildSessionSnapshotProps', () => {
    it('flattens the default config with no overrides', () => {
      const props = buildSessionSnapshotProps(generatorState(), appState, env);

      expect(props).toMatchObject({
        steps: 11,
        mode: 'light',
        saturation_override: false,
        chroma_curve_mode: 'scalar',
        hue_shift_mode: 'scalar',
        hue_shift_value: 0,
        lightness_curve_mode: 'scalar',
        lightness_curve_value: 1.3,
        has_overrides: false,
        overridden_color_count: 0,
        color_count: 1,
        has_groups: false,
        active_preset: 'none',
        view: 'list',
        gamut: 'srgb',
        theme: 'light',
        charts_shown: false,
        palette_saved: false,
        is_authenticated: false,
      });
      // scalar chroma exposes amount/peak, never low/high
      expect(props.chroma_curve_amount).toBeDefined();
      expect(props).not.toHaveProperty('chroma_curve_low');
      expect(props).not.toHaveProperty('lock');
      expect(props).not.toHaveProperty('saturation');
    });

    it('marks every config knob un-customized for a fresh default palette', () => {
      const props = buildSessionSnapshotProps(generatorState(), appState, env);

      expect(props).toMatchObject({
        steps_customized: false,
        mode_customized: false,
        lock_customized: false,
        variant_customized: false,
        lightness_range_customized: false,
        lightness_curve_customized: false,
        chroma_curve_customized: false,
        hue_shift_customized: false,
        color_spacing_customized: false,
        customized_count: 0,
        has_customizations: false,
      });
    });

    it('flags a customized global knob and counts it, leaving the rest false', () => {
      const base = generatorState();
      const props = buildSessionSnapshotProps(
        generatorState({ globalOptions: { ...base.globalOptions, hueShift: 20 } }),
        appState,
        env,
      );

      expect(props).toMatchObject({
        hue_shift_customized: true,
        steps_customized: false,
        chroma_curve_customized: false,
        color_spacing_customized: false,
        customized_count: 1,
        has_customizations: true,
      });
    });

    it('collapses both lightness bounds into one lightness_range flag, counted once', () => {
      const base = generatorState();
      const props = buildSessionSnapshotProps(
        generatorState({
          globalOptions: { ...base.globalOptions, minLightness: 0.1, maxLightness: 0.8 },
        }),
        appState,
        env,
      );

      expect(props).toMatchObject({
        lightness_range_customized: true,
        customized_count: 1, // both bounds moved, but it's one control
      });
      expect(props).not.toHaveProperty('min_lightness_customized');
      expect(props).not.toHaveProperty('max_lightness_customized');
    });

    it('counts color spacing and saturation override in customized_count', () => {
      const base = generatorState();
      const globalOptions: GlobalScaleOptions = {
        ...base.globalOptions,
        saturation: 42,
        saturationOverride: true,
      };

      const props = buildSessionSnapshotProps(
        generatorState({ globalOptions }),
        { ...appState, colorSpacing: 'tight' },
        env,
      );

      expect(props).toMatchObject({
        color_spacing_customized: true,
        saturation_override: true,
        customized_count: 2,
      });
    });

    it('includes saturation only when saturationOverride is on', () => {
      const base = generatorState();
      const globalOptions: GlobalScaleOptions = {
        ...base.globalOptions,
        saturation: 42,
        saturationOverride: true,
      };

      const props = buildSessionSnapshotProps(generatorState({ globalOptions }), appState, env);

      expect(props.saturation_override).toBe(true);
      expect(props.saturation).toBe(42);
    });

    it('splits range curves into low/high', () => {
      const base = generatorState();
      const globalOptions: GlobalScaleOptions = {
        ...base.globalOptions,
        chromaCurve: { low: 0.5, high: 0.8 },
        hueShift: { low: 1, high: -5 },
      };

      const props = buildSessionSnapshotProps(generatorState({ globalOptions }), appState, env);

      expect(props).toMatchObject({
        chroma_curve_mode: 'range',
        chroma_curve_low: 0.5,
        chroma_curve_high: 0.8,
        hue_shift_mode: 'range',
        hue_shift_low: 1,
        hue_shift_high: -5,
      });
      expect(props).not.toHaveProperty('chroma_curve_amount');
    });

    it('summarizes override adoption per knob', () => {
      const colors = [
        createColorEntry('Primary', CRIMSON, { hueShift: 10, lock: 300 }),
        createColorEntry('Secondary', GREEN, { lock: 500 }),
      ];

      const props = buildSessionSnapshotProps(generatorState({ colors }), appState, env);

      expect(props).toMatchObject({
        has_overrides: true,
        overridden_color_count: 2,
        overridden_count: 3, // 2 knobs on Primary + 1 on Secondary
        hue_shift_overridden: true,
        lock_overridden: true,
        chroma_curve_overridden: false,
        min_lightness_overridden: false,
      });
      // steps/mode/variant are palette-wide — never per-color overridable
      expect(props).not.toHaveProperty('variant_overridden');
      expect(props).not.toHaveProperty('mode_overridden');
      expect(props).not.toHaveProperty('steps_overridden');
    });

    it('detects the active preset from the curve config', () => {
      const base = generatorState();
      const globalOptions = {
        ...base.globalOptions,
        ...DESIGN_SYSTEM_PRESETS.tailwind,
      } as GlobalScaleOptions;

      const props = buildSessionSnapshotProps(generatorState({ globalOptions }), appState, env);

      expect(props.active_preset).toBe('tailwind');
    });

    it('reflects persistent UI + context state', () => {
      const props = buildSessionSnapshotProps(
        generatorState({ chartColorIds: new Set(['a']) }),
        {
          ...appState,
          gamut: 'p3',
          groupFilter: ['brand'],
          paletteId: 'abc',
          showColorOptionsPanel: true,
          view: 'grid',
        },
        { isAuthenticated: true, isDark: true },
      );

      expect(props).toMatchObject({
        view: 'grid',
        gamut: 'p3',
        theme: 'dark',
        advanced_options_shown: true,
        charts_shown: true,
        group_filter_active: true,
        palette_saved: true,
        is_authenticated: true,
      });
    });
  });
});
