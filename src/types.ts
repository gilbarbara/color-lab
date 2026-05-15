import type { ScaleOptions as ScaleOptionsBase } from 'colorizr';

export type ExportColorFormat = 'oklch' | 'hex' | 'hsl' | 'rgb' | 'rgb-channels';

// Export types
export type ExportFormatType = 'tailwind3' | 'tailwind4' | 'css' | 'scss' | 'svg';

export type GetPaletteResult =
  | { kind: 'success'; palette: SavedPalette }
  | { kind: 'not-found' }
  | { error: unknown; kind: 'error' };

export type ScaleOptions = Omit<ScaleOptionsBase, 'format'>;

export type ScaleSteps = Record<string, string>;

export interface ColorEntry {
  id: string;
  name: string;
  overrides?: Partial<ScaleOptions>;
  value: string;
}

export interface ExportOptions {
  colorFormat: ExportColorFormat;
  formatType: ExportFormatType;
}

export interface GlobalScaleOptions extends ScaleOptions {
  chromaCurve: number;
  lightnessCurve: number;
  maxLightness: number;
  minLightness: number;
  saturation: number;
  saturationOverride: boolean;
  steps: number;
}

export interface PaletteActions {
  addColor: (value: string, name?: string) => string | null;
  clearColorOverrides: (index: number) => void;
  removeColor: (index: number) => void;
  resetGlobalOptions: () => void;
  resetPalette: () => void;
  setActiveColor: (id: string) => void;
  setPreviewColor: (id: string) => void;
  updateColor: (index: number, updates: Partial<ColorEntry>) => void;
  updateColorOverrides: (index: number, overrides: Partial<ScaleOptions>) => void;
  updateGlobalOptions: (updates: Partial<GlobalScaleOptions>) => void;
}

// Top-level palette state
export interface PaletteState {
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
