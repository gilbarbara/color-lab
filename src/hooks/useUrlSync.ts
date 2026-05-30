'use client';

import { useCallback, useEffect, useRef } from 'react';
import { addToast } from '@heroui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { usePaletteStoreApi } from '~/hooks/usePaletteStore';
import { useAppStore } from '~/stores/appStore';
import {
  getPaletteIdFromUrl,
  parsePaletteFromUrl,
  serializePaletteToUrl,
  updatePaletteIdInUrl,
} from '~/utils/url';

import type { PaletteState } from '~/types';

/**
 * Compose the canonical palette URL for `state`, carrying the saved-palette id.
 */
function buildPaletteUrl(state: PaletteState, id: string | null): string {
  return updatePaletteIdInUrl(serializePaletteToUrl(state), id);
}

/**
 * Syncs palette store with URL. Call once in Generator.
 */
export default function useUrlSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paletteStoreApi = usePaletteStoreApi();
  const lastDroppedUrl = useRef<string | null>(null);

  // User-driven commit: push a new history entry for the current palette and
  // mirror it into appStore so the Header logo can return to it this session.
  const commitPaletteUrl = useCallback(
    (state: PaletteState) => {
      const fullUrl = buildPaletteUrl(state, useAppStore.getState().paletteId);

      router.push(fullUrl);
      useAppStore.getState().setSessionPalettePath(fullUrl);
    },
    [router],
  );

  // Hydrate store from URL
  // eslint-disable-next-line sonarjs/cognitive-complexity
  useEffect(() => {
    const searchString = searchParams.toString();
    const search = searchString ? `?${searchString}` : '';
    const currentUrl = `${pathname}${search}`;
    const storeUrl = serializePaletteToUrl(paletteStoreApi.getState());
    const { paletteId } = useAppStore.getState();
    // URL is the source of truth for the id while syncing — store value
    // may not have caught up yet on initial palette load.
    const urlId = getPaletteIdFromUrl(search) ?? paletteId;

    // Skip if URL already matches store state
    if (updatePaletteIdInUrl(storeUrl, urlId) === currentUrl) {
      return;
    }

    if (pathname.startsWith('/p/')) {
      const parsed = parsePaletteFromUrl(currentUrl);

      if (parsed) {
        const { dropped, state: urlState } = parsed;
        const urlWithoutId = updatePaletteIdInUrl(currentUrl, null);
        const storeUrlWithoutId = updatePaletteIdInUrl(storeUrl, null);

        if (storeUrlWithoutId !== urlWithoutId) {
          paletteStoreApi.setState(state => {
            const colors = urlState.colors.map((c, index) =>
              state.colors[index] ? { ...c, id: state.colors[index].id } : c,
            );
            const activeColorId = colors.some(c => c.id === state.activeColorId)
              ? state.activeColorId
              : (colors[0]?.id ?? null);

            return { ...urlState, colors, activeColorId };
          });
        }

        if (dropped.length > 0 && lastDroppedUrl.current !== currentUrl) {
          lastDroppedUrl.current = currentUrl;
          addToast({
            title: `Dropped invalid ${dropped.length === 1 ? 'color' : 'colors'}: ${dropped.join(', ')}`,
            color: 'warning',
          });

          router.replace(buildPaletteUrl(urlState, urlId));
        } else if (dropped.length === 0) {
          // Canonicalise legacy URL forms (hex, 0-1 OKLCH) to the current OKLCH form.
          // replace: true keeps the legacy URL out of the back-button history.
          const canonicalUrl = buildPaletteUrl(urlState, urlId);

          if (canonicalUrl !== currentUrl) {
            router.replace(canonicalUrl);
          }
        }

        return;
      }
    }

    // No palette in the URL (root, or an unparseable /p/ URL) → reflect the
    // palette the store was already seeded with (server-side via fallbackPalette,
    // identical on both render passes) in the URL. Generating a fresh palette here
    // would overwrite the server-rendered one and cause a color flash on load.
    router.replace(serializePaletteToUrl(paletteStoreApi.getState()));
  }, [pathname, searchParams, router, paletteStoreApi]);

  const isPaused = useRef(false);

  // Watch for user interaction on ColorPicker / ChannelSliders roots.
  // They expose `data-interacting="true"` while a descendant is under pointer
  // or keyboard interaction; we pause URL writes during that window and flush
  // once on release so mid-interaction route churn doesn't break the gesture.
  useEffect(() => {
    let wasInteracting = false;

    const observer = new MutationObserver(() => {
      const isInteracting = document.querySelector('[data-interacting="true"]') !== null;

      if (isInteracting === wasInteracting) return;
      wasInteracting = isInteracting;

      if (isInteracting) {
        isPaused.current = true;

        return;
      }

      isPaused.current = false;

      commitPaletteUrl(paletteStoreApi.getState());
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-interacting'],
      subtree: true,
    });

    return () => observer.disconnect();
  }, [commitPaletteUrl, paletteStoreApi]);

  // Store changes → URL (skips when slider is being dragged). Also mirror the current
  // palette URL into the in-memory appStore so the Header logo can return to it within
  // the session (not a source of truth — see appStore.sessionPalettePath).
  useEffect(() => {
    const { paletteId, setSessionPalettePath } = useAppStore.getState();

    // Seed for the palette the provider already created (no store change fires for it).
    setSessionPalettePath(buildPaletteUrl(paletteStoreApi.getState(), paletteId));

    const unsubscribe = paletteStoreApi.subscribe((state, previousState) => {
      if (isPaused.current) {
        return;
      }

      if (
        state.colors !== previousState.colors ||
        state.globalOptions !== previousState.globalOptions
      ) {
        commitPaletteUrl(state);
      }
    });

    return unsubscribe;
  }, [commitPaletteUrl, paletteStoreApi]);
}
