import { COLOR_SPACING_DEFAULT } from '~/config/globals';
import { type GeneratorStore } from '~/stores/generatorStore';
import { getActivePreset, getDefaultGlobalOptions, getUsedGroups } from '~/utils/generator';
import { isSameOptionValue, normalizeChromaCurve } from '~/utils/scale-options';

import type {
  ColorGroup,
  ColorOverrides,
  ColorSpacing,
  Gamut,
  GeneratorView,
  GlobalScaleOptions,
  OklchString,
} from '~/types';

type SnapshotProps = Record<string, string | number | boolean>;

interface SnapshotEnv {
  isAuthenticated: boolean;
  isDark: boolean;
}

/** The generator state the snapshot reads — the store's palette + transient charts flag. */
export type SnapshotGeneratorState = Pick<
  GeneratorStore,
  'chartColorIds' | 'colors' | 'globalOptions'
>;

/** The appStore fields the snapshot reads (structural subset of AppState). */
export interface SnapshotAppState {
  colorSpacing: ColorSpacing;
  gamut: Gamut;
  groupFilter: ColorGroup[];
  paletteId: string | null;
  showBottomBar: boolean;
  showColorOptionsPanel: boolean;
  showPaletteOptionsPanel: boolean;
  showPreview: boolean;
  showSidebar: boolean;
  view: GeneratorView;
}

// The global scale-config knobs mapped to their snake_case analytics stem. Feeds the per-color
// `<stem>_overridden` flags (stem lookup) and the per-key customization comparison below.
const CUSTOMIZABLE_OPTION_KEYS = {
  chromaCurve: 'chroma_curve',
  hueShift: 'hue_shift',
  lightnessCurve: 'lightness_curve',
  lock: 'lock',
  maxLightness: 'max_lightness',
  minLightness: 'min_lightness',
  mode: 'mode',
  steps: 'steps',
  variant: 'variant',
} as const satisfies Partial<Record<keyof GlobalScaleOptions, string>>;

type CustomizableOptionKey = keyof typeof CUSTOMIZABLE_OPTION_KEYS;

// The knobs the per-color override UI can actually set — the `color:*` axis (`<stem>_overridden`).
// A deliberate curation, not `keyof ColorOverrides`: steps/mode/variant are palette-wide with no
// per-color surface, so they get no flag (the URL grammar can still carry them, but the UI never
// produces them). `satisfies` just checks each is a real override key; stems are looked up from the
// map above so they can't drift.
const OVERRIDABLE_OPTION_KEYS = [
  'chromaCurve',
  'hueShift',
  'lightnessCurve',
  'lock',
  'maxLightness',
  'minLightness',
] as const satisfies ReadonlyArray<keyof ColorOverrides>;

/**
 * Per-knob "global config differs from default" — the `options:*` axis (vs the per-color
 * `*_overridden` / `color:*` axis). Same comparison the engagement gate uses; both read it so the
 * definitions can't drift apart. The customized *flags* collapse min/max into one lightness_range
 * feature (see buildSessionSnapshotProps); this per-key map is the raw input to that.
 */
function getCustomizedOptions(
  globalOptions: GlobalScaleOptions,
  color: OklchString,
): Record<CustomizableOptionKey, boolean> {
  const defaults = getDefaultGlobalOptions(color);
  const keys = Object.keys(CUSTOMIZABLE_OPTION_KEYS) as CustomizableOptionKey[];

  return Object.fromEntries(
    keys.map(key => [key, !isSameOptionValue(key, globalOptions[key], defaults[key])]),
  ) as Record<CustomizableOptionKey, boolean>;
}

/**
 * Flatten the effective session config into a flat, PostHog-friendly property bag.
 * Polymorphic curve fields are split into scalar/range shapes; per-color override *adoption*
 * is summarized per knob (values are intentionally not captured). Optional keys are omitted
 * when absent rather than sent as null.
 */
