import { objectEntries, round } from '@gilbarbara/helpers';
import * as Sentry from '@sentry/nextjs';
import {
  getScaleStepKeys,
  isHex,
  type ScaleChromaPeak,
  type ScaleMode,
  type ScaleRange,
  type ScaleVariant,
} from 'colorizr';

import { COLOR_GROUPS, DEFAULT_PALETTE_NAME, PALETTE_PATH_PREFIX } from '~/config/globals';
import {
  CHROMA_PEAK_MAX,
  CHROMA_PEAK_MIN,
  HUE_SHIFT_LIMIT,
  LIGHTNESS_CURVE_MAX,
  LIGHTNESS_CURVE_MIN,
  LIGHTNESS_RANGE_MAX,
  LIGHTNESS_RANGE_MIN,
  SATURATION_MAX,
  SATURATION_MIN,
  STEPS_MAX,
  STEPS_MIN,
} from '~/config/scale';
import { formatOklch, formatOklchUrl, isInRangeOklch, toOklch } from '~/utils/color';
import { getDefaultGlobalOptions } from '~/utils/generator';
import { isCurvePeak, isSameOptionValue } from '~/utils/scale-options';

import type {
  ColorEntry,
  ColorGroup,
  ColorOverrides,
  GeneratorState,
  GlobalScaleOptions,
  OklchString,
  ScaleOptions,
} from '~/types';

interface PaletteIdentity {
  /** undefined = keep existing, null = remove, string = set. */
  id?: string | null;
  /** undefined = keep existing, null = remove, string = set; DEFAULT_PALETTE_NAME is dropped like null. */
  name?: string | null;
}

export interface ParsedPalette {
  dropped: string[];
  state: GeneratorState;
}

// Option key mappings (short keys for URL)
const OPTION_KEYS = {
  chromaCurve: 'c',
  hueShift: 'h',
  lightnessCurve: 'f',
  lock: 'k',
  maxLightness: 'x',
  minLightness: 'n',
  mode: 'm',
  saturation: 's',
  saturationOverride: 'o',
  steps: 'i',
  variant: 'v',
} as const;

// Reverse mapping for parsing
const OPTION_KEYS_REVERSE = Object.fromEntries(
  objectEntries(OPTION_KEYS).map(([k, v]) => [v, k]),
) as Record<string, keyof typeof OPTION_KEYS>;

// The per-color segment grammar is a strict subset: saturation is palette-wide (gated by
// saturationOverride, which only exists on GlobalScaleOptions), so a color may not carry either.
// See `ColorOverrides`.
const COLOR_OPTION_KEYS = Object.fromEntries(
  objectEntries(OPTION_KEYS).filter(
    ([key]) => key !== 'saturation' && key !== 'saturationOverride',
  ),
) as Omit<typeof OPTION_KEYS, 'saturation' | 'saturationOverride'>;

// Mode short values — single source of truth; MODE_LONG and VALID_MODES derive from this.
const MODE_SHORT = { light: 'l', dark: 'd', reversed: 'r' } as const satisfies Record<
  ScaleMode,
  string
>;
const MODE_LONG: Record<string, ScaleMode> = Object.fromEntries(
  objectEntries(MODE_SHORT).map(([k, v]) => [v, k]),
);

// Reverse map (URL code → group) for parsing; serialization reads
// COLOR_GROUPS[group].code directly. Group is organizational metadata, NOT a scale
// option — never routed through OPTION_KEYS or fed to scale(). Bad codes drop to
// ungrouped, like other invalid URL values.
const GROUP_LONG: Record<string, ColorGroup> = Object.fromEntries(
  objectEntries(COLOR_GROUPS).map(([group, { code }]) => [code, group]),
);

// Whitelisted enum values for narrowing — bad values from URLs/query strings
// silently dropped to prevent type-violating runtime state. `satisfies` makes
// colorizr type drift a compile error.
const VALID_MODES = Object.keys(MODE_SHORT) as ScaleMode[];
const VALID_VARIANTS = [
  'deep',
  'neutral',
  'pastel',
  'subtle',
  'vibrant',
] as const satisfies readonly ScaleVariant[];

