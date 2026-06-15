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
