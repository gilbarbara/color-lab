import type { Metadata } from 'next';

import { buildStaticMetadata } from '~/utils/metadata';

import Terms from './Terms';

export const metadata: Metadata = buildStaticMetadata({
  title: 'Terms of service',
  description:
    'Terms of service for ColorMeUp LAB — a free, open-source tool for creating and saving perceptual color palettes.',
  path: '/terms',
});

export default function TermsPage() {
  return <Terms />;
}
