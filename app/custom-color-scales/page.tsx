import type { Metadata } from 'next';

import { buildStaticMetadata } from '~/utils/metadata';

import CustomColorScales from './CustomColorScales';

export const metadata: Metadata = buildStaticMetadata({
  title: "Custom Color Scales That Don't Look Generated",
  description:
    'Shape color scales in OKLCH: control lightness range, lightness and chroma curves, and hue shift to build palettes with character — not flat, generated tints.',
  path: '/custom-color-scales',
  ogImage: '/og-custom-color-scales.png',
});

export default function CustomColorScalesPage() {
  return <CustomColorScales />;
}
