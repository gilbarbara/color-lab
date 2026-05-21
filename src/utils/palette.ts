import { uuid } from '@gilbarbara/helpers';

import { getChromaAsPercentage, getRandomColor } from '~/utils/color';

import type {
  ColorEntry,
  GlobalScaleOptions,
  OklchString,
  PaletteState,
  ScaleOptions,
} from '~/types';

export const MAX_COLORS = 10;

export const CURVE_OPTION_KEYS = [
  'minLightness',
  'maxLightness',
  'lightnessCurve',
  'chromaCurve',
] as const satisfies ReadonlyArray<keyof GlobalScaleOptions>;

export const PALETTE_OPTION_KEYS = [
  'lock',
  'mode',
  'saturation',
  'saturationOverride',
  'steps',
  'variant',
] as const satisfies ReadonlyArray<keyof GlobalScaleOptions>;

/**
 * Get default global options with saturation computed from the given color.
 */
export function getDefaultGlobalOptions(color: OklchString): GlobalScaleOptions {
  return {
    chromaCurve: 0,
    lightnessCurve: 1.3,
    lock: undefined,
    maxLightness: 0.97,
    minLightness: 0.26,
    mode: 'light',
    saturation: getChromaAsPercentage(color),
    saturationOverride: false,
    steps: 11,
    variant: undefined,
  };
}

const DEFAULT_COLOR_NAMES = [
  'Primary',
  'Secondary',
  'Tertiary',
  'Accent',
  'Color 5',
  'Color 6',
  'Color 7',
  'Color 8',
  'Color 9',
  'Color 10',
];

/**
 * Add a new color to the palette
 * Returns unchanged state if at MAX_COLORS
 */
export function addColor(state: PaletteState, value: OklchString, name?: string): PaletteState {
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
export function clearColorOverrides(state: PaletteState, index: number): PaletteState {
  return updateColor(state, index, { overrides: undefined });
}

/**
 * Create a fresh palette with optional initial color
 */
export function createPalette(initialColor?: OklchString): PaletteState {
  const color = initialColor ?? getRandomColor();

  return {
    colors: [{ id: uuid(), name: 'Primary', value: color }],
    globalOptions: getDefaultGlobalOptions(color),
  };
}

/**
 * Get default color name for a given index
 */
export function getDefaultColorName(index: number): string {
  return DEFAULT_COLOR_NAMES[index] ?? `Color ${index + 1}`;
}

/**
 * Merge global options with per-color overrides.
 * If saturationOverride is false, omit saturation to use color's natural saturation.
 */
export function getEffectiveOptions(
  color: ColorEntry,
  globalOptions: GlobalScaleOptions,
): ScaleOptions {
  const { saturation, saturationOverride, ...rest } = globalOptions;

  return {
    ...rest,
    ...(saturationOverride ? { saturation } : {}),
    ...color.overrides,
  };
}

/**
 * Remove a color from the palette by index
 * Returns unchanged state if trying to remove the last color (min 1 required)
 */
export function removeColor(state: PaletteState, index: number): PaletteState {
  if (state.colors.length <= 1 || index < 0 || index >= state.colors.length) {
    return state;
  }

  return {
    ...state,
    colors: state.colors.filter((_, index_) => index_ !== index),
  };
}

/**
 * Reset global options only (keeps colors)
 */
export function resetGlobalOptions(state: PaletteState): PaletteState {
  return {
    ...state,
    globalOptions: getDefaultGlobalOptions(state.colors[0].value),
  };
}

/**
 * Reset entire palette (new random color, defaults)
 */
export function resetPalette(): PaletteState {
  return createPalette();
}

/**
 * Set per-color overrides. Strips any key whose value matches the current
 * globalOptions value, so `ColorEntry.overrides` only ever contains genuine
 * differences. Clears overrides entirely when no key remains.
 */
export function setColorOverride(
  state: PaletteState,
  index: number,
  updates: Partial<ScaleOptions>,
): PaletteState {
  const currentColor = state.colors[index];

  if (!currentColor) {
    return state;
  }

  const merged: Partial<ScaleOptions> = { ...currentColor.overrides, ...updates };

  for (const key of Object.keys(merged) as Array<keyof ScaleOptions>) {
    if (merged[key] === state.globalOptions[key as keyof GlobalScaleOptions]) {
      delete merged[key];
    }
  }

  return updateColor(state, index, {
    overrides: Object.keys(merged).length ? merged : undefined,
  });
}

/**
 * Update a color entry by index
 */
export function updateColor(
  state: PaletteState,
  index: number,
  updates: Partial<ColorEntry>,
): PaletteState {
  if (index < 0 || index >= state.colors.length) {
    return state;
  }

  return {
    ...state,
    colors: state.colors.map((c, index_) => (index_ === index ? { ...c, ...updates } : c)),
  };
}

/**
 * Update global options
 */
export function updateGlobalOptions(
  state: PaletteState,
  updates: Partial<GlobalScaleOptions>,
): PaletteState {
  return {
    ...state,
    globalOptions: { ...state.globalOptions, ...updates },
  };
}
