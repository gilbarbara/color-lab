import { DEFAULT_PALETTE_NAME } from '~/config/globals';
import { SITE_NAME, SITE_OG_IMAGE } from '~/config/metadata';
import { createColorEntry, CRIMSON, ORANGE } from '~/test-fixtures';
import { buildStaticMetadata, getPaletteMeta } from '~/utils/metadata';

describe('utils/metadata', () => {
  describe('buildStaticMetadata', () => {
    it('builds a full metadata block with brand-suffixed og/twitter titles', () => {
      expect(
        buildStaticMetadata({ title: 'About', description: 'About us.', path: '/about' }),
      ).toStrictEqual({
        title: 'About',
        description: 'About us.',
        alternates: { canonical: '/about' },
        openGraph: {
          type: 'website',
          siteName: SITE_NAME,
          title: `About — ${SITE_NAME}`,
          description: 'About us.',
          url: '/about',
          images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: `About — ${SITE_NAME}` }],
        },
        twitter: {
          card: 'summary_large_image',
          title: `About — ${SITE_NAME}`,
          description: 'About us.',
          images: [SITE_OG_IMAGE],
        },
      });
    });

    it('defaults the og/twitter image to the brand image', () => {
      const meta = buildStaticMetadata({
        title: 'About',
        description: 'About us.',
        path: '/about',
      });

      expect(meta.openGraph?.images).toStrictEqual([
        { url: SITE_OG_IMAGE, width: 1200, height: 630, alt: `About — ${SITE_NAME}` },
      ]);
      expect(meta.twitter?.images).toStrictEqual([SITE_OG_IMAGE]);
    });

    it('uses a custom ogImage in both og and twitter images when provided', () => {
      const meta = buildStaticMetadata({
        title: 'OKLCH vs HSL',
        description: 'Perceptual color.',
        path: '/oklch-vs-hsl',
        ogImage: '/og-oklch-vs-hsl.png',
      });

      expect(meta.openGraph?.images).toStrictEqual([
        {
          url: '/og-oklch-vs-hsl.png',
          width: 1200,
          height: 630,
          alt: `OKLCH vs HSL — ${SITE_NAME}`,
        },
      ]);
      expect(meta.twitter?.images).toStrictEqual(['/og-oklch-vs-hsl.png']);
    });

    it('omits robots when not provided', () => {
      const meta = buildStaticMetadata({
        title: 'About',
        description: 'About us.',
        path: '/about',
      });

      expect(meta).not.toHaveProperty('robots');
    });

    it('includes robots when provided', () => {
      const meta = buildStaticMetadata({
        title: 'Palettes',
        description: 'Saved palettes.',
        path: '/palettes',
        robots: { index: false },
      });

      expect(meta.robots).toStrictEqual({ index: false });
    });
  });

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

    it('uses a non-default name as the title', () => {
      const colors = [createColorEntry('Primary', CRIMSON), createColorEntry('Accent', ORANGE)];

      expect(getPaletteMeta(colors, 'Sunset')).toStrictEqual({
        title: 'Sunset',
        description: 'Color palette with 2 colors: Primary, Accent.',
      });
    });

    it('ignores the default name and falls back to color names', () => {
      const colors = [createColorEntry('Primary', CRIMSON), createColorEntry('Accent', ORANGE)];

      expect(getPaletteMeta(colors, DEFAULT_PALETTE_NAME)).toStrictEqual({
        title: 'Primary, Accent',
        description: 'Color palette with 2 colors: Primary, Accent.',
      });
    });

    it('uses a non-default name even when there are no colors', () => {
      expect(getPaletteMeta([], 'Sunset')).toStrictEqual({
        title: 'Sunset',
        description: 'Color palette with 0 colors: .',
      });
    });
  });
});
