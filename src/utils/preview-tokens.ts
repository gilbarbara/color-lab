import type { CSSProperties } from 'react';
import { objectKeys } from '@gilbarbara/helpers';
import { parseCSS, readableColor, scale, type ScaleMode } from 'colorizr';

import type { EffectiveScaleOptions } from '~/types';

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
  lightMode: Exclude<ScaleMode, 'dark'>,
  darkMode: Exclude<ScaleMode, 'dark'>,
): ScaleSet {
  // Spread the effective scale options first (chromaCurve, lightnessCurve, hueShift,
  // min/maxLightness, saturation, lock, overrides) so the preview mirrors the palette's own scale,
  // then pin only the preview-controlled fields: format and the mode per theme slot. The grid
  // matches the palette's step count, floored at 10 so the canonical HeroUI stop set (50–900)
  // always exists even when the user picks fewer steps. The dark slot uses 'reversed' (the light
  // ramp's values with reversed keys), not re-curved 'dark', so its 500 stays equal to the light
  // 500 while the surface ramp inverts for dark backgrounds.
  const steps = options.steps < 10 ? 10 : options.steps;

  return {
    lightOklch: scale(color, { ...options, steps, mode: lightMode, format: 'oklch' }),
    lightHex: scale(color, { ...options, steps, mode: lightMode, format: 'hex' }),
    darkOklch: scale(color, { ...options, steps, mode: darkMode, format: 'oklch' }),
    darkHex: scale(color, { ...options, steps, mode: darkMode, format: 'hex' }),
  };
}

function tokensFromScales(scales: ScaleSet): CSSProperties {
  const vars: Record<string, string> = {};

  for (const step of objectKeys(scales.lightOklch)) {
    vars[`--color-preview-${step}-light-oklch`] = scales.lightOklch[step];
    vars[`--color-preview-${step}-light-hex`] = scales.lightHex[step];
    vars[`--color-preview-${step}-dark-oklch`] = scales.darkOklch[step];
    vars[`--color-preview-${step}-dark-hex`] = scales.darkHex[step];
  }

  // The primary token is the scale's real 500 stop — the same value as the 500 swatch in the
  // header's scale row. It is mode-invariant: a brand color does not change between light and dark
  // themes, only the surrounding shades do, and `reversed[500] === light[500]` makes both slots
  // agree anyway.
  const oklchBase = scales.lightOklch[500];
  const hexBase = scales.lightHex[500];

  vars['--color-preview-light-oklch'] = oklchBase;
  vars['--color-preview-light-hex'] = hexBase;
  vars['--color-preview-dark-oklch'] = oklchBase;
  vars['--color-preview-dark-hex'] = hexBase;

  // Foreground only needs one source per gamut — APCA picks black/white either way.
  const oklchForeground = readableColor(oklchBase, 'apca');
  const hexForeground = readableColor(hexBase, 'apca');

  vars['--color-preview-foreground-light-oklch'] = oklchForeground;
  vars['--color-preview-foreground-light-hex'] = hexForeground;
  vars['--color-preview-foreground-dark-oklch'] = oklchForeground;
  vars['--color-preview-foreground-dark-hex'] = hexForeground;

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
 * Each slot is built in 'light' or 'reversed' mode (never re-curved 'dark', which
 * would shift the 500 off the swatch). `forced` (user override) collapses both
 * slots to one mode so the `.dark` swap is a no-op. The auto path picks per slot by
 * the color's lightness: very light (l >= 0.9) → reversed on both, very dark
 * (l <= 0.3) → light on both, mid-range → light slot + reversed slot.
 */
export function buildPreviewScope(
  color: string,
  options: EffectiveScaleOptions,
  forced?: 'light' | 'dark',
): CSSProperties {
  if (forced) {
    const mode = forced === 'dark' ? 'reversed' : forced;

    return tokensFromScales(scaleSet(color, options, mode, mode));
  }

  const { l } = parseCSS(color, 'oklch');

  if (l >= 0.9) return tokensFromScales(scaleSet(color, options, 'reversed', 'reversed'));
  if (l <= 0.3) return tokensFromScales(scaleSet(color, options, 'light', 'light'));

  return tokensFromScales(scaleSet(color, options, 'light', 'reversed'));
}
