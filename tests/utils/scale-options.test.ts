import { round } from '@gilbarbara/helpers';

import { GREEN, WHITE } from '~/test-fixtures';
import {
  getChromaCurveMode,
  getChromaFraction,
  getHueShiftMode,
  getLightnessCurveMode,
  isSameOptionValue,
  lightnessAt,
  normalizeChromaCurve,
  normalizeHueShift,
  normalizeLightnessCurve,
  parabolicScale,
} from '~/utils/scale-options';

describe('utils/scale-options', () => {
  describe('getChromaCurveMode', () => {
    it.each([
      // The parabola family (scalar + movable peak) shares the Uniform tab.
      [0, 'scalar'],
      [0.5, 'scalar'],
      [{ amount: 0.6, peak: 0.3 }, 'scalar'],
      [{ amount: 0.6 }, 'scalar'],
      [{ low: 0.2, high: 0.85 }, 'range'],
    ])('%o → %s', (value, expected) => {
      expect(getChromaCurveMode(value as never)).toBe(expected);
    });
  });

  describe('getChromaFraction', () => {
    it('0 for an achromatic color', () => {
      expect(getChromaFraction(WHITE)).toBe(0);
    });

    it('a chromatic color is within (0, 1] and rounded (no float junk)', () => {
      const fraction = getChromaFraction(GREEN);

      expect(fraction).toBeGreaterThan(0);
      expect(fraction).toBeLessThanOrEqual(1);
      expect(fraction).toBe(round(fraction, 2));
    });
  });

  describe('getHueShiftMode', () => {
    it.each([
      [0, 'scalar'],
      [15, 'scalar'],
      [{ low: -15, high: 20 }, 'range'],
    ])('%o → %s', (value, expected) => {
      expect(getHueShiftMode(value as never)).toBe(expected);
    });
  });

  describe('getLightnessCurveMode', () => {
    it.each([
      [1.3, 'scalar'],
      [{ low: 1.5, high: 1 }, 'range'],
    ])('%o → %s', (value, expected) => {
      expect(getLightnessCurveMode(value as never)).toBe(expected);
    });
  });

  describe('isSameOptionValue', () => {
    it('number vs number', () => {
      expect(isSameOptionValue(1.3, 1.3)).toBe(true);
      expect(isSameOptionValue(1.3, 1.4)).toBe(false);
    });

    it('number vs object is never equal (shape is the mode)', () => {
      expect(isSameOptionValue(1.3, { low: 1.3, high: 1.3 })).toBe(false);
      expect(isSameOptionValue({ low: 1.3, high: 1.3 }, 1.3)).toBe(false);
    });

    it('range field-wise', () => {
      expect(isSameOptionValue({ low: 1, high: 2 }, { low: 1, high: 2 })).toBe(true);
      expect(isSameOptionValue({ low: 1, high: 2 }, { low: 1, high: 3 })).toBe(false);
    });

    it('peak field-wise with default peak', () => {
      expect(isSameOptionValue({ amount: 0.6 }, { amount: 0.6, peak: 0.5 })).toBe(true);
      expect(isSameOptionValue({ amount: 0.6, peak: 0.3 }, { amount: 0.6, peak: 0.5 })).toBe(false);
    });

    it('peak vs range objects are not equal', () => {
      expect(isSameOptionValue({ amount: 0.6 }, { low: 0.6, high: 0.6 })).toBe(false);
    });

    it('primitives and undefined', () => {
      expect(isSameOptionValue(undefined, undefined)).toBe(true);
      expect(isSameOptionValue('light', 'light')).toBe(true);
      expect(isSameOptionValue('light', 'dark')).toBe(false);
    });
  });

  describe('lightnessAt', () => {
    it('symmetric range equals scalar exponent', () => {
      const range = { low: 1.5, high: 1.5 };

      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        const expected = 0.97 - (0.97 - 0.26) * t ** 1.5;

        expect(lightnessAt(t, range, 0.26, 0.97)).toBeCloseTo(expected, 10);
      }
    });

    it('hits the bounds at the ends', () => {
      expect(lightnessAt(0, { low: 1.3, high: 1 }, 0.26, 0.97)).toBeCloseTo(0.97, 10);
      expect(lightnessAt(1, { low: 1.3, high: 1 }, 0.26, 0.97)).toBeCloseTo(0.26, 10);
    });
  });

  describe('normalizeChromaCurve', () => {
    it('scalar → parabola at 0.5', () => {
      expect(normalizeChromaCurve(0.6)).toEqual({ amount: 0.6, peak: 0.5, type: 'parabola' });
    });

    it('peak without explicit peak defaults to 0.5', () => {
      expect(normalizeChromaCurve({ amount: 0.6 })).toEqual({
        amount: 0.6,
        peak: 0.5,
        type: 'parabola',
      });
    });

    it('peak with explicit peak', () => {
      expect(normalizeChromaCurve({ amount: 0.6, peak: 0.35 })).toEqual({
        amount: 0.6,
        peak: 0.35,
        type: 'parabola',
      });
    });

    it('range → range', () => {
      expect(normalizeChromaCurve({ low: 0.2, high: 0.85 })).toEqual({
        high: 0.85,
        low: 0.2,
        type: 'range',
      });
    });
  });

  describe('normalizeHueShift', () => {
    it('scalar x → { low: -x, high: x } (symmetric)', () => {
      expect(normalizeHueShift(15)).toEqual({ low: -15, high: 15 });
    });

    it('passes a range through', () => {
      expect(normalizeHueShift({ low: -15, high: 20 })).toEqual({ low: -15, high: 20 });
    });
  });

  describe('normalizeLightnessCurve', () => {
    it('scalar x → { low: x, high: x }', () => {
      expect(normalizeLightnessCurve(1.3)).toEqual({ low: 1.3, high: 1.3 });
    });

    it('passes a range through', () => {
      expect(normalizeLightnessCurve({ low: 1.5, high: 1 })).toEqual({ low: 1.5, high: 1 });
    });
  });

  describe('parabolicScale', () => {
    it('amount 0 returns full multiplier', () => {
      expect(parabolicScale(0.3, 0, 0.5)).toBe(1);
    });

    it('peak 0.5 reduces toward the extremes', () => {
      expect(parabolicScale(0.5, 1, 0.5)).toBeCloseTo(1, 10);
      expect(parabolicScale(0, 1, 0.5)).toBeCloseTo(0, 10);
      expect(parabolicScale(1, 1, 0.5)).toBeCloseTo(0, 10);
    });

    it('movable peak keeps full chroma at the peak lightness', () => {
      expect(parabolicScale(0.35, 1, 0.35)).toBeCloseTo(1, 10);
    });
  });
});