// Curve options accept three shapes in both query and path forms:
//   scalar  NUMBER          (legacy / simple)
//   range   NUMBER_NUMBER   (low_high)
//   peak    pNUMBER_NUMBER  (amount_peak — chromaCurve only)
// `_` only ever appears inside a value, so the `,`/`:`/`-` option delimiters are unaffected.
type CurveOptionKey = 'chromaCurve' | 'hueShift' | 'lightnessCurve';

/**
 * Convert OKLCH color value to URL format: '64_0.142_329' (L%_C_H, rounded)
 */
function colorValueToUrl(value: string): string {
  try {
    return formatOklchUrl(value);
  } catch (error_) {
    Sentry.captureException(error_, {
      tags: { source: 'url-parse', call: 'colorValueToUrl' },
      extra: { value },
    });

    return value;
  }
}

/**
 * Decode a URL-embedded color name. Inverse of `encodeName`.
 * Backward compatible with legacy URLs that only encoded space as `+`.
 */
function decodeName(encoded: string): string {
  return decodeURIComponent(encoded.replaceAll('+', '%20'));
}

/**
 * Encode a color name for URL embedding.
 * Uses standard URL encoding; preserves legacy space-as-`+` format.
 */
function encodeName(name: string): string {
  return encodeURIComponent(name).replaceAll('%20', '+');
}

/**
 * Parse a single color segment (Name[-Value[-Options]]). Returns either a parsed
 * color, a dropped name (segment was invalid), or both undefined for empty input.
 */
function parseColorSegment(
  segment: string,
  index: number,
): { color?: ColorEntry; dropped?: string } {
  const parts = segment.split('-');

  // Trim ALL trailing empty chunks (lenient — 'Primary-FF0044-', 'Primary---ff0044--')
  while (parts.at(-1) === '') parts.pop();

  if (parts.length < 2) {
    return { dropped: parts[0] || '(unnamed)' };
  }

  // Options chunk: leftmost ':'-bearing chunk starting at index 2 (leaves room
  // for name+value). Rejoin with '-' to support future dashed override values
  // (e.g. 'v:high-contrast'). parseOptions itself requires ':' per option.
  let optionsString: string | undefined;
  let optionsIndex = -1;

  for (let index_ = 2; index_ < parts.length; index_++) {
    if (parts[index_].includes(':')) {
      optionsIndex = index_;
      break;
    }
  }

  if (optionsIndex >= 2) {
    optionsString = parts.slice(optionsIndex).join('-');
    parts.length = optionsIndex;
  }

  const valueString = parts.pop()!;
  const name = decodeName(parts.join('-')).trim();

  if (!name) {
    return { dropped: '(unnamed)' };
  }

  const value = urlToColorValue(valueString);

  if (!value) {
    return { dropped: name };
  }

  const color: ColorEntry = { id: colorId(segment, index), name, value };

  if (optionsString !== undefined) {
    const group = parseGroup(optionsString);

    if (group) {
      color.group = group;
    }

    // Empty stays undefined, never `{}` — `setColorOverride` normalizes the same way, and the UI
    // reads `overrides` as a boolean ("this color is customized"), so a truthy empty object shows
    // the ColorActions badge and enables its Reset for a color with nothing overridden. Chunks that
    // parse to nothing (a group-only `g:b`, an unknown key, an out-of-range value) land here.
    const overrides = parseOptions(optionsString);

    if (Object.keys(overrides).length > 0) {
      color.overrides = overrides;
    }
  }

  return { color };
}

/**
 * Parse global options from query params
 */
function parseGlobalOptions(searchParams: URLSearchParams): Partial<GlobalScaleOptions> {
  const result: Partial<GlobalScaleOptions> = {};

  for (const [shortKey, value] of searchParams.entries()) {
    const fullKey = OPTION_KEYS_REVERSE[shortKey];

    if (!fullKey) {
      continue;
    }

    if (isCurveOptionKey(fullKey)) {
      Object.assign(result, curveOptionEntry(fullKey, value));

      continue;
    }

    // Parse value based on option type
    switch (fullKey) {
      case 'mode': {
        const mode = parseMode(value);

        if (mode) result.mode = mode;

        break;
      }
      case 'saturationOverride': {
        // o=1 means true, missing means false (default)
        result.saturationOverride = value === '1';

        break;
      }
      case 'variant': {
        const variant = parseVariant(value);

        if (variant) result.variant = variant;

        break;
      }
      case 'lock': {
        const lock = parseLock(value);

        if (lock !== undefined) result.lock = lock;

        break;
      }
      default: {
        const numberValue = parseScalarOptionValue(fullKey, value);

        if (numberValue !== undefined) {
          (result as Record<string, number>)[fullKey] = numberValue;
        }
      }
    }
  }

  return result;
}

