import { CRIMSON, CRIMSON_DARK, CRIMSON_LIGHT } from '~/test-fixtures';
import { buildPreviewScope } from '~/utils/preview-tokens';

describe('utils/preview-tokens', () => {
  describe('buildPreviewScope', () => {
    it('builds a forced light scope', () => {
      expect(buildPreviewScope(CRIMSON, 'light')).toMatchSnapshot();
    });

    it('builds a forced dark scope', () => {
      expect(buildPreviewScope(CRIMSON, 'dark')).toMatchSnapshot();
    });

    it('locks very light colors (l >= 0.9) to the dark scale on both slots', () => {
      expect(buildPreviewScope(CRIMSON_LIGHT)).toMatchSnapshot();
    });

    it('locks very dark colors (l <= 0.3) to the light scale on both slots', () => {
      expect(buildPreviewScope(CRIMSON_DARK)).toMatchSnapshot();
    });

    it('splits mid-lightness colors into distinct light and dark scales', () => {
      expect(buildPreviewScope(CRIMSON)).toMatchSnapshot();
    });
  });
});
