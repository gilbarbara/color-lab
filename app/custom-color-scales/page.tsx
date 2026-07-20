import type { Metadata } from 'next';

import { buildStaticMetadata } from '~/utils/metadata';

import CustomColorScales from './CustomColorScales';

export const metadata: Metadata = buildStaticMetadata({
  title: "Custom Color Scales in OKLCH That Don't Look Generated",
  description:
    'Build custom color scales in OKLCH — shape lightness range, chroma and hue curves for perceptually even palettes, not flat generated tints.',
  path: '/custom-color-scales',
  ogImage: '/og-custom-color-scales.png',
});

export default function CustomColorScalesPage() {
  return <CustomColorScales />;
}