/**
 * Extract the color group from an options chunk (e.g. 'x:0.95,g:b' → 'brand').
 * Group is metadata, not a scale option — parsed here and kept out of parseOptions.
 * Unknown/missing codes yield undefined (ungrouped).
 */
function parseGroup(optString: string): ColorGroup | undefined {
  for (const part of optString.split(',')) {
    const [key, value] = part.split(':');

    if (key === 'g') {
      return value && Object.hasOwn(GROUP_LONG, value) ? GROUP_LONG[value] : undefined;
    }
  }

  return undefined;
}

function parseLock(value?: string): number | undefined {
  if (!value) return undefined;

  const numberValue = Number.parseInt(value, 10);

  if (Number.isNaN(numberValue)) {
    return undefined;
  }

  return numberValue;
}

function parseMode(raw: string): ScaleMode | undefined {
  const normalized = MODE_LONG[raw] ?? raw;

  return (VALID_MODES as readonly string[]).includes(normalized)
    ? (normalized as ScaleMode)
    : undefined;
}

/**
 * Parse OKLCH URL value: '64_0.142_329' or legacy '0.64_0.142_329'
 */
function parseOklchUrlValue(urlValue: string): OklchString | null {
  const parts = urlValue.split('_');

  if (parts.length !== 3) {
    return null;
  }

  const [rawL, c, h] = parts.map(Number.parseFloat);

  if (Number.isNaN(rawL) || Number.isNaN(c) || Number.isNaN(h)) {
    return null;
  }

  // Legacy URLs used 0-1 for lightness, new URLs use 0-100
  const l = rawL <= 1 ? rawL : rawL / 100;
  const values = { l, c, h };

  if (!isInRangeOklch(values) || !Number.isFinite(h)) {
    return null;
  }

  // isInRangeOklch has no upper chroma bound and ignores hue; route through toOklch (parseCSS-
  // backed) so out-of-gamut chroma / out-of-range hue are clamped or rejected here instead of throwing
  // later inside colorizr's scale().
  try {
    return toOklch(formatOklch(values));
  } catch {
    return null;
  }
}

/**
 * Parse options from URL format
 * Input: 'x:0.95,m:d'
 */
function parseOptions(optString: string): ColorOverrides {
  const result: ColorOverrides = {};

  if (!optString) {
    return result;
  }

  for (const part of optString.split(',')) {
    const [key, value] = part.split(':');

    if (!key || !value) {
      continue;
    }

    const fullKey = OPTION_KEYS_REVERSE[key];

    // Unknown key, or one the per-color grammar does not carry (`s:` / `o:`).
    if (!fullKey || !(fullKey in COLOR_OPTION_KEYS)) {
      continue;
    }

    Object.assign(
      result,
      isCurveOptionKey(fullKey)
        ? curveOptionEntry(fullKey, value)
        : scalarOptionEntry(fullKey, value),
    );
  }

  return result;
}

function parseVariant(raw: string): ScaleVariant | undefined {
  return (VALID_VARIANTS as readonly string[]).includes(raw) ? (raw as ScaleVariant) : undefined;
}

const CURVE_OPTION_KEYS_SET = new Set<keyof typeof OPTION_KEYS>([
  'chromaCurve',
  'hueShift',
  'lightnessCurve',
]);

/** Parsed curve option as a fragment to merge, or `{}` when the value is invalid. */
function curveOptionEntry(key: CurveOptionKey, raw: string): Record<string, unknown> {
  const parsed = parseCurveOptionValue(key, raw);

  return parsed === undefined ? {} : { [key]: parsed };
}

function inRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

function isCurveOptionKey(key: keyof typeof OPTION_KEYS): key is CurveOptionKey {
  return CURVE_OPTION_KEYS_SET.has(key);
}

