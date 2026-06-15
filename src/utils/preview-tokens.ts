import type { CSSProperties } from 'react';
import { parseCSS, readableColor, scale } from 'colorizr';

import type { EffectiveScaleOptions } from '~/types';

const STOP_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

type Steps = Record<number, string>;

interface ScaleSet {
  darkHex: Steps;
  darkOklch: Steps;
  lightHex: Steps;
  lightOklch: Steps;
}

function scaleSet(
  color: string,
  options: EffectiveScaleOptions,
  lightMode: 'light' | 'dark',
  darkMode: 'light' | 'dark',
): ScaleSet {
  // Spread the effective scale options first (chromaCurve, lightnessCurve, hueShift,
  // min/maxLightness, saturation, overrides) so the preview matches the palette, then pin the
  // preview-controlled fields last: a fixed 10-stop grid (HeroUI-compatible) with the source
  // color locked at 500, and the mode chosen per theme slot.
  return {
    lightOklch: scale(color, {
      ...options,
      steps: 10,
      mode: lightMode,
      lock: 500,
      format: 'oklch',
    }),
    lightHex: scale(color, { ...options, steps: 10, mode: lightMode, lock: 500, format: 'hex' }),
    darkOklch: scale(color, { ...options, steps: 10, mode: darkMode, lock: 500, format: 'oklch' }),
    darkHex: scale(color, { ...options, steps: 10, mode: darkMode, lock: 500, format: 'hex' }),
  };
}

function tokensFromScales(scales: ScaleSet): CSSProperties {
  const vars: Record<string, string> = {};

  for (const stop of STOP_KEYS) {
    vars[`--color-preview-${stop}-light-oklch`] = scales.lightOklch[stop];
    vars[`--color-preview-${stop}-light-hex`] = scales.lightHex[stop];
    vars[`--color-preview-${stop}-dark-oklch`] = scales.darkOklch[stop];
    vars[`--color-preview-${stop}-dark-hex`] = scales.darkHex[stop];
  }

  const { 500: lightOklchBase } = scales.lightOklch;
  const { 500: lightHexBase } = scales.lightHex;
  const { 500: darkOklchBase } = scales.darkOklch;
  const { 500: darkHexBase } = scales.darkHex;

  vars['--color-preview-light-oklch'] = lightOklchBase;
  vars['--color-preview-light-hex'] = lightHexBase;
  vars['--color-preview-dark-oklch'] = darkOklchBase;
  vars['--color-preview-dark-hex'] = darkHexBase;

  // Foreground only needs one source — APCA picks black/white either way.
  vars['--color-preview-foreground-light-oklch'] = readableColor(lightOklchBase, 'apca');
  vars['--color-preview-foreground-light-hex'] = readableColor(lightHexBase, 'apca');
  vars['--color-preview-foreground-dark-oklch'] = readableColor(darkOklchBase, 'apca');
  vars['--color-preview-foreground-dark-hex'] = readableColor(darkHexBase, 'apca');

  return vars as CSSProperties;
}

/**
 * Emit the preview scale as paired CSS custom properties — one for each
 * combination of (theme × gamut). `.preview-scope` (in index.css) rebinds
 * canonical names (`--color-preview`, `--color-preview-500`, etc.) to the
 * matching combo based on `.dark` on the document and `[data-gamut]` on html.
 *
 * Server emits all four variants; CSS picks the right one at paint time.
 * No JS branch on theme or gamut → no hydration mismatch.
 *
 * `forced` (user override) collapses both theme slots to the same scale so
 * `.dark` swap is a no-op. The auto path uses color lightness to lock very
 * light or very dark colors the same way.
 */
export function buildPreviewScope(
  color: string,
  options: EffectiveScaleOptions,
  forced?: 'light' | 'dark',
): CSSProperties {
  if (forced) {
    return tokensFromScales(scaleSet(color, options, forced, forced));
  }

  const { l } = parseCSS(color, 'oklch');

  if (l >= 0.9) return tokensFromScales(scaleSet(color, options, 'dark', 'dark'));
  if (l <= 0.3) return tokensFromScales(scaleSet(color, options, 'light', 'light'));

  return tokensFromScales(scaleSet(color, options, 'light', 'dark'));
}
