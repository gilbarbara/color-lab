import { clamp, round } from '@gilbarbara/helpers';
import { type ScaleChromaPeak, type ScaleRange } from 'colorizr';

import { CHROMA_PEAK_DEFAULT } from '~/config/scale';
import { getChromaAsPercentage } from '~/utils/color';

import type { GlobalScaleOptions, OklchString } from '~/types';

type ChromaCurveValue = GlobalScaleOptions['chromaCurve'];
type LightnessCurveValue = GlobalScaleOptions['lightnessCurve'];

export type ChromaCurveMode = 'scalar' | 'range';
export type HueShiftMode = 'scalar' | 'range';
export type LightnessCurveMode = 'scalar' | 'range';

/** Normalized chroma curve, mirroring scale()'s internal config. */
export type NormalizedChromaCurve =
  | { amount: number; peak: number; type: 'parabola' }
  | { high: number; low: number; type: 'range' };

/**
 * UI mode for a chromaCurve value. The parabola family (scalar and `{ amount, peak }`)
 * shares one "Simple" tab — peak is just an extra knob on the same curve — so only the
 * gamut-fraction `{ low, high }` form maps to "Range".
 */
export function getChromaCurveMode(value: ChromaCurveValue): ChromaCurveMode {
  return isCurveRange(value) ? 'range' : 'scalar';
}

/**
 * Input color's chroma as a 0→1 fraction of the P3 ceiling — the range seed/mid.
 * Rounded to the chroma slider's resolution: this value is stored/serialized, so
 * raw `/100` float junk (0.8009999999999999) must not leak into state or the URL.
 */
export function getChromaFraction(color: OklchString): number {
  return round(clamp(getChromaAsPercentage(color) / 100, 0, 1), 2);
}

/** UI mode for a hueShift value — symmetric scalar vs independent endpoints. */
export function getHueShiftMode(value: number | ScaleRange): HueShiftMode {
  return typeof value === 'number' ? 'scalar' : 'range';
}

/** UI mode for a lightnessCurve value — scalar vs split. */
export function getLightnessCurveMode(value: LightnessCurveValue): LightnessCurveMode {
  return typeof value === 'number' ? 'scalar' : 'range';
}

/** The single shape discriminators for curve option values, reused everywhere. */
export function isCurvePeak(value: unknown): value is ScaleChromaPeak {
  return typeof value === 'object' && value !== null && 'amount' in value;
}

export function isCurveRange(value: unknown): value is ScaleRange {
  return typeof value === 'object' && value !== null && 'low' in value && 'high' in value;
}

/**
 * Shape-sensitive equality for option values. A number and an object are never
 * equal — the shape carries the UI mode, so `1.3` and `{ low: 1.3, high: 1.3 }`
 * are deliberately distinct. Objects compare field-wise (peak defaults to 0.5).
 */
export function isSameOptionValue(a: unknown, b: unknown): boolean {
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    if (isCurvePeak(a) && isCurvePeak(b)) {
      return (
        a.amount === b.amount && (a.peak ?? CHROMA_PEAK_DEFAULT) === (b.peak ?? CHROMA_PEAK_DEFAULT)
      );
    }

    if (isCurveRange(a) && isCurveRange(b)) {
      return a.low === b.low && a.high === b.high;
    }

    return false;
  }

  return a === b;
}

/**
 * Lightness at position t (0→1, low-key → high-key), replicating scale()'s
 * standard non-locked interpolation with a continuous per-half exponent.
 * Light mode only (the preview does not replicate the locked split).
 */
export function lightnessAt(t: number, curve: ScaleRange, minL: number, maxL: number): number {
  const exponent = curve.low + (curve.high - curve.low) * t;
  const eased = t ** exponent;

  return maxL - (maxL - minL) * eased;
}

/** Normalize chromaCurve for preview math: scalar → parabola at 0.5. */
export function normalizeChromaCurve(value: ChromaCurveValue): NormalizedChromaCurve {
  if (typeof value === 'number') {
    return { amount: value, peak: CHROMA_PEAK_DEFAULT, type: 'parabola' };
  }

  if (isCurvePeak(value)) {
    return { amount: value.amount, peak: value.peak ?? CHROMA_PEAK_DEFAULT, type: 'parabola' };
  }

  return { high: value.high, low: value.low, type: 'range' };
}

/**
 * Normalize hueShift: scalar x → { low: -x, high: x } (symmetric drift, per scale()).
 * Note the asymmetry with normalizeLightnessCurve (x → { x, x }).
 */
export function normalizeHueShift(value: number | ScaleRange): ScaleRange {
  return typeof value === 'number' ? { low: -value, high: value } : value;
}

/** Normalize lightnessCurve: scalar x → { low: x, high: x }. */
export function normalizeLightnessCurve(value: LightnessCurveValue): ScaleRange {
  return typeof value === 'number' ? { low: value, high: value } : value;
}

/**
 * Parabola family from scale()'s getStepChroma — returns the 0→1 multiplier
 * applied to base chroma (not the chroma itself). peak 0.5 keeps the legacy
 * expression so scalar output stays identical.
 */
export function parabolicScale(lightness: number, amount: number, peak: number): number {
  if (amount === 0) {
    return 1;
  }

  const parabolic =
    peak === CHROMA_PEAK_DEFAULT
      ? 4 * lightness * (1 - lightness)
      : Math.max(0, 1 - ((lightness - peak) / Math.max(peak, 1 - peak)) ** 2);

  return Math.max(0, 1 - amount * (1 - parabolic));
}
