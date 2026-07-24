import type { Metadata } from 'next';

import { SITE_DESCRIPTION } from '~/config/metadata';
import { buildStaticMetadata } from '~/utils/metadata';

import About from './About';

export const metadata: Metadata = buildStaticMetadata({
  title: 'About',
  description: SITE_DESCRIPTION,
  path: '/about',
});

export default function AboutPage() {
  return <About />;
}
