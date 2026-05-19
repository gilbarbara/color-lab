import { objectEntries, uuid } from '@gilbarbara/helpers';
import * as Sentry from '@sentry/react';
import { formatCSS, isHex, parseCSS, type ScaleVariant } from 'colorizr';

import { isInRangeOklch, toOklch } from '~/utils/color';
import { getDefaultGlobalOptions } from '~/utils/palette';

import type {
  ColorEntry,
  GlobalScaleOptions,
  OklchString,
  PaletteState,
  ScaleOptions,
} from '~/types';

export interface ParsedPalette {
  dropped: string[];
  state: PaletteState;
}

// Option key mappings (short keys for URL)
const OPTION_KEYS = {
  chromaCurve: 'c',
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

// Local alias — colorizr exports ScaleVariant but not ScaleMode.
type ScaleMode = 'light' | 'dark';

// Mode short values — single source of truth; MODE_LONG and VALID_MODES derive from this.
const MODE_SHORT = { light: 'l', dark: 'd' } as const satisfies Record<ScaleMode, string>;
const MODE_LONG: Record<string, ScaleMode> = Object.fromEntries(
  objectEntries(MODE_SHORT).map(([k, v]) => [v, k]),
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

/**
 * Convert OKLCH color value to URL format: '64_0.142_329' (L%_C_H, rounded)
 */
function colorValueToUrl(value: string): string {
  try {
    const oklch = parseCSS(value, 'oklch');

    return `${parseFloat((oklch.l * 100).toFixed(3))}_${parseFloat(oklch.c.toFixed(5))}_${parseFloat(oklch.h.toFixed(3))}`;
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
function parseColorSegment(segment: string): { color?: ColorEntry; dropped?: string } {
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

  for (let index = 2; index < parts.length; index++) {
    if (parts[index].includes(':')) {
      optionsIndex = index;
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

  const color: ColorEntry = { id: uuid(), name, value };

  if (optionsString !== undefined) {
    color.overrides = parseOptions(optionsString);
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
      default: {
        const numberValue = Number.parseFloat(value);

        if (!Number.isNaN(numberValue)) {
          (result as Record<string, number>)[fullKey] = numberValue;
        }
      }
    }
  }

  return result;
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

  // Reject out-of-range OKLCH (colorizr accepts silently then throws in getP3MaxChroma)
  if (!isInRangeOklch({ l, c, h }) || !Number.isFinite(h)) {
    return null;
  }

  try {
    return formatCSS({ l, c, h }, { format: 'oklch' }) as OklchString;
  } catch (error_) {
    Sentry.captureException(error_, {
      tags: { source: 'url-parse', call: 'urlToColorValue.oklch' },
      extra: { urlValue },
    });

    return null;
  }
}

/**
 * Parse options from URL format
 * Input: 'x:0.95,m:d'
 */
function parseOptions(optString: string): Partial<ScaleOptions> {
  const result: Partial<ScaleOptions> = {};

  if (!optString) {
    return result;
  }

  for (const part of optString.split(',')) {
    const [key, value] = part.split(':');

    if (!key || !value) {
      continue;
    }

    const fullKey = OPTION_KEYS_REVERSE[key];

    if (!fullKey) {
      continue;
    }

    // Parse value based on option type
    switch (fullKey) {
      case 'mode': {
        const mode = parseMode(value);

        if (mode) result.mode = mode;

        break;
      }
      case 'variant': {
        const variant = parseVariant(value);

        if (variant) result.variant = variant;

        break;
      }
      case 'lock': {
        result.lock = value as never;

        break;
      }
      default: {
        const numberValue = Number.parseFloat(value);

        if (!Number.isNaN(numberValue)) {
          (result as Record<string, number>)[fullKey] = numberValue;
        }
      }
    }
  }

  return result;
}

function parseVariant(raw: string): ScaleVariant | undefined {
  return (VALID_VARIANTS as readonly string[]).includes(raw) ? (raw as ScaleVariant) : undefined;
}

/**
 * Serialize global options to query string (only non-default values)
 * Returns: 'f=1.8&s=15' or empty string
 */
function serializeGlobalOptions(options: GlobalScaleOptions, defaults: GlobalScaleOptions): string {
  const params = new URLSearchParams();

  for (const [key, shortKey] of objectEntries(OPTION_KEYS)) {
    const value = options[key as keyof GlobalScaleOptions];
    const defaultValue = defaults[key];

    if (value !== undefined && value !== defaultValue) {
      let serialized: string;

      if (key === 'mode' && typeof value === 'string') {
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
  options: Partial<ScaleOptions> | undefined,
  defaults: GlobalScaleOptions,
): string {
  if (!options) {
    return '';
  }

  const parts: string[] = [];

  for (const [key, shortKey] of objectEntries(OPTION_KEYS)) {
    const value = options[key as keyof ScaleOptions];
    const defaultValue = defaults[key];

    if (value !== undefined && value !== defaultValue) {
      const serialized =
        key === 'mode' && typeof value === 'string'
          ? (MODE_SHORT[value as ScaleMode] ?? value)
          : String(value);

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

  // Strip /p/ prefix if present
  const segmentPath = pathPart.startsWith('/p/') ? pathPart.slice(3) : pathPart;
  const pathSegments = segmentPath.split('/').filter(Boolean);

  if (pathSegments.length === 0) {
    return null;
  }

  const searchParams = new URLSearchParams(queryPart ?? '');

  const colors: ColorEntry[] = [];
  const dropped: string[] = [];

  for (const segment of pathSegments) {
    const { color, dropped: droppedName } = parseColorSegment(segment);

    if (color) colors.push(color);
    if (droppedName !== undefined) dropped.push(droppedName);
  }

  if (colors.length === 0) {
    return null;
  }

  // Compute defaults based on first color (for correct saturation)
  const defaults = getDefaultGlobalOptions(colors[0].value);

  // Parse global options from query params
  const globalOverrides = parseGlobalOptions(searchParams);

  return {
    state: {
      colors,
      globalOptions: {
        ...defaults,
        ...globalOverrides,
      },
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
export function serializePaletteToUrl(state: PaletteState): string {
  // Compute defaults based on first color (for correct saturation comparison)
  const defaults = getDefaultGlobalOptions(state.colors[0].value);

  const colorParts = state.colors.map(color => {
    const encodedName = encodeName(color.name);
    let part = `${encodedName}-${colorValueToUrl(color.value)}`;

    const options = serializeOptions(color.overrides, state.globalOptions);

    if (options) {
      part += `-${options}`;
    }

    return part;
  });

  const path = `/p/${colorParts.join('/')}`;
  const query = serializeGlobalOptions(state.globalOptions, defaults);

  return query ? `${path}?${query}` : path;
}

/**
 * Add or remove palette ID from URL
 * ID is always placed at the end of query params
 */
export function updatePaletteIdInUrl(url: string, id: string | null): string {
  const [path, queryString] = url.split('?');
  const params = new URLSearchParams(queryString ?? '');

  // Remove existing id first to ensure it goes at the end
  params.delete('id');

  if (id) {
    params.append('id', id);
  }

  const newQuery = params.toString();

  return newQuery ? `${path}?${newQuery}` : path;
}
