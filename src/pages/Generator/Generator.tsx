import { useBreakpoint } from '@gilbarbara/hooks';
import { cn, Divider } from '@heroui/react';

import { BREAKPOINTS } from '~/config/globals';
import usePaletteIdSync from '~/hooks/usePaletteIdSync';
import useUrlSync from '~/hooks/useUrlSync';

import Header from './Header';
import Palette from './Palette';
import Sidebar from './Sidebar';

export default function Generator() {
  useUrlSync();
  usePaletteIdSync();

  const { max, min } = useBreakpoint(BREAKPOINTS);
  const isLargeScreen = min('md');
  const isSmallScreen = max('md');

  return (
    <div
      className={cn('flex flex-col md:flex-row flex-1 w-full xl:w-7xl max-w-7xl mx-auto', {
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
