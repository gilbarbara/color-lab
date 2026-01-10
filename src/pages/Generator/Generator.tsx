import { useBreakpoint } from '@gilbarbara/hooks';
import { cn, Divider } from '@heroui/react';

import useUrlSync from '~/hooks/useUrlSync';

import Header from './Header';
import Palette from './Palette';
import Sidebar from './Sidebar';

export default function Generator() {
  useUrlSync();
  const { max, min } = useBreakpoint();
  const isLargeScreen = min('md');
  const isSmallScreen = max('md');

  return (
    <div
      className={cn('flex flex-col md:flex-row flex-1 w-full xl:w-7xl max-w-7xl mx-auto', {
        'pb-18': isSmallScreen,
      })}
      data-uid="Generator"
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
