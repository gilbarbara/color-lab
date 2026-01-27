import { uuid } from '@gilbarbara/helpers';
import { isValidColor } from 'colorizr';

import { getChromaAsPercentage, getRandomColor } from '~/utils/color';

import type { ColorEntry, GlobalScaleOptions, PaletteState, ScaleOptions } from '~/types';

export const MAX_COLORS = 10;

/**
 * Get default global options with saturation computed from the given color.
 */
export function getDefaultGlobalOptions(color: string): GlobalScaleOptions {
  return {
    chromaCurve: 0,
    lightnessCurve: 1.5,
    lock: undefined,
    maxLightness: 0.97,
    minLightness: 0.2,
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
export function addColor(state: PaletteState, value: string, name?: string): PaletteState {
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
export function createPalette(initialColor?: string): PaletteState {
  const color = initialColor ?? getRandomColor('oklch');

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
 * Validate color value using colorizr
 */
export function isValidColorValue(value: string): boolean {
  return isValidColor(value);
}

/**
 * Type guard to validate palette state structure
 */
export function isValidPaletteState(data: unknown): data is PaletteState {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const object = data as Record<string, unknown>;

  return (
    Array.isArray(object.colors) &&
    object.colors.length > 0 &&
    object.colors.length <= MAX_COLORS &&
    object.colors.every(
      c =>
        typeof c === 'object' &&
        c !== null &&
        typeof (c as Record<string, unknown>).id === 'string' &&
        typeof (c as Record<string, unknown>).value === 'string' &&
        typeof (c as Record<string, unknown>).name === 'string' &&
        isValidColor((c as Record<string, unknown>).value as string),
    ) &&
    typeof object.globalOptions === 'object'
  );
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
 * Update overrides for a specific color
 */
export function updateColorOverrides(
  state: PaletteState,
  index: number,
  overrides: Partial<ScaleOptions>,
): PaletteState {
  const currentColor = state.colors[index];

  if (!currentColor) {
    return state;
  }

  // Merge with existing overrides
  const mergedOverrides = { ...currentColor.overrides, ...overrides };

  return updateColor(state, index, { overrides: mergedOverrides });
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
