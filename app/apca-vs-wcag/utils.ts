import {
  apcaContrast,
  contrast,
  DEG2RAD,
  getP3MaxChroma,
  LMS_TO_LRGB,
  OKLAB_TO_CLMS,
  SRGB_TO_P3,
  srgbGammaEncode,
} from 'colorizr';

const TEXT_BLACK = '#000000';
const TEXT_WHITE = '#ffffff';

// The hook color sits inside the band where the two methods disagree.
export const CONTRAST_HOOK_COLOR = '#ff0044';

// "Same color, two answers": every hue at this lightness falls inside the band.
export const CONTRAST_COMPARE_HUES = [0, 40, 80, 120, 160, 200, 240, 280, 320];
export const CONTRAST_COMPARE_LIGHTNESS = 0.62;
export const CONTRAST_COMPARE_CHROMA = 0.2;

// Disagreement band overlay: chroma rows sampled per hue, and the L window searched for flips.
// Below L 0.3 the sRGB gamut breaks into fragments near black, and no flip happens there.
const BAND_ROWS = 24;
const BAND_MIN_LIGHTNESS = 0.3;
const BAND_MAX_LIGHTNESS = 1;

type MaxChroma = (l: number) => number;
export type ContrastMethod = 'apca' | 'wcag';

export type TextColor = 'black' | 'white';

export interface BandRow {
  /** Lightness where APCA switches from white to black text; null when outside P3. */
  apca: number | null;
  /** Lightness interval where WCAG picks black and APCA picks white. */
  band: [number, number] | null;
  c: number;
  /** Lightness where WCAG switches from white to black text; null when outside P3. */
  wcag: number | null;
}

export interface DisagreementBand {
  /** The P3 edge's sharpest point (most chroma); the panel's top-right corner. */
  cusp: { c: number; l: number };
  /** Where each flip meets the P3 edge; closes the band along the edge instead of a chord. */
  edges: Record<ContrastMethod, { c: number; l: number } | null>;
  rows: BandRow[];
}

export interface TextPick {
  apca: TextColor;
  /** Absolute APCA Lc for each text color. */
  apcaLc: Record<TextColor, number>;
  wcag: TextColor;
  wcagRatio: Record<TextColor, number>;
}

// 2^-16 of the search interval: far below one 8-bit color step.
const BISECT_STEPS = 16;
const GAMUT_SCAN_STEP = 0.01;
// Bisection inside one scan step: 0.01 / 2^8 ≈ 0.00004 L.
const EDGE_STEPS = 8;

export const TEXT_HEX: Record<TextColor, string> = { black: TEXT_BLACK, white: TEXT_WHITE };

function bisectEdge(
  lo: number,
  hi: number,
  isInside: (l: number) => boolean,
  steps = BISECT_STEPS,
): number {
  // `lo` and `hi` sit on opposite sides; returns the side of `isInside(lo)`.
  const loInside = isInside(lo);
  let a = lo;
  let b = hi;

  for (let index = 0; index < steps; index++) {
    const mid = (a + b) / 2;

    if (isInside(mid) === loInside) {
      a = mid;
    } else {
      b = mid;
    }
  }

  return a;
}

/** Largest P3 chroma for the hue across the searched lightness window. */
function getCuspChroma(h: number, maxChroma: MaxChroma = l => getMaxChroma(l, h)): number {
  let max = 0;

  // Same L sequence as `getGamutRange`, so a memoized `maxChroma` is reused.
  for (let l = BAND_MIN_LIGHTNESS; l <= BAND_MAX_LIGHTNESS + 1e-9; l += GAMUT_SCAN_STEP) {
    max = Math.max(max, maxChroma(l));
  }

  return max;
}