/** Validate a scalar/range endpoint for a curve key. */
function isValidCurveValue(key: CurveOptionKey, value: number): boolean {
  if (key === 'chromaCurve') {
    return inRange(value, 0, 1);
  }

  if (key === 'hueShift') {
    return inRange(value, -HUE_SHIFT_LIMIT, HUE_SHIFT_LIMIT);
  }

  // lightnessCurve
  return inRange(value, LIGHTNESS_CURVE_MIN, LIGHTNESS_CURVE_MAX);
}

/** Per-key valid range for the non-curve numeric options (matches each slider's bounds). */
const SCALAR_RANGES: Partial<Record<keyof typeof OPTION_KEYS, [number, number]>> = {
  maxLightness: [LIGHTNESS_RANGE_MIN, LIGHTNESS_RANGE_MAX],
  minLightness: [LIGHTNESS_RANGE_MIN, LIGHTNESS_RANGE_MAX],
  saturation: [SATURATION_MIN, SATURATION_MAX],
  steps: [STEPS_MIN, STEPS_MAX],
};

/**
 * Parse a curve option value. Returns undefined to drop silently — scale()
 * throws on out-of-range input, so anything invalid must never reach the store.
 */
function parseCurveOptionValue(
  key: CurveOptionKey,
  raw: string,
): number | ScaleRange | ScaleChromaPeak | undefined {
  // peak form: pAMOUNT_PEAK (chromaCurve only)
  if (raw.startsWith('p')) {
    if (key !== 'chromaCurve') {
      return undefined;
    }

    const parts = raw.slice(1).split('_');

    if (parts.length !== 2) {
      return undefined;
    }

    const [amount, peak] = parts.map(Number.parseFloat);

    if (!inRange(amount, 0, 1) || !inRange(peak, CHROMA_PEAK_MIN, CHROMA_PEAK_MAX)) {
      return undefined;
    }

    return { amount, peak };
  }

  // range form: LOW_HIGH
  if (raw.includes('_')) {
    const parts = raw.split('_');

    if (parts.length !== 2) {
      return undefined;
    }

    const [low, high] = parts.map(Number.parseFloat);

    if (!isValidCurveValue(key, low) || !isValidCurveValue(key, high)) {
      return undefined;
    }

    return { high, low };
  }

  // scalar form (Simple mode) — kept as-is for all curves; hueShift scalar x
  // means symmetric drift (≡ { low: -x, high: x }), resolved at render time.
  const value = Number.parseFloat(raw);

  if (!isValidCurveValue(key, value)) {
    return undefined;
  }

  return value;
}

/**
 * Parse a non-curve numeric option, dropping (→ undefined) anything out of range so it never
 * reaches scale() or the URL. `steps` is rounded to an integer first (colorizr rounds too).
 */
function parseScalarOptionValue(key: keyof typeof OPTION_KEYS, raw: string): number | undefined {
  const parsed = Number.parseFloat(raw);
  const value = key === 'steps' ? Math.round(parsed) : parsed;
  const range = SCALAR_RANGES[key];

  if (range) {
    return inRange(value, range[0], range[1]) ? value : undefined;
  }

  return Number.isNaN(value) ? undefined : value;
}

/**
 * Enforce minLightness < maxLightness for an effective options object. `base` is a known-valid
 * fallback (defaults for the global object; the sanitized global for a per-color override). On
 * violation, drop BOTH lightness keys so they revert to `base` (always valid) — keeping overrides
 * minimal. `delete` of an absent key is a no-op, so only user-supplied bounds are removed.
 */
function reconcileLightnessBounds<T extends { maxLightness?: number; minLightness?: number }>(
  overrides: T,
  base: { maxLightness: number; minLightness: number },
): T {
  const minL = overrides.minLightness ?? base.minLightness;
  const maxL = overrides.maxLightness ?? base.maxLightness;

  if (minL < maxL) {
    return overrides;
  }

  const next = { ...overrides };

  delete next.minLightness;
  delete next.maxLightness;

  return next;
}

/** Drop a `lock` that isn't one of the valid step keys for `steps` (colorizr ignores it anyway). */
function reconcileLock<T extends { lock?: number }>(options: T, steps: number): T {
  if (options.lock === undefined || getScaleStepKeys(steps).includes(options.lock)) {
    return options;
  }

  const next = { ...options };

  delete next.lock;

  return next;
}

