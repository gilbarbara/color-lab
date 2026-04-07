import { getChromaAsPercentage, getRandomColor } from '~/utils/color';

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
});