/** In-gamut lightness range for a chroma row, or null when the row has no P3 colors. */
export function getGamutRange(
  c: number,
  h: number,
  maxChroma: MaxChroma = l => getMaxChroma(l, h),
): [number, number] | null {
  const samples: Array<{ l: number; max: number }> = [];

  for (let l = BAND_MIN_LIGHTNESS; l <= BAND_MAX_LIGHTNESS + 1e-9; l += GAMUT_SCAN_STEP) {
    samples.push({ l, max: maxChroma(l) });
  }

  const first = samples.findIndex(sample => c <= sample.max);

  if (first === -1) return null;

  let last = first;

  for (let index = first; index < samples.length; index++) {
    if (c <= samples[index].max) last = index;
  }

  // The scan already bracketed each edge to one step; a short bisection inside the bracket is
  // enough (each exact lookup is a search inside colorizr, and interpolation drifts at sharp
  // cusps like red's).
  const inside = (l: number) => c <= maxChroma(l);
  const lo =
    first > 0
      ? bisectEdge(samples[first].l, samples[first - 1].l, inside, EDGE_STEPS)
      : samples[first].l;
  const hi = Math.min(
    BAND_MAX_LIGHTNESS,
    last < samples.length - 1
      ? bisectEdge(samples[last].l, samples[last + 1].l, inside, EDGE_STEPS)
      : samples[last].l,
  );

  return [lo, hi];
}

/** Largest chroma at (l, h) inside P3, the app's display gamut. */
export function getMaxChroma(l: number, h: number): number {
  // colorizr throws outside [0, 1]; the gamut scan steps past the ends while bisecting.
  if (l <= 0 || l >= 1) return 0;

  return getP3MaxChroma({ l, c: 0, h });
}

export function pickText(background: string): TextPick {
  const wcagRatio = {
    black: contrast(TEXT_BLACK, background),
    white: contrast(TEXT_WHITE, background),
  };
  // APCA takes the background first and returns a signed Lc.
  const apcaLc = {
    black: Math.abs(apcaContrast(background, TEXT_BLACK)),
    white: Math.abs(apcaContrast(background, TEXT_WHITE)),
  };

  return {
    apca: apcaLc.black > apcaLc.white ? 'black' : 'white',
    apcaLc,
    wcag: wcagRatio.black > wcagRatio.white ? 'black' : 'white',
    wcagRatio,
  };
}

/**
 * Unrounded CSS for measuring and painting. colorizr maps colors outside sRGB before
 * measuring, as the Contrast Grid does.
 */
export function toOklchCSS({ c, h, l }: { c: number; h: number; l: number }): string {
  return `oklch(${l} ${c} ${h})`;
}

const PICKERS: Record<ContrastMethod, (background: string) => TextColor> = {
  apca: background =>
    Math.abs(apcaContrast(background, TEXT_BLACK)) > Math.abs(apcaContrast(background, TEXT_WHITE))
      ? 'black'
      : 'white',
  wcag: background =>
    contrast(TEXT_BLACK, background) > contrast(TEXT_WHITE, background) ? 'black' : 'white',
};

interface HSV {
  h: number;
  s: number;
  v: number;
}

function pickAt(l: number, c: number, h: number, method: ContrastMethod): TextColor {
  return PICKERS[method](toOklchCSS({ c, h, l }));
}

/**
 * Where `method`'s flip meets the P3 edge: bisects L along c = max chroma.
 * Each pick changes once along the edge, so bisection is valid.
 */
export function findBoundaryFlip(
  h: number,
  method: ContrastMethod,
  maxChroma: MaxChroma = l => getMaxChroma(l, h),
): { c: number; l: number } | null {
  const pickOnEdge = (l: number) => pickAt(l, maxChroma(l), h, method);
  const lo = BAND_MIN_LIGHTNESS;
  // Just under 1: at L = 1 the edge collapses to white.
  const hi = BAND_MAX_LIGHTNESS - 1e-3;

  if (pickOnEdge(lo) === pickOnEdge(hi)) return null;

  const l = bisectEdge(lo, hi, value => pickOnEdge(value) === 'white');

  return { c: maxChroma(l), l };
}

/** Lightness with the most P3 chroma for the hue, refined by ternary search. */
export function findCusp(
  h: number,
  maxChroma: MaxChroma = l => getMaxChroma(l, h),
): { c: number; l: number } {
  let best = BAND_MIN_LIGHTNESS;

  for (let l = BAND_MIN_LIGHTNESS; l <= BAND_MAX_LIGHTNESS + 1e-9; l += GAMUT_SCAN_STEP) {
    if (maxChroma(l) > maxChroma(best)) best = l;
  }

  let lo = Math.max(0, best - GAMUT_SCAN_STEP);
  let hi = Math.min(1, best + GAMUT_SCAN_STEP);

  for (let index = 0; index < BISECT_STEPS; index++) {
    const a = lo + (hi - lo) / 3;
    const b = hi - (hi - lo) / 3;

    if (maxChroma(a) < maxChroma(b)) {
      lo = a;
    } else {
      hi = b;
    }
  }

  const l = (lo + hi) / 2;

  return { c: maxChroma(l), l };
}