/**
 * Drop an `s=` that arrived without `o=1`. `saturation` is only live while the override is on, and
 * `serializeGlobalOptions` refuses to write it otherwise — so accepting one here would leave the
 * store holding a value the URL cannot express. Pre-existing URLs carry these: the old code mirrored
 * the first color's chroma into `saturation` and leaked it once a remove/reorder re-based the
 * default. Runs on the merged object, not per key — `s` can precede `o` in the query string.
 */
function reconcileSaturation(
  options: GlobalScaleOptions,
  defaults: GlobalScaleOptions,
): GlobalScaleOptions {
  if (options.saturationOverride || options.saturation === defaults.saturation) {
    return options;
  }

  return { ...options, saturation: defaults.saturation };
}

/** Non-curve per-color option (mode/variant/lock or a plain number) as a fragment to merge. */
function scalarOptionEntry(
  key: Exclude<keyof typeof OPTION_KEYS, CurveOptionKey>,
  value: string,
): Partial<ScaleOptions> {
  switch (key) {
    case 'mode': {
      const mode = parseMode(value);

      return mode ? { mode } : {};
    }
    case 'variant': {
      const variant = parseVariant(value);

      return variant ? { variant } : {};
    }
    case 'lock': {
      return { lock: parseLock(value) };
    }
    default: {
      const numberValue = parseScalarOptionValue(key, value);

      return numberValue === undefined ? {} : { [key]: numberValue };
    }
  }
}

/** Serialize a curve option value to URL form, rounding to drop slider float junk. */
function serializeCurveOptionValue(value: number | ScaleRange | ScaleChromaPeak): string {
  if (typeof value === 'number') {
    return String(round(value, 4));
  }

  if (isCurvePeak(value)) {
    return `p${round(value.amount, 4)}_${round(value.peak ?? 0.5, 4)}`;
  }

  return `${round(value.low, 4)}_${round(value.high, 4)}`;
}

/**
 * Serialize global options to query string (only non-default values)
 * Returns: 'f=1.8&s=15' or empty string
 */
function serializeGlobalOptions(options: GlobalScaleOptions, defaults: GlobalScaleOptions): string {
  const params = new URLSearchParams();

  for (const [key, shortKey] of objectEntries(OPTION_KEYS)) {
    // Mirror getEffectiveOptions: `saturation` is only read when overridden. Its default is
    // derived from colors[0], so without this gate any edit that changes which color is first
    // (remove, reorder) moves the default out from under the held value and leaks an inert `s=`.
    if (key === 'saturation' && !options.saturationOverride) {
      continue;
    }

    const value = options[key as keyof GlobalScaleOptions];
    const defaultValue = defaults[key];

    if (value !== undefined && !isSameOptionValue(key, value, defaultValue)) {
      let serialized: string;

      if (isCurveOptionKey(key)) {
        serialized = serializeCurveOptionValue(value as number | ScaleRange | ScaleChromaPeak);
      } else if (key === 'mode' && typeof value === 'string') {
        serialized = MODE_SHORT[value as ScaleMode] ?? value;
      } else if (key === 'saturationOverride') {
        // Only serialize when true (default is false)
        serialized = value ? '1' : '0';
      } else {
        serialized = String(value);
      }

      params.set(shortKey, serialized);
    }
  }

  return params.toString();
}

/**
 * Serialize options to URL format (only non-default values)
 * Returns: 'x:0.95,m:d' or empty string
 */
function serializeOptions(
  options: ColorOverrides | undefined,
  defaults: GlobalScaleOptions,
): string {
  if (!options) {
    return '';
  }

  const parts: string[] = [];

  for (const [key, shortKey] of objectEntries(COLOR_OPTION_KEYS)) {
    const value = options[key as keyof ColorOverrides];
    const defaultValue = defaults[key];

    if (value !== undefined && !isSameOptionValue(key, value, defaultValue)) {
      let serialized: string;

      if (isCurveOptionKey(key)) {
        serialized = serializeCurveOptionValue(value as number | ScaleRange | ScaleChromaPeak);
      } else if (key === 'mode' && typeof value === 'string') {
        serialized = MODE_SHORT[value as ScaleMode] ?? value;
      } else {
        serialized = String(value);
      }

      parts.push(`${shortKey}:${serialized}`);
    }
  }

  return parts.join(',');
}

