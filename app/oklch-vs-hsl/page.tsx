import type { Metadata } from 'next';

import { buildStaticMetadata } from '~/utils/metadata';

import OklchVsHsl from './OklchVsHsl';

export const metadata: Metadata = buildStaticMetadata({
  title: 'OKLCH vs HSL: why perceptual color wins',
  description:
    'Why OKLCH beats HSL for color scales: see perceptual lightness, hue stability, and clean gradients compared side by side — interactive demos.',
  path: '/oklch-vs-hsl',
  ogImage: '/og-oklch-vs-hsl.png',
});

export default function OklchVsHslPage() {
  return <OklchVsHsl />;
}
