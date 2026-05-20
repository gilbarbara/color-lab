import { parseCSS } from 'colorizr';

import { toOklch } from '~/utils/color';
import { getDefaultGlobalOptions } from '~/utils/palette';
import {
  getPaletteIdFromUrl,
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
  return { id: crypto.randomUUID(), name, value: toOklch(value), ...(overrides && { overrides }) };
}

/** Build a ColorEntry from a hex source (storage is always OKLCH). */
function oklchEntry(name: string, hex: string, overrides?: ColorEntry['overrides']): ColorEntry {
  return createColorEntry(name, hex, overrides);
}

/**
 * URL-form serialization of a hex color (what `colorValueToUrl` emits).
 * Mimics the storage round-trip: hex → formatCSS(oklch) → parseCSS → encode,
 * so precision matches what the encoder actually sees in production.
 */
function urlFor(hex: string): string {
  const o = parseCSS(toOklch(hex), 'oklch');

  return `${parseFloat((o.l * 100).toFixed(3))}_${parseFloat(o.c.toFixed(5))}_${parseFloat(o.h.toFixed(3))}`;
}

const hex = '#ff0044';
const hexAlt = '#698CE0';

describe('utils/url', () => {
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

  describe('parsePaletteFromUrl', () => {
    it('parses single hex color as OKLCH', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.state.colors).toHaveLength(1);
      expect(result!.state.colors[0].name).toBe('Primary');
      expect(result!.state.colors[0].value).toBe(toOklch(hex));
      expect(result!.state.colors[0].id).toEqual(expect.any(String));
    });

    it('parses lock option in per-color overrides', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-k:500');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].overrides).toEqual({ lock: 500 });
    });

    it('parses variant option in per-color overrides', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-v:vibrant');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].overrides).toEqual({ variant: 'vibrant' });
    });

    it('parses variant option in global options', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044?v=vibrant');

      expect(result).not.toBeNull();
      expect(result!.state.globalOptions.variant).toBe('vibrant');
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
      expect(result!.state.colors[0].overrides).toEqual({});
    });

    it('ignores malformed option parts', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-x:');

      expect(result).not.toBeNull();
    });

    it('handles empty options string', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-');

      expect(result).not.toBeNull();
      // Right-scan trims trailing empty; no options chunk found → overrides not assigned
      expect(result!.state.colors[0].overrides).toBeUndefined();
    });

    it('ignores non-numeric values for numeric options', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-x:abc');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].overrides).toEqual({});
    });

    it('ignores non-numeric global option values', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044?f=abc');

      expect(result).not.toBeNull();
      expect(result!.state.globalOptions.lightnessCurve).toBe(1.5);
    });

    it('ignores unknown global option keys', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044?z=unknown');

      expect(result).not.toBeNull();
    });

    it('drops invalid mode value (runtime narrowing)', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-m:custom');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].overrides).toEqual({});
    });

    it('parses multiple colors', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044/Secondary-698CE0');

      expect(result).not.toBeNull();
      expect(result!.state.colors).toHaveLength(2);
      expect(result!.state.colors[0].name).toBe('Primary');
      expect(result!.state.colors[1].name).toBe('Secondary');
    });

    it('parses oklch format', () => {
      const result = parsePaletteFromUrl('/p/Primary-0.64_0.142_329');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].value).toBe('oklch(64% 0.142 329)');
    });

    it('parses per-color options', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-x:0.95,m:d');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].overrides).toEqual({ maxLightness: 0.95, mode: 'dark' });
    });

    it('parses global options from query params', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044?f=1.8&i=15');

      expect(result).not.toBeNull();
      expect(result!.state.globalOptions.lightnessCurve).toBe(1.8);
      expect(result!.state.globalOptions.steps).toBe(15);
    });

    it('computes saturation from parsed color value', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044');
      const parsedValue = result!.state.colors[0].value;
      const expectedDefaults = getDefaultGlobalOptions(parsedValue);

      expect(result).not.toBeNull();
      expect(result!.state.globalOptions.saturation).toBe(expectedDefaults.saturation);
    });

    it('defaults saturationOverride to false when not in URL', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.state.globalOptions.saturationOverride).toBe(false);
    });

    it('parses saturationOverride=true from URL', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044?o=1');

      expect(result).not.toBeNull();
      expect(result!.state.globalOptions.saturationOverride).toBe(true);
    });

    it('decodes name with + to space', () => {
      const result = parsePaletteFromUrl('/p/Color+One-FF0044');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].name).toBe('Color One');
    });

    it('returns null for invalid color value', () => {
      expect(parsePaletteFromUrl('/p/Primary-GGGGGG')).toBeNull();
      expect(parsePaletteFromUrl('/p/Primary-invalid')).toBeNull();
    });

    it('returns null for empty URL', () => {
      expect(parsePaletteFromUrl('')).toBeNull();
    });

    it('returns null when only segment is malformed', () => {
      expect(parsePaletteFromUrl('/p/Primary')).toBeNull();
    });

    it('drops malformed segment, keeps valid neighbor', () => {
      const result = parsePaletteFromUrl('/p/Garbage/Primary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.state.colors).toHaveLength(1);
      expect(result!.state.colors[0].name).toBe('Primary');
      expect(result!.dropped).toEqual(['Garbage']);
    });

    it('drops empty-name segment, keeps valid neighbor', () => {
      const result = parsePaletteFromUrl('/p/-FF0044/Primary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.state.colors).toHaveLength(1);
      expect(result!.state.colors[0].name).toBe('Primary');
      expect(result!.dropped).toEqual(['(unnamed)']);
    });

    it('drops whitespace-only name segment', () => {
      const result = parsePaletteFromUrl('/p/+-FF0044/Primary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.dropped).toEqual(['(unnamed)']);
    });

    it('returns null when only segment has empty name', () => {
      expect(parsePaletteFromUrl('/p/-FF0044')).toBeNull();
    });

    it('parses URL without /p/ prefix', () => {
      const result = parsePaletteFromUrl('Primary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].name).toBe('Primary');
      expect(result!.state.colors[0].value).toBe(toOklch(hex));
    });

    it('round-trips OKLCH: serialize then parse returns equivalent state', () => {
      const original: PaletteState = {
        colors: [
          createColorEntry('Primary', 'oklch(0.64 0.142 329)', { maxLightness: 0.95 }),
          createColorEntry('Color Two', 'oklch(0.7 0.2 120)'),
        ],
        globalOptions: {
          ...getDefaultGlobalOptions(toOklch('oklch(0.64 0.142 329)')),
          lightnessCurve: 1.8,
          mode: 'dark',
        },
      };

      const url = serializePaletteToUrl(original);
      const parsed = parsePaletteFromUrl(url);

      expect(parsed).not.toBeNull();
      expect(parsed!.state.colors).toHaveLength(2);
      expect(parsed!.state.colors[0].name).toBe('Primary');
      expect(parsed!.state.colors[0].value).toBe('oklch(64% 0.142 329)');
      expect(parsed!.state.colors[0].overrides).toEqual({ maxLightness: 0.95 });
      expect(parsed!.state.colors[1].name).toBe('Color Two');
      expect(parsed!.state.colors[1].value).toBe('oklch(70% 0.200 120)');
      expect(parsed!.state.globalOptions.lightnessCurve).toBe(1.8);
      expect(parsed!.state.globalOptions.mode).toBe('dark');
    });

    it('backward compat: hex URLs are converted to OKLCH', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].value).toMatch(/^oklch\(/);
    });

    it('returns empty dropped for valid URL', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.dropped).toEqual([]);
    });

    it('drops bad OKLCH segment, keeps valid ones', () => {
      const result = parsePaletteFromUrl('/p/Primary-500_99_999/Secondary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.state.colors).toHaveLength(1);
      expect(result!.state.colors[0].name).toBe('Secondary');
      expect(result!.dropped).toEqual(['Primary']);
    });

    it('drops OKLCH segment with lightness > 100', () => {
      const result = parsePaletteFromUrl('/p/Uno-164.9_0.24196_300.54/Deux-71.8_0.28773_326.81');

      expect(result).not.toBeNull();
      expect(result!.state.colors).toHaveLength(1);
      expect(result!.state.colors[0].name).toBe('Deux');
      expect(result!.dropped).toEqual(['Uno']);
    });

    it('drops OKLCH segment with negative chroma', () => {
      const result = parsePaletteFromUrl('/p/Neg-50_-0.1_300/Primary-FF0044');

      expect(result).not.toBeNull();
      expect(result!.state.colors).toHaveLength(1);
      expect(result!.state.colors[0].name).toBe('Primary');
      // Right-scan parses differently for OKLCH with negative chroma in URL — the leading
      // `-` of the negative number splits the segment further. Same outcome (drop), different label.
      expect(result!.dropped).toEqual(['Neg-50_']);
    });

    it('returns null when all colors are invalid', () => {
      expect(parsePaletteFromUrl('/p/Primary-500_99_999')).toBeNull();
    });

    it('returns null when only color has out-of-range lightness', () => {
      expect(parsePaletteFromUrl('/p/Uno-164.9_0.24196_300.54')).toBeNull();
    });

    // === Parser safety pass (A + B + H) ===

    it('parses dash-bearing name', () => {
      const result = parsePaletteFromUrl('/p/Forest-Green-FF0044');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].name).toBe('Forest-Green');
    });

    it('parses dash-bearing name with options', () => {
      const result = parsePaletteFromUrl('/p/Forest-Green-FF0044-x:0.95');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].name).toBe('Forest-Green');
      expect(result!.state.colors[0].overrides).toEqual({ maxLightness: 0.95 });
    });

    it('parses URL with dashed option value without breaking', () => {
      // Mode 'dark-mode' is invalid → narrowed away; key benefit is that parsing
      // itself does not break on the dash inside the options chunk.
      const result = parsePaletteFromUrl('/p/Primary-FF0044-m:dark-mode');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].name).toBe('Primary');
      expect(result!.state.colors[0].overrides).toEqual({});
    });

    it('drops with correct label when value is missing (options-only)', () => {
      const result = parsePaletteFromUrl('/p/Foo-Primary-x:0.5');

      expect(result).toBeNull();
    });

    it('handles multi-trailing-dash garbage', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044--');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].name).toBe('Primary');
    });

    it('handles multi-middle-dash garbage', () => {
      const result = parsePaletteFromUrl('/p/Primary---FF0044--');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].name).toBe('Primary--');
    });

    it('round-trips name with special characters', () => {
      const cases = ['Foo/Bar', 'Foo?Bar', 'Foo#Bar', 'C++', '100%', 'A B', 'Forest-Green'];

      for (const name of cases) {
        const state: PaletteState = {
          colors: [oklchEntry(name, hex)],
          globalOptions: getDefaultGlobalOptions(toOklch(hex)),
        };
        const url = serializePaletteToUrl(state);
        const parsed = parsePaletteFromUrl(url);

        expect(parsed).not.toBeNull();
        expect(parsed!.state.colors[0].name).toBe(name);
      }
    });

    it('decodes legacy + space format (backward compat)', () => {
      // Old serializer produced 'Foo+Bar' for 'Foo Bar' — must still decode correctly
      const result = parsePaletteFromUrl('/p/Foo+Bar-FF0044');

      expect(result).not.toBeNull();
      expect(result!.state.colors[0].name).toBe('Foo Bar');
    });

    it('drops invalid mode value (per-color)', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-m:garbage');

      expect(result!.state.colors[0].overrides).toEqual({});
    });

    it('accepts valid mode short form', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-m:d');

      expect(result!.state.colors[0].overrides).toEqual({ mode: 'dark' });
    });

    it('drops invalid variant value', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-v:notreal');

      expect(result!.state.colors[0].overrides).toEqual({});
    });

    it('accepts valid variant value', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044-v:vibrant');

      expect(result!.state.colors[0].overrides).toEqual({ variant: 'vibrant' });
    });

    it('drops invalid mode in global options', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044?m=junk');

      expect(result!.state.globalOptions.mode).toBe('light'); // default
    });
  });

  describe('serializePaletteToUrl', () => {
    it('serializes single color with default options', () => {
      const state: PaletteState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}`);
    });

    it('serializes multiple colors', () => {
      const state: PaletteState = {
        colors: [oklchEntry('Primary', hex), oklchEntry('Secondary', hexAlt)],
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(
        `/p/Primary-${urlFor(hex)}/Secondary-${urlFor(hexAlt)}`,
      );
    });

    it('serializes oklch color value', () => {
      const state: PaletteState = {
        colors: [createColorEntry('Primary', 'oklch(0.64 0.142 329)')],
        globalOptions: getDefaultGlobalOptions(toOklch('oklch(0.64 0.142 329)')),
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-64_0.142_329');
    });

    it('serializes color with per-color overrides', () => {
      const state: PaletteState = {
        colors: [oklchEntry('Primary', hex, { maxLightness: 0.95, mode: 'dark' })],
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}-x:0.95,m:d`);
    });

    it('serializes non-default global options as query params', () => {
      const state: PaletteState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: { ...getDefaultGlobalOptions(toOklch(hex)), lightnessCurve: 1.8, steps: 15 },
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}?f=1.8&i=15`);
    });

    it('encodes color names with spaces', () => {
      const state: PaletteState = {
        colors: [oklchEntry('Color One', hex)],
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Color+One-${urlFor(hex)}`);
    });

    it('serializes full example with all options', () => {
      const state: PaletteState = {
        colors: [
          oklchEntry('Primary', hex, { maxLightness: 0.95 }),
          oklchEntry('Secondary', hexAlt),
        ],
        globalOptions: { ...getDefaultGlobalOptions(toOklch(hex)), lightnessCurve: 1.8 },
      };

      expect(serializePaletteToUrl(state)).toBe(
        `/p/Primary-${urlFor(hex)}-x:0.95/Secondary-${urlFor(hexAlt)}?f=1.8`,
      );
    });

    it('omits overrides that match global options', () => {
      const state: PaletteState = {
        colors: [oklchEntry('Primary', hex, { steps: 11 })], // 11 is default
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}`);
    });

    it('does not serialize saturation when it matches the color default', () => {
      const defaults = getDefaultGlobalOptions(toOklch(hex));
      const state: PaletteState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: defaults,
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}`);
    });

    it('serializes saturation when it differs from color default', () => {
      const defaults = getDefaultGlobalOptions(toOklch(hex));
      const state: PaletteState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: { ...defaults, saturation: 25 },
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}?s=25`);
    });

    it('does not serialize saturationOverride when false (default)', () => {
      const defaults = getDefaultGlobalOptions(toOklch(hex));
      const state: PaletteState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: { ...defaults, saturationOverride: false },
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}`);
    });

    it('serializes saturationOverride when true', () => {
      const defaults = getDefaultGlobalOptions(toOklch(hex));
      const state: PaletteState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: { ...defaults, saturationOverride: true },
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}?o=1`);
    });

    it('serializes lock option in per-color overrides', () => {
      const state: PaletteState = {
        colors: [oklchEntry('Primary', hex, { lock: 500 })],
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}-k:500`);
    });

    it('serializes variant option in per-color overrides', () => {
      const state: PaletteState = {
        colors: [oklchEntry('Primary', hex, { variant: 'vibrant' })],
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}-v:vibrant`);
    });

    it('serializes variant option in global options', () => {
      const defaults = getDefaultGlobalOptions(toOklch(hex));
      const state: PaletteState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: { ...defaults, variant: 'neutral' },
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}?v=neutral`);
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