/**
 * Parse URL color value to usable color string
 * - 'FF0044' → '#FF0044'
 * - '64_0.142_329' → 'oklch(64% 0.142 329)'
 * - '0.64_0.142_329' → 'oklch(64% 0.142 329)' (legacy support)
 */
function urlToColorValue(urlValue: string): OklchString | null {
  if (urlValue.includes('_')) {
    return parseOklchUrlValue(urlValue);
  }

  // Treat as hex — convert to OKLCH for consistent storage
  const hex = `#${urlValue}`;

  if (!isHex(hex)) {
    return null;
  }

  try {
    return toOklch(hex);
  } catch (error_) {
    Sentry.captureException(error_, {
      tags: { source: 'url-parse', call: 'urlToColorValue.hex' },
      extra: { urlValue },
    });

    return null;
  }
}

/**
 * Reconstruct a `/p/{slug}?{query}` URL from Next.js route params,
 * flattening array-valued search params back into repeated keys.
 */
export function buildUrl(slug: string[], searchParams: Record<string, string | string[]>): string {
  const path = `${PALETTE_PATH_PREFIX}/${slug.join('/')}`;
  const flatParams = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const v of value) flatParams.append(key, v);
    } else {
      flatParams.set(key, value);
    }
  }

  const query = flatParams.toString();

  return query ? `${path}?${query}` : path;
}

/**
 * Round-trip a palette URL through parse + serialize so the result is in the
 * current canonical form (OKLCH values, latest precision).
 *
 * - Returns the input unchanged if parsing fails (empty/malformed URL).
 * - Returns the input unchanged if any color segment is dropped — never write
 *   back a "canonicalised" URL that silently lost a color.
 * - Preserves `id` query param if present.
 */
export function canonicalizeUrl(url: string): string {
  const [, queryPart] = url.split('?');
  const params = new URLSearchParams(queryPart ?? '');
  const id = params.get('id');

  const parsed = parsePaletteFromUrl(url);

  if (!parsed || parsed.dropped.length > 0) {
    return url;
  }

  return decoratePaletteUrl(serializePaletteToUrl(parsed.state), { id });
}

/**
 * Stable ID derived from segment + index. Keeps SSR/CSR markup identical:
 * `uuid()` would produce different IDs on each call, breaking React hydration
 * when the server-rendered tree and the client-parsed tree diverge.
 */
export function colorId(segment: string, index: number): string {
  let hash = 0;

  const input = `${index}:${segment}`;

  for (let index_ = 0; index_ < input.length; index_++) {
    hash = (Math.imul(hash, 31) + (input.codePointAt(index_) ?? 0)) | 0;
  }

  return `c-${(hash >>> 0).toString(36)}`;
}

/**
 * Decorate a structural palette URL with identity (`name` + `id`). Canonical
 * order: name before id, id terminal. Tri-state per field — `undefined` keeps the
 * current param, `null` removes it, a string sets it. Single source for the
 * ordering + default-name-omission rule that the rest of the app composes on.
 */
export function decoratePaletteUrl(url: string, identity: PaletteIdentity): string {
  const [path, queryString] = url.split('?');
  const params = new URLSearchParams(queryString ?? '');

  const name = identity.name === undefined ? params.get('name') : identity.name;
  const id = identity.id === undefined ? params.get('id') : identity.id;

  // Drop both, then re-append name-then-id so the id stays terminal.
  params.delete('name');
  params.delete('id');

  if (name && name !== DEFAULT_PALETTE_NAME) {
    params.append('name', name);
  }

  if (id) {
    params.append('id', id);
  }

  const newQuery = params.toString();

  return newQuery ? `${path}?${newQuery}` : path;
}

/**
 * Extract palette ID from URL query string
 * Returns null if no ID present
 */
export function getPaletteIdFromUrl(search: string): string | null {
  const params = new URLSearchParams(search);

  return params.get('id');
}

/**
 * Parse palette from URL string
 * Accepts full URL, path, or just the palette segments
 * Examples:
 *   '/p/Primary-FF0044/Secondary-698CE0?f=1.8'
 *   'Primary-FF0044/Secondary-698CE0?f=1.8'
 *
 * Bad color segments are skipped and reported via `dropped` (named slots that failed to parse).
 * Returns null only if the URL is empty, structurally malformed, or every color fails to parse.
 */
