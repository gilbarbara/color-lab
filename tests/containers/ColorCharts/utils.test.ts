import {
  getAnchorT,
  parseSteps,
  rangeFractionAt,
  unwrapHues,
} from '~/containers/ColorCharts/utils';

describe('ColorCharts/utils', () => {
  describe('getAnchorT', () => {
    it('middle step when no lock (11 steps)', () => {
      // keys: 50,100,...,950 — index 5 of 10
      expect(getAnchorT(11, undefined)).toBeCloseTo(0.5, 10);
    });

    it('locked step position', () => {
      // lock 50 is the first key → t 0; lock 950 is the last → t 1
      expect(getAnchorT(11, 50)).toBeCloseTo(0, 10);
      expect(getAnchorT(11, 950)).toBeCloseTo(1, 10);
    });

    it('invalid lock falls back to the middle', () => {
      expect(getAnchorT(11, 12345)).toBeCloseTo(0.5, 10);
    });
  });

  describe('parseSteps', () => {
    it('maps each step to OKLCH channels + position t', () => {
      const result = parseSteps({ 50: 'oklch(0.9 0.05 30)', 950: 'oklch(0.3 0.12 30)' });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ label: '50', t: 0 });
      expect(result[0].l).toBeCloseTo(0.9, 5);
      expect(result[0].c).toBeCloseTo(0.05, 5);
      expect(result[0].h).toBeCloseTo(30, 5);
      expect(result[1]).toMatchObject({ label: '950', t: 1 });
    });

    it('anchors a single step at t 0.5', () => {
      const [step] = parseSteps({ 500: 'oklch(0.6 0.1 200)' });

      expect(step).toMatchObject({ label: '500', t: 0.5 });
    });
  });

  describe('rangeFractionAt', () => {
    it('returns mid at the anchor', () => {
      expect(rangeFractionAt(0.5, 0.5, 0.2, 0.6, 0.85)).toBe(0.6);
    });

    it('returns low / high at the ends', () => {
      expect(rangeFractionAt(0, 0.5, 0.2, 0.6, 0.85)).toBeCloseTo(0.2, 10);
      expect(rangeFractionAt(1, 0.5, 0.2, 0.6, 0.85)).toBeCloseTo(0.85, 10);
    });
  });

  describe('unwrapHues', () => {
    it('leaves a sequence within ±180 unchanged', () => {
      expect(unwrapHues([100, 110, 120], 100)).toEqual([100, 110, 120]);
    });

    it('unwraps downward across the 360° boundary', () => {
      // 350 is 340° above the previous 10 → wrap to -10 for a continuous line
      expect(unwrapHues([10, 350], 10)).toEqual([10, -10]);
    });

    it('unwraps upward across the 360° boundary', () => {
      // 10 is 340° below the previous 350 → wrap to 370
      expect(unwrapHues([350, 10], 350)).toEqual([350, 370]);
    });
  });
});
