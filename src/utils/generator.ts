import { objectKeys, uuid } from '@gilbarbara/helpers';

import {
  COLOR_GROUPS,
  DEFAULT_COLOR_NAMES,
  DEFAULT_PALETTE_NAME,
  MAX_COLORS,
} from '~/config/globals';
import { DESIGN_SYSTEM_PRESETS, type PresetKey } from '~/config/presets';
import {
  CHROMA_CURVE_DEFAULT,
  CURVE_OPTION_KEYS,
  HUE_SHIFT_DEFAULT,
  LIGHTNESS_CURVE_DEFAULT,
  LIGHTNESS_RANGE_MAX_DEFAULT,
  LIGHTNESS_RANGE_MIN_DEFAULT,
  MODE_DEFAULT,
  STEPS_DEFAULT,
} from '~/config/scale';
import { getChromaAsPercentage, getRandomColor } from '~/utils/color';
import { isSameOptionValue, isStructurallyEqualOption } from '~/utils/scale-options';

import type {
  ColorEntry,
  ColorGroup,
  ColorOverrides,
  DefaultScaleOptions,
  EffectiveScaleOptions,
  GeneratorState,
  GlobalScaleOptions,
  OklchString,
} from '~/types';

/**
 * Add a new color to the palette
 * Returns unchanged state if at MAX_COLORS
 */
export function addColor(state: GeneratorState, value: OklchString, name?: string): GeneratorState {
  if (state.colors.length >= MAX_COLORS) {
    return state;
  }

  const colorName = name ?? getDefaultColorName(state.colors.length);
  const newColor: ColorEntry = { id: uuid(), name: colorName, value };

  return {
    ...state,
    colors: [...state.colors, newColor],
  };
}

/**
 * Clear all overrides for a specific color
 */
export function clearColorOverrides(state: GeneratorState, id: string): GeneratorState {
  return updateColor(state, id, { overrides: undefined });
}

/**
 * Create a fresh palette with optional initial color
 */
export function createPalette(initialColor?: OklchString): GeneratorState {
  const color = initialColor ?? getRandomColor();

  return {
    colors: [{ id: uuid(), name: 'Primary', value: color }],
    globalOptions: getDefaultGlobalOptions(color),
    name: DEFAULT_PALETTE_NAME,
  };
}

/**
 * Filter colors to the selected groups. An empty selection means "All" — no filter,
 * every color returned. Otherwise keep only colors whose group is in the selection;
 * ungrouped colors are excluded. Preserves input order (a lens, not a reorder).
 */
export function filterColorsByGroups(colors: ColorEntry[], groups: ColorGroup[]): ColorEntry[] {
  if (groups.length === 0) {
    return colors;
  }

  const selected = new Set(groups);

  return colors.filter(color => color.group !== undefined && selected.has(color.group));
}

/**
 * The design-system preset whose curve config the palette currently matches, or null.
 * Derived, not stored: editing any curve key drops the match (the URL/options stay the
 * single source of truth). Presets only define CURVE_OPTION_KEYS.
 */
export function getActivePreset(globalOptions: GlobalScaleOptions): PresetKey | null {
  return (
    (objectKeys(DESIGN_SYSTEM_PRESETS) as PresetKey[]).find(name =>
      CURVE_OPTION_KEYS.every(key =>
        isSameOptionValue(key, globalOptions[key], DESIGN_SYSTEM_PRESETS[name][key]),
      ),
    ) ?? null
  );
}

/**
 * Get default color name for a given index
 */
export function getDefaultColorName(index: number): string {
  return DEFAULT_COLOR_NAMES[index] ?? `Color ${index + 1}`;
}

/**
 * Get default global options with saturation computed from the given color.
 */
export function getDefaultGlobalOptions(color: OklchString): DefaultScaleOptions {
  return {
    chromaCurve: CHROMA_CURVE_DEFAULT,
    hueShift: HUE_SHIFT_DEFAULT,
    lightnessCurve: LIGHTNESS_CURVE_DEFAULT,
    lock: undefined,
    maxLightness: LIGHTNESS_RANGE_MAX_DEFAULT,
    minLightness: LIGHTNESS_RANGE_MIN_DEFAULT,
    mode: MODE_DEFAULT,
    saturation: getChromaAsPercentage(color),
    saturationOverride: false,
    steps: STEPS_DEFAULT,
    variant: undefined,
  };
}

/**
 * Merge global options with per-color overrides.
 * If saturationOverride is false, omit saturation to use color's natural saturation.
 */
