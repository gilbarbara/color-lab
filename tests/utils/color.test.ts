import { DELTA_E_JND, deltaE } from 'colorizr';

import { BLACK, BLUE, CRIMSON, GRAY, GREEN, PLUM, RED, WHITE } from '~/test-fixtures';
import {
  formatOklch,
  formatOklchUrl,
  getChromaAsPercentage,
  getRandomColor,
  isInRangeOklch,
  isValidColorValue,
  rotateOklchHue,
  toOklch,
} from '~/utils/color';

import type { OklchString } from '~/types';

describe('utils/color', () => {
  describe('formatOklch', () => {
    it.each([
      { input: 'oklch(59.987% 0 none)', result: 'oklch(59.99% 0 none)' },
      { input: 'oklch(74.031% 0.17379 300.54)', result: 'oklch(74.03% 0.174 300.54)' },
      { input: 'oklch(78.968% 0.22992 326.81)', result: 'oklch(78.97% 0.230 326.81)' },
      { input: 'oklch(71.269% 0.21319 351.61)', result: 'oklch(71.27% 0.213 351.61)' },
      { input: 'oklch(69.161% 0.19827 22.548)', result: 'oklch(69.16% 0.198 22.55)' },
      { input: 'oklch(80.674% 0.13709 61.337)', result: 'oklch(80.67% 0.137 61.34)' },
      { input: 'oklch(96.326% 0.17471 107.88)', result: 'oklch(96.33% 0.175 107.88)' },
      { input: 'oklch(91.813% 0.20714 131.28)', result: 'oklch(91.81% 0.207 131.28)' },
      { input: 'oklch(88.393% 0.24379 142.82)', result: 'oklch(88.39% 0.244 142.82)' },
      { input: 'oklch(89.423% 0.18067 156.63)', result: 'oklch(89.42% 0.181 156.63)' },
      { input: 'oklch(91.536% 0.13373 192.73)', result: 'oklch(91.54% 0.134 192.73)' },
    ])('round-trips %s within JND', ({ input, result }) => {
      const display = formatOklch(input);

      expect(display).toBe(result);
      expect(deltaE(input, display)).toBeLessThan(DELTA_E_JND);
    });
  });

  describe('formatOklchUrl', () => {
    it('formats with L_C_H using shared precision', () => {
      expect(formatOklchUrl('oklch(63.6% 0.291 29.23)')).toBe('63.6_0.291_29.23');
    });

    it('returns plain "0" for chromatic-zero (no "none" wrapper)', () => {
      expect(formatOklchUrl('oklch(50% 0 0)')).toBe('50_0_0');
    });

    it('rounds at 2/3/2 decimals (L/C/H)', () => {
      expect(formatOklchUrl({ l: 0.74031, c: 0.17379, h: 300.547 })).toBe('74.03_0.174_300.55');
    });

    it('accepts OklchValues object directly', () => {
      expect(formatOklchUrl({ l: 0.5, c: 0.1, h: 120 })).toBe('50_0.1_120');
    });
  });

  describe('getChromaAsPercentage', () => {
    it('returns 0 for achromatic colors', () => {
      expect(getChromaAsPercentage(BLACK)).toBe(0);
      expect(getChromaAsPercentage(GRAY)).toBe(0);
      expect(getChromaAsPercentage(WHITE)).toBe(0);
    });

    it('returns correct percentage for primary colors', () => {
      expect(getChromaAsPercentage(RED)).toBe(97.9);
      expect(getChromaAsPercentage(GREEN)).toBe(98.2);
      expect(getChromaAsPercentage(BLUE)).toBe(97.3);
    });

    it('returns correct percentage for arbitrary oklch values', () => {
      expect(getChromaAsPercentage('oklch(0.7 0.1 120)' as OklchString)).toBe(51.6);
      expect(getChromaAsPercentage('oklch(0.6 0.15 30)' as OklchString)).toBe(55.8);
      expect(getChromaAsPercentage('oklch(77.494% 0.18927 73.308)' as OklchString)).toBe(100);
    });
  });

  describe('getRandomColor', () => {
    it('returns an OKLCH color string', () => {
      const color = getRandomColor();

      expect(typeof color).toBe('string');
      expect(color).toMatch(/^oklch\(/);
    });

    it('returns an OKLCH color string with saturation param', () => {
      const color = getRandomColor(75);

      expect(typeof color).toBe('string');
      expect(color).toMatch(/^oklch\(/);
    });
  });

  describe('isInRangeOklch', () => {
    it('accepts values within OKLCH ranges', () => {
      expect(isInRangeOklch({ l: 0.5, c: 0.1, h: 200 })).toBe(true);
      expect(isInRangeOklch({ l: 0, c: 0, h: 0 })).toBe(true);
      expect(isInRangeOklch({ l: 1, c: 0.4, h: 359 })).toBe(true);
    });

    it('rejects lightness out of [0, 1]', () => {
      expect(isInRangeOklch({ l: 1.649, c: 0.24, h: 300 })).toBe(false);
      expect(isInRangeOklch({ l: -0.1, c: 0.1, h: 100 })).toBe(false);
    });

    it('rejects negative chroma', () => {
      expect(isInRangeOklch({ l: 0.5, c: -0.1, h: 100 })).toBe(false);
    });

    it('rejects non-finite values', () => {
      expect(isInRangeOklch({ l: Number.NaN, c: 0.1, h: 100 })).toBe(false);
      expect(isInRangeOklch({ l: 0.5, c: Number.POSITIVE_INFINITY, h: 100 })).toBe(false);
    });
  });

  describe('isValidColorValue', () => {
    it('accepts valid hex', () => {
      expect(isValidColorValue('#FF0044')).toBe(true);
      expect(isValidColorValue('#abc')).toBe(true);
    });

    it('accepts valid OKLCH string', () => {
      expect(isValidColorValue('oklch(0.7 0.2 120)')).toBe(true);
      expect(isValidColorValue('oklch(70% 0.2 120)')).toBe(true);
    });

    it('accepts valid rgb/hsl strings', () => {
      expect(isValidColorValue('rgb(255, 0, 68)')).toBe(true);
      expect(isValidColorValue('hsl(344, 100%, 50%)')).toBe(true);
    });

    it('rejects OKLCH with lightness > 100%', () => {
      expect(isValidColorValue('oklch(164.9% 0.24196 300.54)')).toBe(false);
    });

    it('rejects bad syntax', () => {
      expect(isValidColorValue('invalid')).toBe(false);
      expect(isValidColorValue('')).toBe(false);
      expect(isValidColorValue('#GGGGGG')).toBe(false);
    });

    it('rejects OKLCH the underlying parser throws on (negative L, big H, negative C)', () => {
      expect(isValidColorValue('oklch(-10% 0.1 100)')).toBe(false);
      expect(isValidColorValue('oklch(50% 0.1 9999)')).toBe(false);
      expect(isValidColorValue('oklch(50% -0.1 100)')).toBe(false);
    });
  });

  describe('rotateOklchHue', () => {
    it('rotates hue by positive delta', () => {
      const result = rotateOklchHue('oklch(50% 0.1 30)' as OklchString, 30);

      expect(result).toMatch(/oklch\(50% 0\.1(00)? 60(\.\d+)?\)/);
    });

    it('wraps past 360', () => {
      const result = rotateOklchHue('oklch(50% 0.1 350)' as OklchString, 30);

      expect(result).toMatch(/oklch\(50% 0\.1(00)? 20(\.\d+)?\)/);
    });

    it('wraps negative delta below 0', () => {
      const result = rotateOklchHue('oklch(50% 0.1 10)' as OklchString, -30);

      expect(result).toMatch(/oklch\(50% 0\.1(00)? 340(\.\d+)?\)/);
    });

    it('preserves L and C unchanged', () => {
      const result = rotateOklchHue('oklch(63.6% 0.291 29.23)' as OklchString, 30);

      expect(result).toContain('63.6%');
      expect(result).toContain('0.291');
    });

    it('360 rotation is identity (modulo precision)', () => {
      const input = 'oklch(50% 0.1 120)' as OklchString;
      const result = rotateOklchHue(input, 360);

      expect(result).toBe(formatOklch(input));
    });
  });

  describe('toOklch', () => {
    it('returns canonical OKLCH for hex input', () => {
      expect(toOklch('#FF0044')).toBe(CRIMSON);
    });

    it('returns canonical OKLCH for oklch input', () => {
      expect(toOklch('oklch(70.2% 0.196 300)')).toBe(PLUM);
    });

    it('throws on L > 100% (parser silent-pass case)', () => {
      expect(() => toOklch('oklch(150% 0.1 100)')).toThrow(/out of OKLCH range/);
    });

    it('throws on negative L', () => {
      expect(() => toOklch('oklch(-10% 0.1 100)')).toThrow();
    });

    it('throws on invalid CSS', () => {
      expect(() => toOklch('garbage')).toThrow();
    });
  });
});
