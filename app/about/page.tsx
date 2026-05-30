import type { Metadata } from 'next';

import About from './About';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Open-source design tool for creating perceptual color scales in OKLCH, with control over lightness, chroma, steps, and curves.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return <About />;
}
