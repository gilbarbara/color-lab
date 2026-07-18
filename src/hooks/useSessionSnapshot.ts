'use client';

import { useEffect, useRef } from 'react';

import { IDLE_SESSION_MS } from '~/config/globals';
import { useGeneratorStoreApi } from '~/hooks/useGeneratorStore';
import { useAppStore } from '~/stores/appStore';
import { useAuthStore } from '~/stores/authStore';
import { trackEvent } from '~/utils/analytics';
import { buildSessionSnapshotProps, isEngagedSession } from '~/utils/sessionSnapshot';

/**
 * Emits the `app:session` snapshot — the settled config + persistent UI state read at leave
 * (`pagehide` / tab hidden) with a long-idle backstop that re-arms on each edit. Gated to
 * engaged sessions and deduped on the emitted payload so leave + idle (or repeated hides)
 * don't double-send; a session that rests on several distinct configs emits one per config
 * (collapse per session in PostHog). Must run inside GeneratorStoreProvider (holds the
 * generator store api).
 */
export default function useSessionSnapshot() {
  const generatorStoreApi = useGeneratorStoreApi();
  const lastSignature = useRef<string | null>(null);

  useEffect(() => {
    const capture = () => {
      const generator = generatorStoreApi.getState();

      if (!isEngagedSession(generator)) {
        return;
      }

      const props = buildSessionSnapshotProps(generator, useAppStore.getState(), {
        isAuthenticated: useAuthStore.getState().status === 'authenticated',
        isDark: document.documentElement.classList.contains('dark'),
      });

      const signature = JSON.stringify(props);

      if (signature === lastSignature.current) {
        return;
      }

      lastSignature.current = signature;
      trackEvent('app:session', props);
    };

    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const armIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(capture, IDLE_SESSION_MS);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        capture();
      }
    };

    // pagehide is the reliable leave signal (incl. mobile bfcache); beforeunload is not.
    window.addEventListener('pagehide', capture);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Re-arm the idle backstop on every store commit; a truly quiet window fires once.
    const unsubscribe = generatorStoreApi.subscribe(armIdle);

    armIdle();

    return () => {
      window.removeEventListener('pagehide', capture);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      unsubscribe();
      clearTimeout(idleTimer);
    };
  }, [generatorStoreApi]);
}
