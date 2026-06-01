'use client';

import { useBreakpoint, useIsomorphicLayoutEffect } from '@gilbarbara/hooks';

import { BREAKPOINTS } from '~/config/globals';
import useApp from '~/hooks/useApp';

/**
 * Locks the page (body) scroll while the mobile Panel is open. Mounted in the
 * generator layout so it's scoped to `/` and `/p/*` yet stable across navigation
 * between them — `locked` stays true across edit-remounts, so it never toggles.
 *
 * iOS-safe technique: `overflow: hidden` does not lock scroll on iOS Safari, so pin
 * the body with `position: fixed` at the negated offset and restore on unlock.
 */
export default function ScrollLock() {
  const { showBottomBar } = useApp('showBottomBar');
  const { max } = useBreakpoint(BREAKPOINTS);
  const locked = max('md') && showBottomBar;

  useIsomorphicLayoutEffect(() => {
    if (!locked) {
      return undefined;
    }

    const { body } = document;
    const { scrollY } = window;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';

    return () => {
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      window.scrollTo(0, scrollY);
    };
  }, [locked]);

  return null;
}
