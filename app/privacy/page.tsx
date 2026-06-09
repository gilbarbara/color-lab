import type { Metadata } from 'next';

import { buildStaticMetadata } from '~/utils/metadata';

import Privacy from './Privacy';

export const metadata: Metadata = buildStaticMetadata({
  title: 'Privacy policy',
  description:
    'How ColorMeUp LAB collects, uses, and protects your data. Firebase authentication, privacy-focused analytics, no advertising or profiling.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return <Privacy />;
}
