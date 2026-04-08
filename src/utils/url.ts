import type { Params } from 'react-router';
import { objectEntries, uuid } from '@gilbarbara/helpers';
import { formatCSS, isHex, isValidColor, parseCSS } from 'colorizr';

import { getDefaultGlobalOptions } from '~/utils/palette';

import type { ColorEntry, GlobalScaleOptions, PaletteState, ScaleOptions } from '~/types';
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

// Mode short values
const MODE_SHORT: Record<string, string> = {
  dark: 'd',
  light: 'l',
};

const MODE_LONG: Record<string, string> = {
  d: 'dark',
  l: 'light',
};

/**
 * Convert color value to URL format
 * - Hex: 'FF0044' (without #)
 * - OKLch: '64_0.142_329' (L%_C_H with underscores, rounded)
 */
function colorValueToUrl(value: string): string {
  // If it's a hex color, strip #
  if (isHex(value)) {
    return value.replace('#', '').toUpperCase();
  }

  // If it's oklch, convert to L_C_H format (L as percentage)
  if (isValidColor(value, 'oklch')) {
    const oklch = parseCSS(value, 'oklch');

    return `${parseFloat((oklch.l * 100).toFixed(3))}_${parseFloat(oklch.c.toFixed(5))}_${parseFloat(oklch.h.toFixed(3))}`;
  }

  // Try to convert to hex
  try {
    return formatCSS(parseCSS(value, 'oklch'), { format: 'hex' }).replace('#', '').toUpperCase();
  } catch {
    return value;
  }
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
        result.mode = (MODE_LONG[value] ?? value) as 'dark' | 'light';

        break;
      }
      case 'saturationOverride': {
        // o=1 means true, missing means false (default)
        result.saturationOverride = value === '1';

        break;
      }
      case 'variant': {
        (result as Record<string, string>)[fullKey] = value;

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
    if (fullKey === 'mode') {
      result.mode = (MODE_LONG[value] ?? value) as 'dark' | 'light';
    } else if (fullKey === 'lock' || fullKey === 'variant') {
      result[fullKey] = value as never;
    } else {
      const numberValue = Number.parseFloat(value);

      if (!Number.isNaN(numberValue)) {
        (result as Record<string, number>)[fullKey] = numberValue;
      }
    }
  }

  return result;
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
        serialized = MODE_SHORT[value] ?? value;
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
        key === 'mode' && typeof value === 'string' ? (MODE_SHORT[value] ?? value) : String(value);

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
function urlToColorValue(urlValue: string): string | null {
  // Check if it's oklch format (contains underscores)
  if (urlValue.includes('_')) {
    const parts = urlValue.split('_');

    if (parts.length === 3) {
      const [rawL, c, h] = parts.map(Number.parseFloat);

      if (!Number.isNaN(rawL) && !Number.isNaN(c) && !Number.isNaN(h)) {
        // Legacy URLs used 0-1 for lightness, new URLs use 0-100
        const l = rawL <= 1 ? rawL : rawL / 100;

        return formatCSS({ l, c, h }, { format: 'oklch' });
      }
    }

    return null;
  }

  // Treat as hex — convert to OKLCH for consistent storage
  const hex = `#${urlValue}`;

  if (isHex(hex)) {
    return formatCSS(parseCSS(hex, 'oklch'), { format: 'oklch' });
  }

  return null;
}

/**
 * Convert color string to URL path (for single-color routes)
 * Examples:
 *   '#FF0044' → '/hex/FF0044'
 *   'oklch(0.7 0.2 120)' → '/oklch/0.7/0.2/120'
 */
export function colorToPath(color: string): string {
  // Handle hex colors
  if (isHex(color)) {
    const hex = color.replace('#', '').toUpperCase();

    return `/hex/${hex}`;
  }

  // Handle oklch colors
  if (isValidColor(color, 'oklch')) {
    const oklch = parseCSS(color, 'oklch');

    return `/oklch/${parseFloat((oklch.l * 100).toFixed(3))}/${parseFloat(oklch.c.toFixed(5))}/${parseFloat(oklch.h.toFixed(3))}`;
  }

  // Try to convert to hex for other formats
  try {
    const hex = formatCSS(parseCSS(color, 'oklch'), { format: 'hex' }).replace('#', '');

    return `/hex/${hex}`;
  } catch {
    return '/';
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
 * Parse URL params to color string (for single-color routes)
 * Examples:
 *   { color: 'FF0044' } → '#FF0044'
 *   { l: '0.7', c: '0.2', h: '120' } → 'oklch(0.7 0.2 120)'
 */
export function parseColorFromParams(params: Params): string | null {
  const { c, color, h, l } = params;

  // Hex format: /hex/:color
  if (color) {
    const hex = color.startsWith('#') ? color : `#${color}`;

    if (isHex(hex)) {
      return hex;
    }

    return null;
  }

  // OKLch format: /oklch/:l/:c/:h
  if (l !== undefined && c !== undefined && h !== undefined) {
    const lightness = Number.parseFloat(l);
    const chroma = Number.parseFloat(c);
    const hue = Number.parseFloat(h);

    if (Number.isNaN(lightness) || Number.isNaN(chroma) || Number.isNaN(hue)) {
      return null;
    }

    return formatCSS(
      { l: lightness <= 1 ? lightness : lightness / 100, c: chroma, h: hue },
      { format: 'oklch' },
    );
  }

  return null;
}

/**
 * Parse palette from URL string
 * Accepts full URL, path, or just the palette segments
 * Examples:
 *   '/p/Primary-FF0044/Secondary-698CE0?f=1.8'
 *   'Primary-FF0044/Secondary-698CE0?f=1.8'
 * Returns null if parsing fails
 */
export function parsePaletteFromUrl(url: string): PaletteState | null {
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

  for (const segment of pathSegments) {
    // Split by - but handle name, value, and optional options
    const parts = segment.split('-');

    if (parts.length < 2) {
      return null;
    }

    // Decode name (replace + with space)
    const name = parts[0].replaceAll('+', ' ');
    const valueString = parts[1];
    const value = urlToColorValue(valueString);

    if (!value) {
      return null;
    }

    const color: ColorEntry = { id: uuid(), name, value };

    // Parse per-color options if present (3rd part)
    if (parts.length >= 3) {
      color.overrides = parseOptions(parts[2]);
    }

    colors.push(color);
  }

  if (colors.length === 0) {
    return null;
  }

  // Compute defaults based on first color (for correct saturation)
  const defaults = getDefaultGlobalOptions(colors[0].value);

  // Parse global options from query params
  const globalOverrides = parseGlobalOptions(searchParams);

  return {
    colors,
    globalOptions: {
      ...defaults,
      ...globalOverrides,
    },
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
    // Encode name to handle spaces (replace spaces with +)
    const encodedName = color.name.replaceAll(' ', '+');
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
