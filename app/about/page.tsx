import type { Metadata } from 'next';

import { buildStaticMetadata } from '~/utils/metadata';

import About from './About';

export const metadata: Metadata = buildStaticMetadata({
  title: 'About',
  description:
    'Open-source OKLCH color scale generator: lightness, chroma, hue and curve control, WCAG & APCA contrast checks, and export to Tailwind, CSS, SCSS and SVG.',
  path: '/about',
});

export default function AboutPage() {
  return <About />;
}
