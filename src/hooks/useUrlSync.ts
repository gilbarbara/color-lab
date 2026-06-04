'use client';

import { useCallback, useEffect, useRef } from 'react';
import { addToast } from '@heroui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { ROUTER_NAVIGATION_OPTIONS } from '~/config/globals';
import { useGeneratorStoreApi } from '~/hooks/useGeneratorStore';
import { useAppStore } from '~/stores/appStore';
import {
  decoratePaletteUrl,
  getPaletteIdFromUrl,
  parsePaletteFromUrl,
  serializePaletteToUrl,
} from '~/utils/url';

import type { GeneratorState } from '~/types';

/**
 * Compose the canonical palette URL for `state`, carrying the saved-palette id.
 */
function buildPaletteUrl(state: GeneratorState, id: string | null): string {
  return decoratePaletteUrl(serializePaletteToUrl(state), { id });
}

/**
 * Syncs generator store with URL. Call once in Generator.
 */
export default function useUrlSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const generatorStoreApi = useGeneratorStoreApi();
  const lastDroppedUrl = useRef<string | null>(null);

  // Commit the current palette to the URL and mirror it into appStore so the
  // Header logo can return to it this session. `method` selects history behavior:
  // 'push' for structural edits (each palette is a distinct entry), 'replace' for
  // name-only changes (metadata — not worth a back-button entry).
  const commitPaletteUrl = useCallback(
    (state: GeneratorState, method: 'push' | 'replace' = 'push') => {
      const fullUrl = buildPaletteUrl(state, useAppStore.getState().paletteId);

      router[method](fullUrl, ROUTER_NAVIGATION_OPTIONS);
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
    const storeUrl = serializePaletteToUrl(generatorStoreApi.getState());
    const { paletteId } = useAppStore.getState();
    // URL is the source of truth for the id while syncing — store value
    // may not have caught up yet on initial palette load.
    const urlId = getPaletteIdFromUrl(search) ?? paletteId;

    // Skip if URL already matches store state
    if (decoratePaletteUrl(storeUrl, { id: urlId }) === currentUrl) {
      return;
    }

    if (pathname.startsWith('/p/')) {
      const parsed = parsePaletteFromUrl(currentUrl);

      if (parsed) {
        const { dropped, state: urlState } = parsed;
        const urlWithoutId = decoratePaletteUrl(currentUrl, { id: null });
        const storeUrlWithoutId = decoratePaletteUrl(storeUrl, { id: null });

        if (storeUrlWithoutId !== urlWithoutId) {
          generatorStoreApi.setState(state => {
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

          router.replace(buildPaletteUrl(urlState, urlId), ROUTER_NAVIGATION_OPTIONS);
        } else if (dropped.length === 0) {
          // Canonicalise legacy URL forms (hex, 0-1 OKLCH) to the current OKLCH form.
          // replace: true keeps the legacy URL out of the back-button history.
          const canonicalUrl = buildPaletteUrl(urlState, urlId);

          if (canonicalUrl !== currentUrl) {
            router.replace(canonicalUrl, ROUTER_NAVIGATION_OPTIONS);
          }
        }

        return;
      }

      // Unparseable `/p/…` → reflect the seeded palette in the URL (same segment cleanup).
      router.replace(
        serializePaletteToUrl(generatorStoreApi.getState()),
        ROUTER_NAVIGATION_OPTIONS,
      );
    }

    // Bare `/p` is the 200 indexable anchor — it stays put (no client flip). `/`
    // server-redirects real visitors straight to `/p/Primary-{random}`, so bare `/p` is
    // only hit directly or by crawlers, where a stable single-title page is what we want.
  }, [pathname, searchParams, router, generatorStoreApi]);

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

      commitPaletteUrl(generatorStoreApi.getState());
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-interacting'],
      subtree: true,
    });

    return () => observer.disconnect();
  }, [commitPaletteUrl, generatorStoreApi]);

  // Store changes → URL (skips when slider is being dragged). Also mirror the current
  // palette URL into the in-memory appStore so the Header logo can return to it within
  // the session (not a source of truth — see appStore.sessionPalettePath).
  useEffect(() => {
    const { paletteId, setSessionPalettePath } = useAppStore.getState();

    // Seed for the palette the provider already created (no store change fires for it).
    setSessionPalettePath(buildPaletteUrl(generatorStoreApi.getState(), paletteId));

    const unsubscribe = generatorStoreApi.subscribe((state, previousState) => {
      if (isPaused.current) {
        return;
      }

      const structuralChanged =
        state.colors !== previousState.colors ||
        state.globalOptions !== previousState.globalOptions;

      if (structuralChanged) {
        commitPaletteUrl(state, 'push');
      } else if (state.name !== previousState.name) {
        commitPaletteUrl(state, 'replace');
      }
    });

    return unsubscribe;
  }, [commitPaletteUrl, generatorStoreApi]);
}
