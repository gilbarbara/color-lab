import {
  getChromaAsPercentage,
  getRandomColor,
  isInRangeOklch,
  isValidColorValue,
} from '~/utils/color';

describe('utils/color', () => {
  describe('getChromaAsPercentage', () => {
    it('returns 0 for achromatic colors', () => {
      expect(getChromaAsPercentage('#808080')).toBe(0);
      expect(getChromaAsPercentage('oklch(0.5 0 0)')).toBe(0);
    });

    it('returns correct percentage for hex colors', () => {
      expect(getChromaAsPercentage('#ff0000')).toBe(89.6);
      expect(getChromaAsPercentage('#00ff00')).toBe(89.2);
      expect(getChromaAsPercentage('#0000ff')).toBe(100);
    });

    it('returns correct percentage for oklch colors', () => {
      expect(getChromaAsPercentage('oklch(0.7 0.1 120)')).toBe(51.6);
      expect(getChromaAsPercentage('oklch(0.6 0.15 30)')).toBe(55.8);
      expect(getChromaAsPercentage('oklch(77.494% 0.18927 73.308)')).toBe(100);
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
});
