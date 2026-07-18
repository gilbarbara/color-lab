import type { ScaleChromaPeak, ScaleOptions as ScaleOptionsBase, ScaleRange } from 'colorizr';

import type { SetOptional, Simplify } from './utilities';

export type ColorGroup = 'brand' | 'neutral' | 'semantic' | 'decorative';
export type ColorGroupOption = { code: string; description: string; label: string };
export type ColorGroupOptions = Record<ColorGroup, ColorGroupOption>;

/**
 * A color's per-color scale overrides. `saturation` is excluded on purpose: it is a palette-wide
 * concept gated by `saturationOverride` (see `GlobalScaleOptions`), so a per-color copy would have
 * to be de-duplicated against a global that is dead state while the override is off.
 */
export type ColorOverrides = Simplify<Omit<Partial<ScaleOptions>, 'saturation'>>;

export type ColorSpacing = 'tight' | 'even' | 'wide' | 'golden';
export type ColorSpacingOption = { angle: number; description: string; label: string };
export type ColorSpacingOptions = Record<ColorSpacing, ColorSpacingOption>;

/**
 * The options a freshly-defaulted palette uses. Curves are always their scalar
 * shape — `getDefaultGlobalOptions` only ever produces scalars;
 * the store widens to the object modes in `GlobalScaleOptions` once the user
 * switches a curve. Typing the default narrowly keeps "the default" from being
 * a range/peak.
 */
export type DefaultScaleOptions = Simplify<
  GlobalScaleOptions & {
    chromaCurve: number;
    hueShift: number;
    lightnessCurve: number;
  }
>;

export type EffectiveScaleOptions = Simplify<
  SetOptional<Required<ScaleOptions>, 'lock' | 'saturation' | 'variant'>
>;

export type ExportColorFormat = 'oklch' | 'hex' | 'hsl' | 'rgb' | 'rgb-channels';

// Export types
export type ExportFormatType = 'tailwind3' | 'tailwind4' | 'css' | 'scss' | 'svg';

export type Gamut = 'p3' | 'srgb';

export type GeneratorView = 'list' | 'grid' | 'preview';

export type GetPaletteResult =
  | { kind: 'success'; palette: SavedPalette }
  | { kind: 'not-found' }
  // permission-denied: deleted, not-owned, or otherwise denied read. We only know
  // the read was refused, not that the doc is gone — so this stays distinct from
  // 'not-found' rather than fabricating it.
  | { kind: 'forbidden' }
  | { error: unknown; kind: 'error' };

export type GlobalScaleOptions = Simplify<
  ScaleOptions & {
    chromaCurve: number | ScaleChromaPeak | ScaleRange;
    // Required (the global panel always has a value); shape carries the UI mode
    // (scalar = Simple, range = Split), like the other curves.
    hueShift: number | ScaleRange;
    lightnessCurve: number | ScaleRange;
    maxLightness: number;
    minLightness: number;
    mode: NonNullable<ScaleOptionsBase['mode']>;
    /**
     * Only live while `saturationOverride` is true — it is seeded from the first color when the
     * override is enabled, and nothing keeps it in sync afterwards. With the override off it is dead
     * state (a value left by a since-removed or reordered first color), so never read it unguarded:
     * derive the baseline from the current first color via `getDefaultGlobalOptions(colors[0].value)`.
     * The URL boundary sanitizes it on the way in (`reconcileSaturation`) and drops it on the way out,
     * so only an in-session first-color change can leave a stale value behind.
     */
    saturation: number;
    saturationOverride: boolean;
    steps: number;
  }
>;

export type OklchString = string & { readonly __brand: 'OklchString' };

// All three curve options share the same shape contract: a scalar (Simple mode) or
// an object (Split / movable peak). hueShift's scalar x means symmetric drift
// (≡ { low: -x, high: x }); chroma/lightness scalars mean both ends equal.
export type ScaleOptions = Omit<ScaleOptionsBase, 'format'>;

export type ScaleSteps = Record<string, string>;

export interface ColorEntry {
  group?: ColorGroup;
  id: string;
  name: string;
  overrides?: ColorOverrides;
  value: OklchString;
}

export interface ExportOptions {
  colorFormat: ExportColorFormat;
  formatType: ExportFormatType;
}

export interface GeneratorActions {
  addColor: (value: OklchString, name?: string) => string | null;
  clearColorOverrides: (id: string) => void;
  removeColor: (id: string) => string | null;
  reorderColors: (orderedIds: string[]) => void;
  resetAdvancedOptions: () => void;
  resetGlobalOptions: () => void;
  resetPalette: () => void;
  setActiveColor: (id: string) => void;
  setAllCharts: (open: boolean) => void;
  setColorOverride: (id: string, updates: ColorOverrides) => void;
  setName: (name: string) => void;
  setPreviewColor: (id: string) => void;
  toggleChart: (id: string) => void;
  updateColor: (id: string, updates: Partial<Omit<ColorEntry, 'id'>>) => void;
  updateGlobalOptions: (updates: Partial<GlobalScaleOptions>) => void;
}

// Top-level generator state
export interface GeneratorState {
  /**
   * List of colors in the palette
   * Each color can have its own overrides for scale options
   * Maximum of 10 colors
   */
  colors: ColorEntry[];
  /**
   * Global scale options that apply to all colors unless overridden
   */
  globalOptions: GlobalScaleOptions;
  /**
   * Display name of the palette. Optional on the structural state (the
   * colors/globalOptions slice has none); the store always carries one
   * (see GeneratorStore). Defaults to DEFAULT_PALETTE_NAME, URL-seeded
   * (`?name=`, omitted when default) and synced via useUrlSync. For a saved
   * palette the record name is authoritative and seeded over the URL value.
   */
  name?: string;
}

export interface SavedPalette {
  createdAt: string;
  id: string;
  isFavorite: boolean;
  name: string;
  updatedAt: string;
  url: string;
  userId: string;
}

export interface ScaleExportData {
  name: string;
  steps: ScaleSteps;
}
