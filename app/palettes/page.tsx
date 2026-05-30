import type { Metadata } from 'next';

import Palettes from '~/containers/Palettes';

export const metadata: Metadata = {
  title: 'My palettes',
  description: 'View and manage your saved color palettes in ColorMeUp LAB.',
  alternates: { canonical: '/palettes' },
  robots: { index: false, follow: false },
};

export default function PalettesPage() {
  return <Palettes />;
}
