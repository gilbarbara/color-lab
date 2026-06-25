import { scale } from 'colorizr';

import { CRIMSON, CRIMSON_DARK, CRIMSON_LIGHT } from '~/test-fixtures';
import { getDefaultGlobalOptions, getEffectiveOptions } from '~/utils/generator';
import { buildPreviewScope } from '~/utils/preview-tokens';

import type { ColorEntry, OklchString } from '~/types';

function optionsFor(value: OklchString) {
  const color: ColorEntry = { id: '1', name: 'Crimson', value };

  return getEffectiveOptions(color, getDefaultGlobalOptions(value));
}

describe('utils/preview-tokens', () => {
  describe('buildPreviewScope', () => {
    it('builds a forced light scope', () => {
      expect(buildPreviewScope(CRIMSON, optionsFor(CRIMSON), 'light')).toMatchSnapshot();
    });

    it('builds a forced dark scope', () => {
      expect(buildPreviewScope(CRIMSON, optionsFor(CRIMSON), 'dark')).toMatchSnapshot();
    });

    it('locks very light colors (l >= 0.9) to the dark scale on both slots', () => {
      expect(buildPreviewScope(CRIMSON_LIGHT, optionsFor(CRIMSON_LIGHT))).toMatchSnapshot();
    });

    it('locks very dark colors (l <= 0.3) to the light scale on both slots', () => {
      expect(buildPreviewScope(CRIMSON_DARK, optionsFor(CRIMSON_DARK))).toMatchSnapshot();
    });

    it('splits mid-lightness colors into distinct light and dark scales', () => {
      expect(buildPreviewScope(CRIMSON, optionsFor(CRIMSON))).toMatchSnapshot();
    });

    it('uses the scale 500 (matching the swatch row) as the primary token', () => {
      const options = optionsFor(CRIMSON);
      const scope = buildPreviewScope(CRIMSON, options) as Record<string, string>;

      // The primary is the scale's real 500 stop — the same value the palette swatch row renders.
      expect(scope['--color-preview-light-oklch']).toBe(scope['--color-preview-500-light-oklch']);
      expect(scope['--color-preview-light-oklch']).toBe(scale(CRIMSON, options)[500]);
    });

    it('mirrors the palette step count instead of forcing 10', () => {
      // Default options use 11 steps, so the emitted grid carries a 950 stop (a fixed 10-stop grid
      // would not).
      const scope = buildPreviewScope(CRIMSON, optionsFor(CRIMSON)) as Record<string, string>;

      expect(scope['--color-preview-950-light-oklch']).toBeDefined();
    });

    it('honors the entry lock: the locked stop pins the input, primary stays the 500 stop', () => {
      const scope = buildPreviewScope(CRIMSON, {
        ...optionsFor(CRIMSON),
        lock: 300,
      }) as Record<string, string>;

      // Locked at 300, that stop holds the input color; the primary is still the 500 stop.
      expect(scope['--color-preview-300-light-oklch']).toBe(CRIMSON);
      expect(scope['--color-preview-light-oklch']).toBe(scope['--color-preview-500-light-oklch']);
    });

    it('applies advanced scale options (curves/hue) to the emitted tokens', () => {
      const base = buildPreviewScope(CRIMSON, optionsFor(CRIMSON));
      const tuned = buildPreviewScope(CRIMSON, {
        ...optionsFor(CRIMSON),
        chromaCurve: 0.6,
        hueShift: 30,
        lightnessCurve: { high: 1.1, low: 1.8 },
      });

      expect(tuned).not.toEqual(base);
    });
  });
});