export function parsePaletteFromUrl(url: string): ParsedPalette | null {
  if (!url) {
    return null;
  }

  // Split path and query string
  const [pathPart, queryPart] = url.split('?');

  // Strip the palette route prefix if present
  const prefix = `${PALETTE_PATH_PREFIX}/`;
  const segmentPath = pathPart.startsWith(prefix) ? pathPart.slice(prefix.length) : pathPart;
  const pathSegments = segmentPath.split('/').filter(Boolean);

  if (pathSegments.length === 0) {
    return null;
  }

  const searchParams = new URLSearchParams(queryPart ?? '');

  const colors: ColorEntry[] = [];
  const dropped: string[] = [];

  for (const [index, pathSegment] of pathSegments.entries()) {
    const { color, dropped: droppedName } = parseColorSegment(pathSegment, index);

    if (color) colors.push(color);
    if (droppedName !== undefined) dropped.push(droppedName);
  }

  if (colors.length === 0) {
    return null;
  }

  // Compute defaults based on first color (for correct saturation)
  const defaults = getDefaultGlobalOptions(colors[0].value);

  // Parse global options, then sanitize the cross-field invariants that per-key range checks
  // can't catch (minLightness < maxLightness, lock ∈ valid step keys, saturation without its
  // override) so scale() never throws and the store never holds what the URL can't express.
  const globalOverrides = reconcileLightnessBounds(parseGlobalOptions(searchParams), defaults);
  let globalOptions = { ...defaults, ...globalOverrides };

  globalOptions = reconcileLock(globalOptions, globalOptions.steps);
  globalOptions = reconcileSaturation(globalOptions, defaults);

  for (const color of colors) {
    if (!color.overrides) {
      continue;
    }

    const reconciled = reconcileLightnessBounds(color.overrides, globalOptions);
    const locked = reconcileLock(reconciled, reconciled.steps ?? globalOptions.steps);

    // Both reconcilers drop keys, so a color that arrived with overrides can end up with none —
    // back to undefined rather than `{}` (see parseColorSegment).
    color.overrides = Object.keys(locked).length > 0 ? locked : undefined;
  }

  return {
    state: {
      colors,
      globalOptions,
      name: searchParams.get('name') || DEFAULT_PALETTE_NAME,
    },
    dropped,
  };
}

/**
 * Serialize palette state to URL path + query
 * Format: /p/Name-Value-Opts/Name-Value-Opts?globalOpts
 *
 * Examples:
 *   /p/Primary-FF0044/Secondary-698CE0
 *   /p/Primary-0.64_0.142_329
 *   /p/Primary-FF0044-x:0.95,m:d/Secondary-698CE0
 *   /p/Primary-FF0044?f=1.8&s=15
 */
export function serializePaletteToUrl(state: GeneratorState): string {
  // Compute defaults based on first color (for correct saturation comparison)
  const defaults = getDefaultGlobalOptions(state.colors[0].value);

  const colorParts = state.colors.map(color => {
    const encodedName = encodeName(color.name);
    let part = `${encodedName}-${colorValueToUrl(color.value)}`;

    // serializeOptions is group-unaware (iterates OPTION_KEYS only); append the
    // group metadata to the same chunk here so it rides in the color segment.
    const options = serializeOptions(color.overrides, state.globalOptions);
    const group = color.group ? `g:${COLOR_GROUPS[color.group].code}` : '';
    const optionsChunk = [options, group].filter(Boolean).join(',');

    if (optionsChunk) {
      part += `-${optionsChunk}`;
    }

    return part;
  });

  const path = `${PALETTE_PATH_PREFIX}/${colorParts.join('/')}`;
  const query = serializeGlobalOptions(state.globalOptions, defaults);
  const base = query ? `${path}?${query}` : path;

  // Decorate with the palette name (omitted when default) via the single-source
  // helper; no `id` exists yet, so it is left untouched.
  return decoratePaletteUrl(base, { name: state.name ?? null });
}

/**
 * Strip both the palette `id` and `name` from a URL, leaving the structural form
 * (colors + global options). This is the shape persisted in Firestore — identity
 * lives in the record fields and is decorated back onto the URL at read-time.
 */
export function stripPaletteIdentity(url: string): string {
  return decoratePaletteUrl(url, { id: null, name: null });
}
