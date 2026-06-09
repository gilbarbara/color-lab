import type { Metadata } from 'next';

import { buildStaticMetadata } from '~/utils/metadata';

import Palettes from '~/containers/Palettes';

export const metadata: Metadata = buildStaticMetadata({
  title: 'My palettes',
  description: 'View and manage your saved color palettes in ColorMeUp LAB.',
  path: '/palettes',
  robots: { index: false, follow: false },
});

export default function PalettesPage() {
  return <Palettes />;
}
