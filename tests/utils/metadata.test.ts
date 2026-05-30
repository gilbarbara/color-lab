import { createColorEntry, CRIMSON, ORANGE } from '~/test-fixtures';
import { getPaletteMeta } from '~/utils/metadata';

describe('utils/metadata', () => {
  describe('getPaletteMeta', () => {
    it('joins names and pluralizes for multiple colors', () => {
      const colors = [createColorEntry('Primary', CRIMSON), createColorEntry('Accent', ORANGE)];

      expect(getPaletteMeta(colors)).toStrictEqual({
        title: 'Primary, Accent',
        description: 'Color palette with 2 colors: Primary, Accent.',
      });
    });

    it('uses the singular for a single color', () => {
      const colors = [createColorEntry('Primary', CRIMSON)];

      expect(getPaletteMeta(colors)).toStrictEqual({
        title: 'Primary',
        description: 'Color palette with 1 color: Primary.',
      });
    });

    it('falls back to "Palette" when there are no colors', () => {
      expect(getPaletteMeta([])).toStrictEqual({
        title: 'Palette',
        description: 'Color palette with 0 colors: .',
      });
    });
  });
});
