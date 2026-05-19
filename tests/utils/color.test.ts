import { BLUE, GRAY, GREEN, RED } from '~/test-fixtures';
import {
  getChromaAsPercentage,
  getRandomColor,
  isInRangeOklch,
  isValidColorValue,
  toOklch,
} from '~/utils/color';

import type { OklchString } from '~/types';

describe('utils/color', () => {
  describe('getChromaAsPercentage', () => {
    it('returns 0 for achromatic colors', () => {
      expect(getChromaAsPercentage(GRAY)).toBe(0);
      expect(getChromaAsPercentage('oklch(0.5 0 0)' as OklchString)).toBe(0);
    });

    it('returns correct percentage for primary colors', () => {
      expect(getChromaAsPercentage(RED)).toBe(89.6);
      expect(getChromaAsPercentage(GREEN)).toBe(89.2);
      expect(getChromaAsPercentage(BLUE)).toBe(100);
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

  describe('toOklch', () => {
    it('returns canonical OKLCH for hex input', () => {
      expect(toOklch('#FF0044')).toBe('oklch(63.269% 0.25404 19.902)');
    });

    it('returns canonical OKLCH for oklch input', () => {
      expect(toOklch('oklch(0.64 0.142 329)')).toBe('oklch(64% 0.142 329)');
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
