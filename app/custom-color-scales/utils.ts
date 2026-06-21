import { objectKeys } from '@gilbarbara/helpers';

import { DESIGN_SYSTEM_PRESETS } from '~/config/presets';
import { createPalette } from '~/utils/generator';
import { serializePaletteToUrl } from '~/utils/url';

import type { GlobalScaleOptions, OklchString } from '~/types';

export interface Variant {
  key: string;
  label: string;
  options: Partial<GlobalScaleOptions>;
}

export const baseColor = 'oklch(62.3% 0.214 259.815)' as OklchString;

/** Generator link seeded with the demo's base color at default (even) options. */
export const generatorHref = serializePaletteToUrl(createPalette(baseColor));

// Grid hook: a flat even baseline vs the same scale with all three swing levers applied.
export const FLAT: Variant = {
  key: 'flat',
  label: 'Flat',
  options: { lightnessCurve: 1, maxLightness: 0.9, minLightness: 0.2 },
};

export const SWING: Variant = {
  key: 'swing',
  label: 'Swing',
  options: {
    lightnessCurve: { low: 1.15, high: 1.4 },
    chromaCurve: { low: 0.78, high: 0.75 },
    hueShift: 10,
  },
};

// Lever deep-dives: a single shaped variant each; the chart draws the deviation.
export const RANGE: Variant = { key: 'range', label: '97% -> 26%', options: {} };
export const RANGE_MID: Variant = {
  key: 'range_mid',
  label: '90% -> 45%',
  options: { minLightness: 0.45, maxLightness: 0.9 },
};
export const RANGE_FULL: Variant = {
  key: 'range_full',
  label: '100% -> 0%',
  options: { minLightness: 0, maxLightness: 1 },
};

export const LIGHTNESS: Variant = {
  key: 'lightness',
  label: 'Lightness',
  options: { lightnessCurve: { low: 1.2, high: 0.1 } },
};

export const CHROMA: Variant = {
  key: 'chroma',
  label: 'Chroma',
  options: { chromaCurve: { amount: 0.8, peak: 0.2 } },
};

export const HUE: Variant = {
  key: 'hue',
  label: 'Hue',
  options: { hueShift: { low: -12, high: 15 } },
};

// Why-systems-differ: each real design system as a named, shaped variant.
// Explicit labels — the keys don't capitalize cleanly (e.g. opencolor → "Open Color").
const PRESET_LABELS: Record<keyof typeof DESIGN_SYSTEM_PRESETS, string> = {
  bootstrap: 'Bootstrap',
  material: 'Material',
  opencolor: 'Open Color',
  tailwind: 'Tailwind',
};

export const PRESET_VARIANTS: Variant[] = objectKeys(DESIGN_SYSTEM_PRESETS).map(key => ({
  key,
  label: PRESET_LABELS[key],
  options: DESIGN_SYSTEM_PRESETS[key],
}));
