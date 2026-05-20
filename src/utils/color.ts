import { clamp, round } from '@gilbarbara/helpers';
import { getP3MaxChroma, parseCSS, random } from 'colorizr';

import type { OklchString } from '~/types';

interface OklchValues {
  c: number;
  h: number;
  l: number;
}

const L_PRECISION = 2;
const C_PRECISION = 3;
const H_PRECISION = 2;

function toOklchValues(value: string | OklchValues): OklchValues {
  return typeof value === 'string' ? parseCSS(value, 'oklch') : value;
}

export function formatOklch(value: string | OklchValues): string {
  const { c, h, l } = toOklchValues(value);
  const lightness = `${round(l * 100, L_PRECISION)}%`;

  if (c === 0) {
    return `oklch(${lightness} 0 none)`;
  }

  return `oklch(${lightness} ${c.toFixed(C_PRECISION)} ${round(h, H_PRECISION)})`;
}

/**
 * URL-form OKLCH: `L_C_H` (no wrapper, underscore-joined).
 * Shares precision with {@link formatOklch} so canonical and URL forms round-trip cleanly.
 */
export function formatOklchUrl(value: string | OklchValues): string {
  const { c, h, l } = toOklchValues(value);

  return `${round(l * 100, L_PRECISION)}_${round(c, C_PRECISION)}_${round(h, H_PRECISION)}`;
}

/**
 * Convert OKLCH chroma to a 0-100 percentage based on max chroma.
 * This provides a consistent "saturation" value that reaches 100
 * when chroma is at its maximum for the given lightness/hue.
 */
export function getChromaAsPercentage(color: OklchString): number {
  const { c, h, l } = parseCSS(color, 'oklch');

  const maxChroma = getP3MaxChroma({ l, c: 0, h });

  if (c === 0 || maxChroma === 0) {
    return 0;
  }

  return clamp(round((c / maxChroma) * 100, 1), 0, 100);
}

export function getRandomColor(saturation?: number): OklchString {
  return random({
    format: 'oklch',
    minLightness: 50,
    maxLightness: 70,
    minSaturation: saturation ?? 50,
    maxSaturation: saturation,
  }) as OklchString;
}

/**
 * Range guard for raw OKLCH values (L expressed as 0..1).
 * Hue is intentionally unconstrained — CSS spec normalizes mod-360.
 */
export function isInRangeOklch({ c, l }: OklchValues): boolean {
  return Number.isFinite(l) && l >= 0 && l <= 1 && Number.isFinite(c) && c >= 0;
}

// parseCSS validates syntax AND throws on negative L, big H, negative C.
// Only L > 1 slips through silently, which isInRangeOklch catches here.
// Do NOT use colorizr's isValidColor — it returns true for inputs parseCSS then
// throws on (e.g. 'oklch(-10% 0.1 100)', 'oklch(50% 0.1 9999)') — contract leak.
export function isValidColorValue(value: string): boolean {
  try {
    return isInRangeOklch(parseCSS(value, 'oklch'));
  } catch {
    return false;
  }
}

/**
 * Rotate an OKLCH color's hue by `deltaDeg`, staying in OKLCH space.
 * Avoids colorizr's `rotate` which round-trips through HSL (lossy + gamut-clipping).
 */
export function rotateOklchHue(value: OklchString, deltaDeg: number): OklchString {
  const { c, h, l } = parseCSS(value, 'oklch');
  const nextH = (((h + deltaDeg) % 360) + 360) % 360;

  return formatOklch({ c, h: nextH, l }) as OklchString;
}

/**
 * The only mint site for `OklchString`. Validates via parseCSS (throws on
 * syntax / negative L / big H / negative C) and via isInRangeOklch (catches
 * the L > 1 case that parseCSS silently accepts). Normalises via formatCSS so
 * every branded value is in canonical oklch CSS form.
 */
export function toOklch(value: string): OklchString {
  const parsed = parseCSS(value, 'oklch');

  if (!isInRangeOklch(parsed)) {
    throw new Error(`toOklch: value out of OKLCH range: ${value}`);
  }

  return formatOklch(parsed) as OklchString;
}
