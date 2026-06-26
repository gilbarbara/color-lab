import { getScaleStepKeys, parseCSS, scale } from 'colorizr';

import { DEFAULT_PALETTE_NAME } from '~/config/globals';
import { createColorEntry } from '~/test-fixtures';
import { toOklch } from '~/utils/color';
import { getDefaultGlobalOptions } from '~/utils/generator';
import {
  buildUrl,
  canonicalizeUrl,
  decoratePaletteUrl,
  getPaletteIdFromUrl,
  parsePaletteFromUrl,
  serializePaletteToUrl,
  stripPaletteIdentity,
} from '~/utils/url';

import type { ColorEntry, GeneratorState } from '~/types';

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

    it('returns null for out-of-range oklch color values (never reaches scale())', () => {
      expect(parsePaletteFromUrl('/p/Primary-63_5_19.9')).toBeNull(); // chroma out of gamut
      expect(parsePaletteFromUrl('/p/Primary-63_0.272_9999')).toBeNull(); // hue out of range
      expect(parsePaletteFromUrl('/p/Primary-200_0.272_19.9')).toBeNull(); // lightness > 1
    });

    it('drops only the out-of-range color in a multi-color palette', () => {
      const result = parsePaletteFromUrl('/p/Primary-FF0044/Bad-63_5_19.9');

      expect(result!.state.colors).toHaveLength(1);
      expect(result!.state.colors[0].name).toBe('Primary');
      expect(result!.dropped).toContain('Bad');
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
      expect(result!.state.globalOptions.lightnessCurve).toBe(1.3);
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
      const original: GeneratorState = {
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
        const state: GeneratorState = {
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
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}`);
    });

    it('serializes multiple colors', () => {
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex), oklchEntry('Secondary', hexAlt)],
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(
        `/p/Primary-${urlFor(hex)}/Secondary-${urlFor(hexAlt)}`,
      );
    });

    it('serializes oklch color value', () => {
      const state: GeneratorState = {
        colors: [createColorEntry('Primary', 'oklch(0.64 0.142 329)')],
        globalOptions: getDefaultGlobalOptions(toOklch('oklch(0.64 0.142 329)')),
      };

      expect(serializePaletteToUrl(state)).toBe('/p/Primary-64_0.142_329');
    });

    it('serializes color with per-color overrides', () => {
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex, { maxLightness: 0.95, mode: 'dark' })],
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}-x:0.95,m:d`);
    });

    it('serializes non-default global options as query params', () => {
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: { ...getDefaultGlobalOptions(toOklch(hex)), lightnessCurve: 1.8, steps: 15 },
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}?f=1.8&i=15`);
    });

    it('encodes color names with spaces', () => {
      const state: GeneratorState = {
        colors: [oklchEntry('Color One', hex)],
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Color+One-${urlFor(hex)}`);
    });

    it('serializes full example with all options', () => {
      const state: GeneratorState = {
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
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex, { steps: 11 })], // 11 is default
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}`);
    });

    it('does not serialize saturation when it matches the color default', () => {
      const defaults = getDefaultGlobalOptions(toOklch(hex));
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: defaults,
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}`);
    });

    it('serializes saturation when it differs from color default', () => {
      const defaults = getDefaultGlobalOptions(toOklch(hex));
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: { ...defaults, saturation: 25 },
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}?s=25`);
    });

    it('does not serialize saturationOverride when false (default)', () => {
      const defaults = getDefaultGlobalOptions(toOklch(hex));
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: { ...defaults, saturationOverride: false },
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}`);
    });

    it('serializes saturationOverride when true', () => {
      const defaults = getDefaultGlobalOptions(toOklch(hex));
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: { ...defaults, saturationOverride: true },
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}?o=1`);
    });

    it('serializes lock option in per-color overrides', () => {
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex, { lock: 500 })],
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}-k:500`);
    });

    it('serializes variant option in per-color overrides', () => {
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex, { variant: 'vibrant' })],
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}-v:vibrant`);
    });

    it('serializes variant option in global options', () => {
      const defaults = getDefaultGlobalOptions(toOklch(hex));
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: { ...defaults, variant: 'neutral' },
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}?v=neutral`);
    });
  });

  describe('decoratePaletteUrl', () => {
    describe('id', () => {
      it('adds ID to URL without query params', () => {
        expect(decoratePaletteUrl('/p/Primary-FF0044', { id: 'abc123' })).toBe(
          '/p/Primary-FF0044?id=abc123',
        );
      });

      it('adds ID to URL with existing query params (at end)', () => {
        expect(decoratePaletteUrl('/p/Primary-FF0044?f=1.8', { id: 'abc123' })).toBe(
          '/p/Primary-FF0044?f=1.8&id=abc123',
        );
      });

      it('removes ID when null', () => {
        expect(decoratePaletteUrl('/p/Primary-FF0044?f=1.8&id=abc123', { id: null })).toBe(
          '/p/Primary-FF0044?f=1.8',
        );
      });

      it('removes ID and leaves empty query when only param', () => {
        expect(decoratePaletteUrl('/p/Primary-FF0044?id=abc123', { id: null })).toBe(
          '/p/Primary-FF0044',
        );
      });

      it('replaces existing ID (moves to end)', () => {
        expect(decoratePaletteUrl('/p/Primary-FF0044?id=old&f=1.8', { id: 'new' })).toBe(
          '/p/Primary-FF0044?f=1.8&id=new',
        );
      });

      it('handles URL with no query string when removing', () => {
        expect(decoratePaletteUrl('/p/Primary-FF0044', { id: null })).toBe('/p/Primary-FF0044');
      });

      it('keeps an existing name when only the id is set (undefined name)', () => {
        expect(decoratePaletteUrl('/p/Primary-FF0044?name=My+Palette', { id: 'abc' })).toBe(
          '/p/Primary-FF0044?name=My+Palette&id=abc',
        );
      });

      it('keeps an existing name when the id is removed', () => {
        expect(decoratePaletteUrl('/p/Primary-FF0044?name=My+Palette&id=abc', { id: null })).toBe(
          '/p/Primary-FF0044?name=My+Palette',
        );
      });
    });

    describe('name', () => {
      it('adds a name before an existing id', () => {
        expect(decoratePaletteUrl('/p/Primary-FF0044?id=abc', { name: 'My Palette' })).toBe(
          '/p/Primary-FF0044?name=My+Palette&id=abc',
        );
      });

      it('strips the name when null, keeping id last', () => {
        expect(decoratePaletteUrl('/p/Primary-FF0044?name=My+Palette&id=abc', { name: null })).toBe(
          '/p/Primary-FF0044?id=abc',
        );
      });

      it('omits a default name', () => {
        expect(decoratePaletteUrl('/p/Primary-FF0044', { name: DEFAULT_PALETTE_NAME })).toBe(
          '/p/Primary-FF0044',
        );
      });

      it('keeps an existing id when only the name is set (undefined id)', () => {
        expect(decoratePaletteUrl('/p/Primary-FF0044?id=abc', { name: 'My Palette' })).toBe(
          '/p/Primary-FF0044?name=My+Palette&id=abc',
        );
      });

      it('is idempotent', () => {
        const once = decoratePaletteUrl('/p/Primary-FF0044?f=1.8', { name: 'My Palette' });

        expect(decoratePaletteUrl(once, { name: 'My Palette' })).toBe(once);
      });
    });

    it('sets name and id together, id terminal', () => {
      expect(decoratePaletteUrl('/p/Primary-FF0044?f=1.8', { id: 'abc', name: 'My Palette' })).toBe(
        '/p/Primary-FF0044?f=1.8&name=My+Palette&id=abc',
      );
    });

    it('strips both with stripPaletteIdentity', () => {
      expect(stripPaletteIdentity('/p/Primary-FF0044?f=1.8&name=My+Palette&id=abc')).toBe(
        '/p/Primary-FF0044?f=1.8',
      );
    });
  });

  describe('palette name in URL', () => {
    const baseOptions = getDefaultGlobalOptions(toOklch(hex));

    it('serializes a non-default name as ?name=', () => {
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: baseOptions,
        name: 'My Palette',
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}?name=My+Palette`);
    });

    it('omits the name when it is the default', () => {
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: baseOptions,
        name: DEFAULT_PALETTE_NAME,
      };

      expect(serializePaletteToUrl(state)).toBe(`/p/Primary-${urlFor(hex)}`);
    });

    it('omits the name when undefined (structural slice)', () => {
      expect(
        serializePaletteToUrl({ colors: [oklchEntry('Primary', hex)], globalOptions: baseOptions }),
      ).toBe(`/p/Primary-${urlFor(hex)}`);
    });

    it('orders name after global options and before id', () => {
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: { ...baseOptions, lightnessCurve: 1.8 },
        name: 'My Palette',
      };

      expect(decoratePaletteUrl(serializePaletteToUrl(state), { id: 'abc123' })).toBe(
        `/p/Primary-${urlFor(hex)}?f=1.8&name=My+Palette&id=abc123`,
      );
    });

    it('parses ?name= into state.name', () => {
      expect(parsePaletteFromUrl('/p/Primary-FF0044?name=My+Palette')?.state.name).toBe(
        'My Palette',
      );
    });

    it('defaults the name when ?name= is absent', () => {
      expect(parsePaletteFromUrl('/p/Primary-FF0044')?.state.name).toBe(DEFAULT_PALETTE_NAME);
    });

    it('defaults the name when ?name= is empty', () => {
      expect(parsePaletteFromUrl('/p/Primary-FF0044?name=')?.state.name).toBe(DEFAULT_PALETTE_NAME);
    });

    it('round-trips a name with spaces and special characters', () => {
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: baseOptions,
        name: 'Sunset & Sky 50%',
      };

      expect(parsePaletteFromUrl(serializePaletteToUrl(state))?.state.name).toBe(
        'Sunset & Sky 50%',
      );
    });
  });

  describe('canonicalizeUrl', () => {
    it('converts legacy hex URL to canonical OKLCH', () => {
      const result = canonicalizeUrl('/p/Primary-FF0044');

      expect(result).toMatch(/^\/p\/Primary-\d/);
      expect(result).not.toContain('FF0044');
    });

    it('preserves id query param', () => {
      const result = canonicalizeUrl('/p/Primary-FF0044?id=abc123');

      expect(result).toContain('?id=abc123');
    });

    it('is idempotent on already-canonical URL', () => {
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', hex)],
        globalOptions: getDefaultGlobalOptions(toOklch(hex)),
      };
      const canonical = serializePaletteToUrl(state);

      expect(canonicalizeUrl(canonical)).toBe(canonical);
    });

    it('returns input unchanged when URL is empty', () => {
      expect(canonicalizeUrl('')).toBe('');
    });

    it('returns input unchanged when any color segment is dropped', () => {
      const url = '/p/Primary-FF0044/-BADVALUE';

      expect(canonicalizeUrl(url)).toBe(url);
    });
  });

  describe('buildUrl', () => {
    it('builds the path without a query when there are no params', () => {
      expect(buildUrl(['Primary-FF0044'], {})).toBe('/p/Primary-FF0044');
    });

    it('joins multi-segment slugs', () => {
      expect(buildUrl(['Primary-FF0044', 'Accent-00AAFF'], {})).toBe(
        '/p/Primary-FF0044/Accent-00AAFF',
      );
    });

    it('appends a single-valued param', () => {
      expect(buildUrl(['Primary-FF0044'], { name: 'Brand' })).toBe('/p/Primary-FF0044?name=Brand');
    });

    it('appends array-valued params as repeated keys', () => {
      expect(buildUrl(['Primary-FF0044'], { c: ['1', '2'] })).toBe('/p/Primary-FF0044?c=1&c=2');
    });
  });

  describe('curve option shapes', () => {
    const base = toOklch('oklch(0.64 0.142 329)');

    function globalRoundTrip(overrides: Partial<GeneratorState['globalOptions']>) {
      const state: GeneratorState = {
        colors: [createColorEntry('Primary', 'oklch(0.64 0.142 329)')],
        globalOptions: { ...getDefaultGlobalOptions(base), ...overrides },
      };

      return parsePaletteFromUrl(serializePaletteToUrl(state))!.state.globalOptions;
    }

    describe('query (global options)', () => {
      it('round-trips a lightnessCurve range', () => {
        expect(globalRoundTrip({ lightnessCurve: { low: 1.5, high: 1 } }).lightnessCurve).toEqual({
          low: 1.5,
          high: 1,
        });
      });

      it('round-trips a chromaCurve peak', () => {
        expect(globalRoundTrip({ chromaCurve: { amount: 0.6, peak: 0.35 } }).chromaCurve).toEqual({
          amount: 0.6,
          peak: 0.35,
        });
      });

      it('round-trips a chromaCurve endpoints range', () => {
        expect(globalRoundTrip({ chromaCurve: { low: 0.2, high: 0.85 } }).chromaCurve).toEqual({
          low: 0.2,
          high: 0.85,
        });
      });

      it('round-trips a hueShift range with negatives', () => {
        expect(globalRoundTrip({ hueShift: { low: -15, high: 20 } }).hueShift).toEqual({
          low: -15,
          high: 20,
        });
      });

      it('omits a lightnessCurve { x, x } range that equals the scalar default (moot Split)', () => {
        const scalar = getDefaultGlobalOptions(base).lightnessCurve as number;
        const url = serializePaletteToUrl({
          colors: [createColorEntry('Primary', 'oklch(0.64 0.142 329)')],
          globalOptions: {
            ...getDefaultGlobalOptions(base),
            lightnessCurve: { low: scalar, high: scalar },
          },
        });

        expect(url).not.toContain('f=');
        expect(parsePaletteFromUrl(url)!.state.globalOptions.lightnessCurve).toBe(scalar);
      });

      it('persists a non-default { x, x } range so Split mode survives reload', () => {
        const url = serializePaletteToUrl({
          colors: [createColorEntry('Primary', 'oklch(0.64 0.142 329)')],
          globalOptions: {
            ...getDefaultGlobalOptions(base),
            lightnessCurve: { low: 1.5, high: 1.5 },
          },
        });

        expect(url).toContain('f=1.5_1.5');
        expect(parsePaletteFromUrl(url)!.state.globalOptions.lightnessCurve).toEqual({
          low: 1.5,
          high: 1.5,
        });
      });

      it('omits a hueShift { 0, 0 } range that equals the scalar default (moot Split)', () => {
        const url = serializePaletteToUrl({
          colors: [createColorEntry('Primary', 'oklch(0.64 0.142 329)')],
          globalOptions: { ...getDefaultGlobalOptions(base), hueShift: { low: 0, high: 0 } },
        });

        expect(url).not.toContain('h=');
        expect(parsePaletteFromUrl(url)!.state.globalOptions.hueShift).toBe(0);
      });

      it('keeps a hand-written scalar hueShift as a scalar (Simple mode)', () => {
        const result = parsePaletteFromUrl('/p/Primary-FF0044?h=15');

        expect(result!.state.globalOptions.hueShift).toBe(15);
      });

      it.each([
        ['c=p1.2_0.5', 'chromaCurve'],
        ['c=p0.6_0', 'chromaCurve'],
        ['c=p0.6_1', 'chromaCurve'],
        ['c=0.2_1.5', 'chromaCurve'],
        ['f=0_1', 'lightnessCurve'],
        ['h=-200_10', 'hueShift'],
        ['c=p0.6', 'chromaCurve'],
        ['h=1_2_3', 'hueShift'],
      ])('drops invalid %s and keeps the default', query => {
        const result = parsePaletteFromUrl(`/p/Primary-FF0044?${query}`);
        const defaults = getDefaultGlobalOptions(result!.state.colors[0].value);

        expect(result!.state.globalOptions).toEqual(defaults);
      });

      it('legacy scalar chromaCurve/lightnessCurve still parse', () => {
        const result = parsePaletteFromUrl('/p/Primary-FF0044?c=0.5&f=1.8');

        expect(result!.state.globalOptions.chromaCurve).toBe(0.5);
        expect(result!.state.globalOptions.lightnessCurve).toBe(1.8);
      });
    });

    describe('per-color path overrides', () => {
      it('round-trips a peak override', () => {
        const result = parsePaletteFromUrl('/p/Primary-FF0044-c:p0.6_0.35');

        expect(result!.state.colors[0].overrides).toEqual({
          chromaCurve: { amount: 0.6, peak: 0.35 },
        });
      });

      it('round-trips a hueShift override with negative low and high', () => {
        const result = parsePaletteFromUrl('/p/Primary-FF0044-h:-15_-20');

        expect(result!.state.colors[0].overrides).toEqual({ hueShift: { low: -15, high: -20 } });
      });

      it('omits a moot hueShift { 0, 0 } override that matches the scalar-default global', () => {
        const url = serializePaletteToUrl({
          colors: [
            createColorEntry('Primary', 'oklch(0.64 0.142 329)', { hueShift: { low: 0, high: 0 } }),
          ],
          globalOptions: getDefaultGlobalOptions(base),
        });

        expect(url).not.toContain('h:');
        expect(parsePaletteFromUrl(url)!.state.colors[0].overrides).toBeUndefined();
      });

      it('serializes an endpoints override into the path chunk', () => {
        const state: GeneratorState = {
          colors: [
            createColorEntry('Primary', 'oklch(0.64 0.142 329)', {
              chromaCurve: { low: 0.2, high: 0.85 },
            }),
          ],
          globalOptions: getDefaultGlobalOptions(base),
        };
        const url = serializePaletteToUrl(state);

        expect(url).toContain('c:0.2_0.85');
        expect(parsePaletteFromUrl(url)!.state.colors[0].overrides).toEqual({
          chromaCurve: { low: 0.2, high: 0.85 },
        });
      });
    });

    it('canonicalizeUrl preserves curve shapes', () => {
      // Keys serialize in OPTION_KEYS order: c, h, f.
      const url = '/p/Primary-64_0.142_329?c=p0.6_0.35&h=-15_20&f=1.5_1';

      expect(canonicalizeUrl(url)).toBe(url);
    });
  });

  describe('numeric option validation', () => {
    // Defaults for the exact color the test URLs use (saturation default is color-derived).
    const baseDefaults = parsePaletteFromUrl('/p/Primary-FF0044')!.state.globalOptions;

    const parseGlobal = (query: string) =>
      parsePaletteFromUrl(`/p/Primary-FF0044?${query}`)!.state.globalOptions;
    const parseOverrides = (path: string) =>
      parsePaletteFromUrl(`/p/Primary-FF0044-${path}`)!.state.colors[0].overrides;

    describe('scalar range (query) — out of range drops to default', () => {
      it.each(['i=99999', 'i=0', 'i=2'])('drops steps %s', query => {
        expect(parseGlobal(query).steps).toBe(baseDefaults.steps);
      });

      it('drops out-of-range saturation, maxLightness, minLightness', () => {
        expect(parseGlobal('s=999').saturation).toBe(baseDefaults.saturation);
        expect(parseGlobal('x=5').maxLightness).toBe(baseDefaults.maxLightness);
        expect(parseGlobal('n=-2').minLightness).toBe(baseDefaults.minLightness);
      });

      it('keeps valid scalars', () => {
        const result = parseGlobal('i=15&x=0.9&n=0.1&s=42');

        expect(result.steps).toBe(15);
        expect(result.maxLightness).toBe(0.9);
        expect(result.minLightness).toBe(0.1);
        expect(result.saturation).toBe(42);
      });
    });

    describe('scalar range (per-color path)', () => {
      it.each(['i:99999', 'x:5', 'n:-2'])('drops out-of-range override %s', chunk => {
        expect(parseOverrides(chunk)).toEqual({});
      });

      it('keeps a valid override', () => {
        expect(parseOverrides('x:0.95')).toEqual({ maxLightness: 0.95 });
      });
    });

    describe('lightness inversion (minLightness < maxLightness)', () => {
      it.each(['n=0.9&x=0.1', 'x=0.1', 'n=0.99'])(
        'reverts inverted global %s to defaults',
        query => {
          const result = parseGlobal(query);

          expect(result.minLightness).toBe(baseDefaults.minLightness);
          expect(result.maxLightness).toBe(baseDefaults.maxLightness);
          expect(result.minLightness).toBeLessThan(result.maxLightness as number);
        },
      );

      it.each(['n:0.9,x:0.1', 'x:0.1'])('reverts an inverted per-color override %s', chunk => {
        expect(parseOverrides(chunk)).toEqual({});
      });
    });

    describe('curve slider ranges', () => {
      it.each(['f=999', 'f=0.05', 'f=0.05_2'])(
        'drops lightnessCurve outside [0.1, 5] %s',
        query => {
          expect(parseGlobal(query).lightnessCurve).toBe(baseDefaults.lightnessCurve);
        },
      );

      it('keeps valid lightnessCurve (scalar + range)', () => {
        expect(parseGlobal('f=2.5').lightnessCurve).toBe(2.5);
        expect(parseGlobal('f=0.5_2').lightnessCurve).toEqual({ low: 0.5, high: 2 });
      });

      it.each(['c=p0.5_0.005', 'c=p0.5_0.995'])(
        'drops chromaPeak outside [0.01, 0.99] %s',
        query => {
          expect(parseGlobal(query).chromaCurve).toBe(baseDefaults.chromaCurve);
        },
      );

      it('keeps a valid chromaPeak', () => {
        expect(parseGlobal('c=p0.5_0.35').chromaCurve).toEqual({ amount: 0.5, peak: 0.35 });
      });
    });

    it('rounds fractional steps to an integer', () => {
      expect(parseGlobal('i=11.5').steps).toBe(12);
      expect(parseGlobal('i=11.4').steps).toBe(11);
    });

    describe('lock validity (must be a valid step key)', () => {
      const validLock = getScaleStepKeys(baseDefaults.steps)[1];

      it('drops an invalid global lock', () => {
        expect(parseGlobal('k=999').lock).toBeUndefined();
      });

      it('drops an invalid per-color lock', () => {
        expect(parseOverrides('k:999')).toEqual({});
      });

      it('keeps a valid lock', () => {
        expect(parseGlobal(`k=${validLock}`).lock).toBe(validLock);
      });
    });

    it('never lets a malicious URL throw in scale()', () => {
      for (const query of ['x=5', 'n=0.9&x=0.1', 'x=0.1', 'i=99999', 'f=999', 'k=999']) {
        const { colors, globalOptions } = parsePaletteFromUrl(`/p/Primary-FF0044?${query}`)!.state;

        for (const color of colors) {
          expect(() => scale(color.value, { ...globalOptions, ...color.overrides })).not.toThrow();
        }
      }
    });

    it('self-heals the URL on load (bad params stripped)', () => {
      for (const query of ['x=5', 'n=0.9&x=0.1', 'i=99999', 'f=999', 'k=999']) {
        const out = canonicalizeUrl(`/p/Primary-FF0044?${query}`);
        const shortKey = query.split('&')[0].split('=')[0];

        expect(out).not.toContain(`${shortKey}=`);
      }
    });

    it('round-trips valid options unchanged', () => {
      const state: GeneratorState = {
        colors: [oklchEntry('Primary', '#ff0044')],
        globalOptions: {
          ...baseDefaults,
          steps: 15,
          saturationOverride: true,
          saturation: 25,
          minLightness: 0.3,
          maxLightness: 0.8,
        },
      };

      expect(parsePaletteFromUrl(serializePaletteToUrl(state))!.state.globalOptions).toEqual(
        state.globalOptions,
      );
    });
  });
});
