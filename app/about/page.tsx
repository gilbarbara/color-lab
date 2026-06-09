import type { Metadata } from 'next';

import { buildStaticMetadata } from '~/utils/metadata';

import About from './About';

export const metadata: Metadata = buildStaticMetadata({
  title: 'About',
  description:
    'Open-source design tool for creating perceptual color scales in OKLCH, with control over lightness, chroma, steps, and curves.',
  path: '/about',
});

export default function AboutPage() {
  return <About />;
}
