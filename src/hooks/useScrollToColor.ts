import { useCallback } from 'react';
import { useBreakpoint } from '@gilbarbara/hooks';

import { BREAKPOINTS, PANEL_TRANSITION_MS } from '~/config/ui';
import { prefersReducedMotion } from '~/utils/motion';

import useApp from './useApp';
import useGenerator from './useGenerator';

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

        // The wait exists only to outlast the panel's open transition before the scroll
        // measures it. Reduced motion flattens that transition, so waiting would just make
        // the accessible path feel slower than the animated one.
        if (prefersReducedMotion()) {
          requestColorScroll(id);
        } else {
          setTimeout(() => requestColorScroll(id), PANEL_TRANSITION_MS);
        }
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
