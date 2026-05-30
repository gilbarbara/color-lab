import type { Metadata } from 'next';

import Privacy from './Privacy';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'How ColorMeUp LAB collects, uses, and protects your data. Firebase authentication, privacy-focused analytics, no advertising or profiling.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return <Privacy />;
}
