import type { Metadata } from 'next';

import Terms from './Terms';

export const metadata: Metadata = {
  title: 'Terms of service',
  description:
    'Terms of service for ColorMeUp LAB — a free, open-source tool for creating and saving perceptual color palettes.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return <Terms />;
}
