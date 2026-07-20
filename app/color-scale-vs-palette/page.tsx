import type { Metadata } from 'next';

import { buildStaticMetadata } from '~/utils/metadata';

import ColorScaleVsPalette from './ColorScaleVsPalette';

export const metadata: Metadata = buildStaticMetadata({
  title: 'Color Scale vs Palette: 6 scale generators, compared',
  description:
    'What a color scale is, how it differs from a palette, and how six tools that build one (tints.dev, uicolors, Leonardo, Huetone, hihayk, ColorMeUp Lab) compare.',
  path: '/color-scale-vs-palette',
  ogImage: '/og-color-scale-vs-palette.png',
});

export default function ColorScaleVsPalettePage() {
  return <ColorScaleVsPalette />;
}
