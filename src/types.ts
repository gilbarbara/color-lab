import type { ScaleChromaPeak, ScaleOptions as ScaleOptionsBase, ScaleRange } from 'colorizr';

export type ExportColorFormat = 'oklch' | 'hex' | 'hsl' | 'rgb' | 'rgb-channels';

// Export types
export type ExportFormatType = 'tailwind3' | 'tailwind4' | 'css' | 'scss' | 'svg';

export type Gamut = 'p3' | 'srgb';

export type GetPaletteResult =
  | { kind: 'success'; palette: SavedPalette }
  | { kind: 'not-found' }
  // permission-denied: deleted, not-owned, or otherwise denied read. We only know
  // the read was refused, not that the doc is gone — so this stays distinct from
  // 'not-found' rather than fabricating it.
  | { kind: 'forbidden' }
  | { error: unknown; kind: 'error' };

export type OklchString = string & { readonly __brand: 'OklchString' };

// All three curve options share the same shape contract: a scalar (Simple mode) or
// an object (Split / movable peak). hueShift's scalar x means symmetric drift
// (≡ { low: -x, high: x }); chroma/lightness scalars mean both ends equal.
export type ScaleOptions = Omit<ScaleOptionsBase, 'format' | 'hueShift'> & {
  hueShift?: number | ScaleRange;
};

export type ScaleSteps = Record<string, string>;

export interface ColorEntry {
  id: string;
  name: string;
  overrides?: Partial<ScaleOptions>;
  value: OklchString;
}

/**
 * The options a freshly-defaulted palette uses. Curves are always their scalar
 * shape — `getDefaultGlobalOptions` only ever produces scalars;
 * the store widens to the object modes in `GlobalScaleOptions` once the user
 * switches a curve. Typing the default narrowly keeps "the default" from being
 * a range/peak.
 */
export interface DefaultScaleOptions extends GlobalScaleOptions {
  chromaCurve: number;
  hueShift: number;
  lightnessCurve: number;
}

export interface ExportOptions {
  colorFormat: ExportColorFormat;
  formatType: ExportFormatType;
}

export interface GeneratorActions {
  addColor: (value: OklchString, name?: string) => string | null;
  clearColorOverrides: (index: number) => void;
  removeColor: (index: number) => string | null;
  resetGlobalOptions: () => void;
  resetPalette: () => void;
  setActiveColor: (id: string) => void;
  setColorOverride: (index: number, updates: Partial<ScaleOptions>) => void;
  setName: (name: string) => void;
  setPreviewColor: (id: string) => void;
  updateColor: (index: number, updates: Partial<ColorEntry>) => void;
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

export interface GlobalScaleOptions extends ScaleOptions {
  chromaCurve: number | ScaleChromaPeak | ScaleRange;
  // Required (the global panel always has a value); shape carries the UI mode
  // (scalar = Simple, range = Split), like the other curves.
  hueShift: number | ScaleRange;
  lightnessCurve: number | ScaleRange;
  maxLightness: number;
  minLightness: number;
  saturation: number;
  saturationOverride: boolean;
  steps: number;
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
