import { useBreakpoint } from '@gilbarbara/hooks';
import { cn, Divider } from '@heroui/react';
import { useHead } from '@unhead/react';

import { BREAKPOINTS } from '~/config/globals';
import usePaletteIdSync from '~/hooks/usePaletteIdSync';
import useUrlSync from '~/hooks/useUrlSync';

import Header from './Header';
import Palette from './Palette';
import Sidebar from './Sidebar';

export default function Generator() {
  useHead({
    title: 'ColorMeUp LAB — Perceptual color scales in OKLCH',
    meta: [
      {
        name: 'description',
        content:
          'A design tool for creating and fine-tuning perceptual color scales. Precise control over lightness, chroma, and scale behavior in OKLCH.',
      },
    ],
    link: [{ rel: 'canonical', href: 'https://lab.colormeup.co/' }],
  });

  useUrlSync();
  usePaletteIdSync();

  const { max, min } = useBreakpoint(BREAKPOINTS);
  const isLargeScreen = min('md');
  const isSmallScreen = max('md');

  return (
    <div
      className={cn('flex flex-col md:flex-row flex-1 w-full max-w-432 mx-auto', {
        'pb-18': isSmallScreen,
      })}
      data-testid="Generator"
    >
      {isSmallScreen && (
        <>
          <Header />
          <Divider />
        </>
      )}
      {isLargeScreen && <Sidebar />}
      <Palette showBottomBar={isSmallScreen} />
    </div>
  );
}
