import type { Metadata } from 'next';

import { buildStaticMetadata } from '~/utils/metadata';

import ApcaVsWcag from './ApcaVsWcag';

export const metadata: Metadata = buildStaticMetadata({
  title: 'APCA vs WCAG: black or white text?',
  description:
    'WCAG 2 and APCA pick different text colors for a wide band of mid-tone backgrounds. See both picks side by side and judge with your own eyes.',
  path: '/apca-vs-wcag',
  ogImage: '/og-apca-vs-wcag.png',
});

export default function ApcaVsWcagPage() {
  return <ApcaVsWcag />;
}