export function buildSessionSnapshotProps(
  generator: SnapshotGeneratorState,
  app: SnapshotAppState,
  env: SnapshotEnv,
): SnapshotProps {
  const { chartColorIds, colors, globalOptions } = generator;
  const props: SnapshotProps = {};

  // --- Scale config ---
  props.steps = globalOptions.steps;
  props.mode = globalOptions.mode;
  props.min_lightness = globalOptions.minLightness;
  props.max_lightness = globalOptions.maxLightness;

  if (globalOptions.lock !== undefined) {
    props.lock = globalOptions.lock;
  }

  if (globalOptions.variant !== undefined) {
    props.variant = globalOptions.variant;
  }

  props.saturation_override = globalOptions.saturationOverride;

  if (globalOptions.saturationOverride) {
    props.saturation = globalOptions.saturation;
  }

  // Curves — raw values (not normalized) so the distribution reflects what users set.
  const chroma = normalizeChromaCurve(globalOptions.chromaCurve);

  if (chroma.type === 'range') {
    props.chroma_curve_mode = 'range';
    props.chroma_curve_low = chroma.low;
    props.chroma_curve_high = chroma.high;
  } else {
    props.chroma_curve_mode = 'scalar';
    props.chroma_curve_amount = chroma.amount;
    props.chroma_curve_peak = chroma.peak;
  }

  const { hueShift, lightnessCurve } = globalOptions;

  if (typeof hueShift === 'number') {
    props.hue_shift_mode = 'scalar';
    props.hue_shift_value = hueShift;
  } else {
    props.hue_shift_mode = 'range';
    props.hue_shift_low = hueShift.low;
    props.hue_shift_high = hueShift.high;
  }

  if (typeof lightnessCurve === 'number') {
    props.lightness_curve_mode = 'scalar';
    props.lightness_curve_value = lightnessCurve;
  } else {
    props.lightness_curve_mode = 'range';
    props.lightness_curve_low = lightnessCurve.low;
    props.lightness_curve_high = lightnessCurve.high;
  }

  // --- Customization adoption (global config vs default; the `options:*` axis) ---
  const customized = getCustomizedOptions(globalOptions, colors[0].value);

  // One flag per customization *feature*. Lightness range is a single control (two bounds), so its
  // two keys collapse into one lightness_range flag — otherwise it would weight customized_count
  // double vs every other knob (the curves stay one flag even in split mode).
  const customizedFeatures: Record<string, boolean> = {
    chroma_curve: customized.chromaCurve,
    hue_shift: customized.hueShift,
    lightness_curve: customized.lightnessCurve,
    lightness_range: customized.minLightness || customized.maxLightness,
    lock: customized.lock,
    mode: customized.mode,
    steps: customized.steps,
    variant: customized.variant,
    color_spacing: app.colorSpacing !== COLOR_SPACING_DEFAULT,
  };

  for (const [feature, value] of Object.entries(customizedFeatures)) {
    props[`${feature}_customized`] = value;
  }

  // Depth: how many distinct features moved off default. saturation is a toggle
  // (saturation_override), not a default compare, so it's counted directly.
  props.customized_count =
    Object.values(customizedFeatures).filter(Boolean).length +
    (globalOptions.saturationOverride ? 1 : 0);
  // Convenience boolean paralleling has_overrides (any global config moved off default).
  props.has_customizations = props.customized_count > 0;

  // --- Override adoption (which knobs, not which values; the `color:*` axis) ---
  const overriddenColors = colors.filter(color => color.overrides);

  props.has_overrides = overriddenColors.length > 0;
  props.overridden_color_count = overriddenColors.length;
  // Total override entries across the palette (a color overriding two knobs counts twice) — the
  // per-color depth analog to customized_count. overridden_color_count answers "how many colors".
  props.overridden_count = overriddenColors.reduce(
    (sum, color) => sum + Object.keys(color.overrides ?? {}).length,
    0,
  );

  for (const key of OVERRIDABLE_OPTION_KEYS) {
    props[`${CUSTOMIZABLE_OPTION_KEYS[key]}_overridden`] = overriddenColors.some(
      color => color.overrides && key in color.overrides,
    );
  }

  // --- Composition ---
  const usedGroups = getUsedGroups(colors);

  props.color_count = colors.length;
  props.has_groups = usedGroups.length > 0;
  props.group_count = usedGroups.length;
  props.color_spacing = app.colorSpacing;
  props.active_preset = getActivePreset(globalOptions) ?? 'none';

  // --- Persistent UI ("effectively using" at leave) ---
  props.view = app.view;
  props.gamut = app.gamut;
  props.theme = env.isDark ? 'dark' : 'light';
  props.sidebar_shown = app.showSidebar;
  props.bottom_bar_shown = app.showBottomBar;
  props.preview_shown = app.showPreview;
  props.advanced_options_shown = app.showColorOptionsPanel;
  props.palette_options_shown = app.showPaletteOptionsPanel;
  props.charts_shown = chartColorIds.size > 0;
  props.group_filter_active = app.groupFilter.length > 0;

  // --- Context ---
  props.palette_saved = !!app.paletteId;
  props.is_authenticated = env.isAuthenticated;

  return props;
}

/**
 * Whether the session touched the tool meaningfully — the gate that keeps the ~1.7k pure
 * blog browsers out of the `app:session` snapshot. Reuses the same per-knob default comparison
 * the snapshot emits (`getCustomizedOptions`), plus saturation override, per-color overrides,
 * extra colors, and groups. saturation is a toggle, so `saturationOverride` alone is engagement
 * (the value comparison is subsumed — it's dead state unless the toggle is on).
 */
export function isEngagedSession(state: SnapshotGeneratorState): boolean {
  const { colors, globalOptions } = state;
  const customized = getCustomizedOptions(globalOptions, colors[0].value);

  return (
    Object.values(customized).some(Boolean) ||
    globalOptions.saturationOverride ||
    colors.some(color => color.overrides) ||
    colors.length > 1 ||
    getUsedGroups(colors).length > 0
  );
}
