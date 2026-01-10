import { round } from '@gilbarbara/helpers';
import { type ColorType, getOkLCHMaxChroma, parseCSS, random } from 'colorizr';

/**
 * Convert OKLCH chroma to a 0-100 percentage based on max chroma.
 * This provides a consistent "saturation" value that reaches 100
 * when chroma is at its maximum for the given lightness/hue.
 */
export function getChromaAsPercentage(color: string): number {
  const { c, h, l } = parseCSS(color, 'oklch');

  const maxChroma = getOkLCHMaxChroma({ l, c: 0, h });

  if (c === 0 || maxChroma === 0) {
    return 0;
  }

  return round((c / maxChroma) * 100, 1);
}

export function getRandomColor(format: ColorType, saturation?: number) {
  return random({
    format,
    minLightness: 50,
    maxLightness: 70,
    minSaturation: saturation ?? 50,
    maxSaturation: saturation,
  });
}
