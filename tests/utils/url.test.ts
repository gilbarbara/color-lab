import { formatCSS, parseCSS } from 'colorizr';

import { getDefaultGlobalOptions } from '~/utils/palette';
import {
  colorToPath,
  getPaletteIdFromUrl,
  parseColorFromParams,
  parsePaletteFromUrl,
  serializePaletteToUrl,
  updatePaletteIdInUrl,
} from '~/utils/url';

import type { ColorEntry, PaletteState } from '~/types';

function createColorEntry(
  name: string,
  value: string,
  overrides?: ColorEntry['overrides'],
): ColorEntry {
  return { id: crypto.randomUUID(), name, value, ...(overrides && { overrides }) };
}

/** Convert hex to OKLCH string (what parsePaletteFromUrl now returns for hex URLs) */
function hexToOklch(hex: string): string {
  return formatCSS(parseCSS(hex, 'oklch'), { format: 'oklch' });
}

describe('utils/url', () => {
  describe('colorToPath', () => {
    it('converts hex color to path', () => {
      expect(colorToPath('#FF0044')).toBe('/hex/FF0044');
      expect(colorToPath('#ff0044')).toBe('/hex/FF0044');
      expect(colorToPath('#abc')).toBe('/hex/ABC');
    });

    it('converts oklch color to path', () => {
      expect(colorToPath('oklch(0.7 0.2 120)')).toBe('/oklch/0.7/0.2/120');
      expect(colorToPath('oklch(0.64 0.142 329)')).toBe('/oklch/0.64/0.142/329');
    });

    it('converts rgb color to hex path', () => {
      expect(colorToPath('rgb(255, 0, 68)')).toBe('/hex/ff0044');
    });

    it('converts hsl color to hex path', () => {
      expect(colorToPath('hsl(344, 100%, 50%)')).toBe('/hex/ff0044');
    });

    it('returns / for invalid color', () => {
      expect(colorToPath('invalid')).toBe('/');
      expect(colorToPath('')).toBe('/');
    });
  });

  describe('parseColorFromParams', () => {
    it('parses hex color param', () => {
      expect(parseColorFromParams({ color: 'FF0044' })).toBe('#FF0044');
      expect(parseColorFromParams({ color: 'abc' })).toBe('#abc');
    });

    it('parses hex color with # prefix', () => {
      expect(parseColorFromParams({ color: '#FF0044' })).toBe('#FF0044');
    });

    it('parses oklch params', () => {
      expect(parseColorFromParams({ l: '0.7', c: '0.2', h: '120' })).toBe('oklch(0.7 0.2 120)');
    });

    it('returns null for invalid hex', () => {
      expect(parseColorFromParams({ color: 'GGGGGG' })).toBeNull();
      expect(parseColorFromParams({ color: 'not-a-color' })).toBeNull();
    });

    it('returns null for invalid oklch', () => {
      expect(parseColorFromParams({ l: 'abc', c: '0.2', h: '120' })).toBeNull();
      expect(parseColorFromParams({ l: '0.7', c: 'abc', h: '120' })).toBeNull();
    });

    it('returns null for missing params', () => {
      expect(parseColorFromParams({})).toBeNull();
      expect(parseColorFromParams({ l: '0.7' })).toBeNull();
      expect(parseColorFromParams({ l: '0.7', c: '0.2' })).toBeNull();
    });
  });

  describe('serializePaletteToUrl', () => {
    it('serializes single color with default options', () => {
      const state: PaletteState = {
        colors: [createColorEntry('Primary', '#FF0044')],
        globalOptions: getDefaultGlobalOptions('#FF0044'),
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044');
    });

    it('serializes multiple colors', () => {
      const state: PaletteState = {
        colors: [createColorEntry('Primary', '#FF0044'), createColorEntry('Secondary', '#698CE0')],
        globalOptions: getDefaultGlobalOptions('#FF0044'),
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044/Secondary-698CE0');
    });

    it('serializes oklch color value', () => {
      const state: PaletteState = {
        colors: [createColorEntry('Primary', 'oklch(0.64 0.142 329)')],
        globalOptions: getDefaultGlobalOptions('oklch(0.64 0.142 329)'),
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-0.64_0.142_329');
    });

    it('serializes rgb color value as hex', () => {
      const state: PaletteState = {
        colors: [createColorEntry('Primary', 'rgb(255, 0, 68)')],
        globalOptions: getDefaultGlobalOptions('rgb(255, 0, 68)'),
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044');
    });

    it('serializes hsl color value as hex', () => {
      const state: PaletteState = {
        colors: [createColorEntry('Primary', 'hsl(344, 100%, 50%)')],
        globalOptions: getDefaultGlobalOptions('hsl(344, 100%, 50%)'),
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044');
    });

    it('serializes color with per-color overrides', () => {
      const state: PaletteState = {
        colors: [createColorEntry('Primary', '#FF0044', { maxLightness: 0.95, mode: 'dark' })],
        globalOptions: getDefaultGlobalOptions('#FF0044'),
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044-x:0.95,m:d');
    });

    it('serializes non-default global options as query params', () => {
      const state: PaletteState = {
        colors: [createColorEntry('Primary', '#FF0044')],
        globalOptions: { ...getDefaultGlobalOptions('#FF0044'), lightnessCurve: 1.8, steps: 15 },
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044?f=1.8&i=15');
    });

    it('encodes color names with spaces', () => {
      const state: PaletteState = {
        colors: [createColorEntry('Color One', '#FF0044')],
        globalOptions: getDefaultGlobalOptions('#FF0044'),
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Color+One-FF0044');
    });

    it('serializes full example with all options', () => {
      const state: PaletteState = {
        colors: [
          createColorEntry('Primary', '#FF0044', { maxLightness: 0.95 }),
          createColorEntry('Secondary', '#698CE0'),
        ],
        globalOptions: { ...getDefaultGlobalOptions('#FF0044'), lightnessCurve: 1.8 },
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044-x:0.95/Secondary-698CE0?f=1.8');
    });

    it('omits overrides that match global options', () => {
      const state: PaletteState = {
        colors: [createColorEntry('Primary', '#FF0044', { steps: 11 })], // 11 is default
        globalOptions: getDefaultGlobalOptions('#FF0044'),
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044');
    });

    it('does not serialize saturation when it matches the color default', () => {
      const defaults = getDefaultGlobalOptions('#FF0044');
      const state: PaletteState = {
        colors: [createColorEntry('Primary', '#FF0044')],
        globalOptions: defaults,
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044');
    });

    it('serializes saturation when it differs from color default', () => {
      const defaults = getDefaultGlobalOptions('#FF0044');
      const state: PaletteState = {
        colors: [createColorEntry('Primary', '#FF0044')],
        globalOptions: { ...defaults, saturation: 25 },
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044?s=25');
    });

    it('does not serialize saturationOverride when false (default)', () => {
      const defaults = getDefaultGlobalOptions('#FF0044');
      const state: PaletteState = {
        colors: [createColorEntry('Primary', '#FF0044')],
        globalOptions: { ...defaults, saturationOverride: false },
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044');
    });

    it('serializes saturationOverride when true', () => {
      const defaults = getDefaultGlobalOptions('#FF0044');
      const state: PaletteState = {
        colors: [createColorEntry('Primary', '#FF0044')],
        globalOptions: { ...defaults, saturationOverride: true },
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044?o=1');
    });

    it('serializes lock option in per-color overrides', () => {
      const state: PaletteState = {
        colors: [createColorEntry('Primary', '#FF0044', { lock: 500 })],
        globalOptions: getDefaultGlobalOptions('#FF0044'),
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044-k:500');
    });

    it('serializes variant option in per-color overrides', () => {
      const state: PaletteState = {
        colors: [createColorEntry('Primary', '#FF0044', { variant: 'vibrant' })],
        globalOptions: getDefaultGlobalOptions('#FF0044'),
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044-v:vibrant');
    });

    it('serializes variant option in global options', () => {
      const defaults = getDefaultGlobalOptions('#FF0044');
      const state: PaletteState = {
        colors: [createColorEntry('Primary', '#FF0044')],
        globalOptions: { ...defaults, variant: 'neutral' },
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-FF0044?v=neutral');
    });
  });

  describe('parsePaletteFromUrl', () => {
    it('parses single hex color as OKLCH', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.colors).toHaveLength(1);
      expect(result!.colors[0].name).toBe('Primary');
      expect(result!.colors[0].value).toBe(hexToOklch('#FF0044'));
      expect(result!.colors[0].id).toEqual(expect.any(String));
    });

    it('parses lock option in per-color overrides', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-k:500');

      expect(result).not.toBeNull();
      expect(result!.colors[0].overrides).toEqual({ lock: '500' });
    });

    it('parses variant option in per-color overrides', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-v:vibrant');

      expect(result).not.toBeNull();
      expect(result!.colors[0].overrides).toEqual({ variant: 'vibrant' });
    });

    it('parses variant option in global options', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044?v=muted');

      expect(result).not.toBeNull();
      expect(result!.globalOptions.variant).toBe('muted');
    });

    it('returns null for oklch with wrong number of parts', () => {
      expect(parsePaletteFromUrl('/p/Primary-0.64_0.142')).toBeNull();
      expect(parsePaletteFromUrl('/p/Primary-0.64_0.142_329_extra')).toBeNull();
    });

    it('returns null for oklch with non-numeric values', () => {
      expect(parsePaletteFromUrl('/p/Primary-abc_0.142_329')).toBeNull();
    });

    it('ignores unknown option keys', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-z:unknown');

      expect(result).not.toBeNull();
      expect(result!.colors[0].overrides).toEqual({});
    });

    it('ignores malformed option parts', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-x:');

      expect(result).not.toBeNull();
    });

    it('handles empty options string', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-');

      expect(result).not.toBeNull();
      expect(result!.colors[0].overrides).toEqual({});
    });

    it('ignores non-numeric values for numeric options', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-x:abc');

      expect(result).not.toBeNull();
      expect(result!.colors[0].overrides).toEqual({});
    });

    it('ignores non-numeric global option values', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044?f=abc');

      expect(result).not.toBeNull();
      expect(result!.globalOptions.lightnessCurve).toBe(1.5);
    });

    it('ignores unknown global option keys', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044?z=unknown');

      expect(result).not.toBeNull();
    });

    it('parses mode with full name if short not found', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-m:custom');

      expect(result).not.toBeNull();
      expect(result!.colors[0].overrides?.mode).toBe('custom');
    });

    it('parses multiple colors', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044/Secondary-698CE0');

      expect(result).not.toBeNull();
      expect(result!.colors).toHaveLength(2);
      expect(result!.colors[0].name).toBe('Primary');
      expect(result!.colors[1].name).toBe('Secondary');
    });

    it('parses oklch format', () => {
      const result = parsePaletteFromUrl('/p/Primary-0.64_0.142_329');

      expect(result).not.toBeNull();
      expect(result!.colors[0].value).toBe('oklch(0.64 0.142 329)');
    });

    it('parses per-color options', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-x:0.95,m:d');

      expect(result).not.toBeNull();
      expect(result!.colors[0].overrides).toEqual({ maxLightness: 0.95, mode: 'dark' });
    });

    it('parses global options from query params', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044?f=1.8&i=15');

      expect(result).not.toBeNull();
      expect(result!.globalOptions.lightnessCurve).toBe(1.8);
      expect(result!.globalOptions.steps).toBe(15);
    });

    it('computes saturation from parsed color value', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044');
      const parsedValue = result!.colors[0].value;
      const expectedDefaults = getDefaultGlobalOptions(parsedValue);

      expect(result).not.toBeNull();
      expect(result!.globalOptions.saturation).toBe(expectedDefaults.saturation);
    });

    it('defaults saturationOverride to false when not in URL', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.globalOptions.saturationOverride).toBe(false);
    });

    it('parses saturationOverride=true from URL', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044?o=1');

      expect(result).not.toBeNull();
      expect(result!.globalOptions.saturationOverride).toBe(true);
    });

    it('decodes name with + to space', () => {
      const result = parsePaletteFromUrl('/p/Color+One-FF0044');

      expect(result).not.toBeNull();
      expect(result!.colors[0].name).toBe('Color One');
    });

    it('returns null for invalid color value', () => {
      expect(parsePaletteFromUrl('/p/Primary-GGGGGG')).toBeNull();
      expect(parsePaletteFromUrl('/p/Primary-invalid')).toBeNull();
    });

    it('returns null for empty URL', () => {
      expect(parsePaletteFromUrl('')).toBeNull();
    });

    it('returns null for malformed segment', () => {
      expect(parsePaletteFromUrl('/p/Primary')).toBeNull();
    });

    it('parses URL without /p/ prefix', () => {
      const result = parsePaletteFromUrl('Primary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.colors[0].name).toBe('Primary');
      expect(result!.colors[0].value).toBe(hexToOklch('#FF0044'));
    });

    it('round-trips OKLCH: serialize then parse returns equivalent state', () => {
      const original: PaletteState = {
        colors: [
          createColorEntry('Primary', 'oklch(0.64 0.142 329)', { maxLightness: 0.95 }),
          createColorEntry('Color Two', 'oklch(0.7 0.2 120)'),
        ],
        globalOptions: {
          ...getDefaultGlobalOptions('oklch(0.64 0.142 329)'),
          lightnessCurve: 1.8,
          mode: 'dark',
        },
      };

      const url = serializePaletteToUrl(original);
      const parsed = parsePaletteFromUrl(url);

      expect(parsed).not.toBeNull();
      expect(parsed!.colors).toHaveLength(2);
      expect(parsed!.colors[0].name).toBe('Primary');
      expect(parsed!.colors[0].value).toBe('oklch(0.64 0.142 329)');
      expect(parsed!.colors[0].overrides).toEqual({ maxLightness: 0.95 });
      expect(parsed!.colors[1].name).toBe('Color Two');
      expect(parsed!.colors[1].value).toBe('oklch(0.7 0.2 120)');
      expect(parsed!.globalOptions.lightnessCurve).toBe(1.8);
      expect(parsed!.globalOptions.mode).toBe('dark');
    });

    it('backward compat: hex URLs are converted to OKLCH', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.colors[0].value).toMatch(/^oklch\(/);
    });
  });

  describe('getPaletteIdFromUrl', () => {
    it('returns ID when present', () => {
      expect(getPaletteIdFromUrl('?id=abc123')).toBe('abc123');
      expect(getPaletteIdFromUrl('?f=1.8&id=abc123&s=15')).toBe('abc123');
    });

    it('returns null when not present', () => {
      expect(getPaletteIdFromUrl('')).toBe(null);
      expect(getPaletteIdFromUrl('?f=1.8&s=15')).toBe(null);
    });

    it('handles ID at the end of query string', () => {
      expect(getPaletteIdFromUrl('?f=1.8&s=15&id=palette-123')).toBe('palette-123');
    });
  });

  describe('updatePaletteIdInUrl', () => {
    it('adds ID to URL without query params', () => {
      expect(updatePaletteIdInUrl('/p/Primary-FF0044', 'abc123')).toBe(
        '/p/Primary-FF0044?id=abc123',
      );
    });

    it('adds ID to URL with existing query params (at end)', () => {
      expect(updatePaletteIdInUrl('/p/Primary-FF0044?f=1.8', 'abc123')).toBe(
        '/p/Primary-FF0044?f=1.8&id=abc123',
      );
    });

    it('removes ID when null', () => {
      expect(updatePaletteIdInUrl('/p/Primary-FF0044?f=1.8&id=abc123', null)).toBe(
        '/p/Primary-FF0044?f=1.8',
      );
    });

    it('removes ID and leaves empty query when only param', () => {
      expect(updatePaletteIdInUrl('/p/Primary-FF0044?id=abc123', null)).toBe('/p/Primary-FF0044');
    });

    it('replaces existing ID (moves to end)', () => {
      expect(updatePaletteIdInUrl('/p/Primary-FF0044?id=old&f=1.8', 'new')).toBe(
        '/p/Primary-FF0044?f=1.8&id=new',
      );
    });

    it('handles URL with no query string when removing', () => {
      expect(updatePaletteIdInUrl('/p/Primary-FF0044', null)).toBe('/p/Primary-FF0044');
    });
  });
});