export function getEffectiveOptions(
  color: ColorEntry,
  globalOptions: GlobalScaleOptions,
): EffectiveScaleOptions {
  const { saturation, saturationOverride, ...rest } = globalOptions;

  return {
    ...rest,
    ...(saturationOverride ? { saturation } : {}),
    ...color.overrides,
  };
}

/**
 * Distinct color groups present in the palette, in canonical order (COLOR_GROUPS
 * key order). Empty array = no groups assigned. Ungrouped colors are not listed.
 * The `.length` answers "any groups?", the array "which".
 */
export function getUsedGroups(colors: ColorEntry[]): ColorGroup[] {
  const present = new Set(colors.map(color => color.group));

  return objectKeys(COLOR_GROUPS).filter(group => present.has(group));
}

/**
 * Remove a color from the palette by id
 * Returns unchanged state if trying to remove the last color (min 1 required)
 */
export function removeColor(state: GeneratorState, id: string): GeneratorState {
  if (state.colors.length <= 1) {
    return state;
  }

  const colors = state.colors.filter(color => color.id !== id);

  if (colors.length === state.colors.length) {
    return state;
  }

  return {
    ...state,
    colors,
  };
}

/**
 * Reorder the palette to match `orderedIds`. Ids are matched to existing
 * colors; unknown ids are skipped, and any color whose id is absent from
 * `orderedIds` is appended in its original relative order (safety net so a
 * stale caller can never drop a color). Returns the same state reference when
 * the resulting order is identical, so callers — and the URL subscription —
 * treat it as a no-op.
 */
export function reorderColors(state: GeneratorState, orderedIds: string[]): GeneratorState {
  const byId = new Map(state.colors.map(color => [color.id, color]));
  const seen = new Set<string>();
  const ordered: ColorEntry[] = [];

  for (const id of orderedIds) {
    const color = byId.get(id);

    if (color && !seen.has(id)) {
      seen.add(id);
      ordered.push(color);
    }
  }

  for (const color of state.colors) {
    if (!seen.has(color.id)) {
      ordered.push(color);
    }
  }

  const unchanged =
    ordered.length === state.colors.length &&
    ordered.every((color, index) => color === state.colors[index]);

  if (unchanged) {
    return state;
  }

  return {
    ...state,
    colors: ordered,
  };
}

/**
 * Reset only the advanced (curve) options to their seed-derived defaults,
 * leaving palette options (saturation, steps, mode, …) untouched.
 */
export function resetAdvancedOptions(state: GeneratorState): GeneratorState {
  const defaults = getDefaultGlobalOptions(state.colors[0].value);

  return updateGlobalOptions(
    state,
    Object.fromEntries(CURVE_OPTION_KEYS.map(key => [key, defaults[key]])),
  );
}

/**
 * Reset global options only (keeps colors)
 */
export function resetGlobalOptions(state: GeneratorState): GeneratorState {
  return {
    ...state,
    globalOptions: getDefaultGlobalOptions(state.colors[0].value),
  };
}

/**
 * Reset entire palette (new random color, defaults)
 */
export function resetPalette(): GeneratorState {
  return createPalette();
}

/**
 * Set per-color overrides. Strips any key whose value matches the current
 * globalOptions value, so `ColorEntry.overrides` only ever contains genuine
 * differences. Clears overrides entirely when no key remains.
 */
export function setColorOverride(
  state: GeneratorState,
  id: string,
  updates: ColorOverrides,
): GeneratorState {
  const currentColor = state.colors.find(color => color.id === id);

  if (!currentColor) {
    return state;
  }

  const merged: ColorOverrides = { ...currentColor.overrides, ...updates };

  for (const key of objectKeys(merged)) {
    if (isStructurallyEqualOption(merged[key], state.globalOptions[key])) {
      delete merged[key];
    }
  }

  return updateColor(state, id, {
    overrides: objectKeys(merged).length ? merged : undefined,
  });
}

/**
 * Update a color entry by id
 */
export function updateColor(
  state: GeneratorState,
  id: string,
  updates: Partial<Omit<ColorEntry, 'id'>>,
): GeneratorState {
  if (!state.colors.some(color => color.id === id)) {
    return state;
  }

  return {
    ...state,
    colors: state.colors.map(color => (color.id === id ? { ...color, ...updates } : color)),
  };
}

/**
 * Update global options
 */
export function updateGlobalOptions(
  state: GeneratorState,
  updates: Partial<GlobalScaleOptions>,
): GeneratorState {
  return {
    ...state,
    globalOptions: { ...state.globalOptions, ...updates },
  };
}
