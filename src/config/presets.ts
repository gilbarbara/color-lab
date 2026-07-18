import type { GlobalScaleOptions } from '~/types';

export const DESIGN_SYSTEM_PRESETS = {
  tailwind: {
    minLightness: 0.28,
    maxLightness: 0.99,
    lightnessCurve: { low: 1.3, high: 1.05 },
    chromaCurve: { low: 0.75, high: 0.83 },
    hueShift: 0,
  },
  material: {
    minLightness: 0.48,
    maxLightness: 0.95,
    lightnessCurve: { low: 0.8, high: 0.9 },
    chromaCurve: { low: 0.5, high: 0.8 },
    hueShift: { low: 1, high: -5 },
  },
  bootstrap: {
    minLightness: 0.24,
    maxLightness: 0.93,
    lightnessCurve: { low: 0.9, high: 1.1 },
    chromaCurve: { low: 0.73, high: 0.7 },
    hueShift: { low: 9, high: 2 },
  },
  opencolor: {
    minLightness: 0.48,
    maxLightness: 0.97,
    lightnessCurve: { low: 1.05, high: 1.4 },
    chromaCurve: { low: 0.8, high: 0.75 },
    hueShift: 0,
  },
} satisfies Record<string, Partial<GlobalScaleOptions>>;

export type PresetKey = keyof typeof DESIGN_SYSTEM_PRESETS;
