import { useCallback } from 'react';
import { useBreakpoint } from '@gilbarbara/hooks';

import { BREAKPOINTS } from '~/config/ui';

import useApp from './useApp';
import useGenerator from './useGenerator';

const OPEN_ANIMATION_MS = 500;

interface ScrollToColorOptions {
  activate?: boolean;
}

export default function useScrollToColor() {
  const { max } = useBreakpoint(BREAKPOINTS);
  const isSmallScreen = max('md');
  const { setActiveColor } = useGenerator('setActiveColor');
  const { requestColorScroll, showBottomBar, showSidebar, toggleBottomBar, toggleSidebar } = useApp(
    'requestColorScroll',
    'showBottomBar',
    'showSidebar',
    'toggleBottomBar',
    'toggleSidebar',
  );

  return useCallback(
    (id: string, options?: ScrollToColorOptions) => {
      if (options?.activate !== false) setActiveColor(id);

      const needsOpen = isSmallScreen ? !showBottomBar : !showSidebar;

      if (needsOpen) {
        if (isSmallScreen) toggleBottomBar(true);
        else toggleSidebar(true);
        setTimeout(() => requestColorScroll(id), OPEN_ANIMATION_MS);
      } else {
        requestColorScroll(id);
      }
    },
    [
      isSmallScreen,
      requestColorScroll,
      setActiveColor,
      showBottomBar,
      showSidebar,
      toggleBottomBar,
      toggleSidebar,
    ],
  );
}