/**
 * Lightness where `method` switches from white to black text inside the gamut range.
 * Each pick changes once along L, so bisection is valid.
 */
export function findFlip(
  c: number,
  h: number,
  method: ContrastMethod,
  range = getGamutRange(c, h),
): number | null {
  if (!range) return null;

  const [lo, hi] = range;

  if (pickAt(lo, c, h, method) === pickAt(hi, c, h, method)) return null;

  return bisectEdge(lo, hi, l => pickAt(l, c, h, method) === 'white');
}

/*
 * Forward mapping for @transience/color-picker's OKLCHPanel, which is not exported.
 * The panel is P3 HSV (x = saturation, y = 1 - value) at a fixed HSV hue, so an OKLCH
 * point needs this conversion to land under the panel's own thumb.
 */

/** WCAG and APCA flip edges per chroma row, from neutral up to the hue's P3 cusp. */
export function getDisagreementBand(h: number, rows = BAND_ROWS): DisagreementBand {
  // colorizr's P3 max chroma searches internally; the row scans repeat the same L values.
  const cache = new Map<number, number>();

  const maxChroma: MaxChroma = l => {
    let value = cache.get(l);

    if (value === undefined) {
      value = getMaxChroma(l, h);
      cache.set(l, value);
    }

    return value;
  };

  const cusp = getCuspChroma(h, maxChroma);
  const result: BandRow[] = [];

  for (let index = 0; index < rows; index++) {
    const c = (cusp * index) / (rows - 1);
    const range = getGamutRange(c, h, maxChroma);

    if (!range) continue;

    const [lo, hi] = range;
    const wcag = findFlip(c, h, 'wcag', range);
    const apca = findFlip(c, h, 'apca', range);
    // With no flip in range, the whole row holds one pick; it is in the band only when
    // WCAG already says black (start) or APCA still says white (end).
    const start = wcag ?? (pickAt(lo, c, h, 'wcag') === 'black' ? lo : null);
    const end = apca ?? (pickAt(hi, c, h, 'apca') === 'white' ? hi : null);

    result.push({
      apca,
      band: start !== null && end !== null && start < end ? [start, end] : null,
      c,
      wcag,
    });
  }

  return {
    cusp: findCusp(h, maxChroma),
    edges: {
      apca: findBoundaryFlip(h, 'apca', maxChroma),
      wcag: findBoundaryFlip(h, 'wcag', maxChroma),
    },
    rows: result,
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type Matrix = readonly (readonly number[])[];

const multiply = (m: Matrix, [x, y, z]: [number, number, number]): [number, number, number] => [
  m[0][0] * x + m[0][1] * y + m[0][2] * z,
  m[1][0] * x + m[1][1] * y + m[1][2] * z,
  m[2][0] * x + m[2][1] * y + m[2][2] * z,
];

/** OKLCH → P3 HSV, without sRGB clamping. */
function oklchToP3Hsv(l: number, c: number, h: number): HSV {
  const hRad = h * DEG2RAD;
  const lms = multiply(OKLAB_TO_CLMS, [l, c * Math.cos(hRad), c * Math.sin(hRad)]).map(
    value => value ** 3,
  ) as [number, number, number];
  const [r, g, b] = multiply(SRGB_TO_P3, multiply(LMS_TO_LRGB, lms)).map(value =>
    clamp(srgbGammaEncode(value), 0, 1),
  );

  return rgbToHsv(r, g, b);
}

function rgbToHsv(r: number, g: number, b: number): HSV {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }

    h *= 60;

    if (h < 0) h += 360;
  }

  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

/** OKLCH (l, c) at `hue` → the panel position in percent, as the panel places its thumb. */
export function lcToPointer(hue: number, l: number, c: number): { x: number; y: number } {
  const { s, v } = oklchToP3Hsv(l, c, hue);

  return {
    x: clamp(s * 100, 0, 100),
    y: clamp((1 - v) * 100, 0, 100),
  };
}
