import { round } from '@gilbarbara/helpers';
import { getP3MaxChroma, parseCSS, random } from 'colorizr';

interface OklchValues {
  c: number;
  h: number;
  l: number;
}

/**
 * Convert OKLCH chroma to a 0-100 percentage based on max chroma.
 * This provides a consistent "saturation" value that reaches 100
 * when chroma is at its maximum for the given lightness/hue.
 */
export function getChromaAsPercentage(color: string): number {
  const { c, h, l } = parseCSS(color, 'oklch');

  const maxChroma = getP3MaxChroma({ l, c: 0, h });

  if (c === 0 || maxChroma === 0) {
    return 0;
  }

  return round((c / maxChroma) * 100, 1);
}

export function getRandomColor(saturation?: number) {
  return random({
    format: 'oklch',
    minLightness: 50,
    maxLightness: 70,
    minSaturation: saturation ?? 50,
    maxSaturation: saturation,
  });
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
