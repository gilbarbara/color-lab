import { getScaleStepKeys, parseCSS } from 'colorizr';

import type { ScaleSteps } from '~/types';

export interface ParsedStep {
  c: number;
  h: number;
  l: number;
  label: string;
  t: number;
}

/**
 * Anchor position as t in [0, 1] from the lock/steps, matching scale()'s
 * anchorIndex: the lock step when valid, else the middle step.
 */
export function getAnchorT(steps: number, lock: number | undefined): number {
  const keys = getScaleStepKeys(steps);
  const last = keys.length - 1;
  const anchorIndex =
    lock !== undefined && keys.includes(lock) ? keys.indexOf(lock) : Math.floor(last / 2);

  return anchorIndex / last;
}

/**
 * Parse the real scale() output into per-step OKLCH channels plus position t in
 * [0, 1]. This is the charts' single source of truth — l/c/h already bake in the
 * scale options (mode, lock, curves), so charts stay in sync with the swatches.
 */
export function parseSteps(steps: ScaleSteps): Array<ParsedStep> {
  const entries = Object.entries(steps);
  const last = entries.length - 1;

  return entries.map(([label, color], index) => {
    const { c, h, l } = parseCSS(color, 'oklch');

    return { c, h, l, label, t: last > 0 ? index / last : 0.5 };
  });
}

/**
 * Fraction of the gamut ceiling for the range model, generalized from
 * scale()'s getStepRelativeChroma to a continuous t with the anchor at anchorT.
 */
export function rangeFractionAt(
  t: number,
  anchorT: number,
  low: number,
  mid: number,
  high: number,
): number {
  if (t === anchorT) {
    return mid;
  }

  if (t < anchorT) {
    return low + (mid - low) * (t / anchorT);
  }

  return mid + (high - mid) * ((t - anchorT) / (1 - anchorT));
}

/**
 * Unwrap a hue sequence into continuous degrees anchored near `start`, so a
 * polyline crossing the 360°→0° boundary stays continuous instead of jumping.
 */
export function unwrapHues(hues: Array<number>, start: number): Array<number> {
  let previous = start;

  return hues.map(hue => {
    let value = hue;

    while (value - previous > 180) {
      value -= 360;
    }

    while (value - previous < -180) {
      value += 360;
    }

    previous = value;

    return value;
  });
}
