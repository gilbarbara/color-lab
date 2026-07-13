'use client';

import { useCallback, useEffect, useRef } from 'react';
import { addToast } from '@heroui/react';
import { usePathname, useSearchParams } from 'next/navigation';

import { PALETTE_PATH_PREFIX } from '~/config/globals';
import { DATA_INTERACTING_ATTR } from '~/config/ui';
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
  const generatorStoreApi = useGeneratorStoreApi();
  const lastDroppedUrl = useRef<string | null>(null);
  // True while the hydrate effect is writing URL → store, so the store → URL
  // subscription skips that change. Without it, applying the URL on back/forward
  // (popstate) re-commits the same URL, and that extra pushState clobbers the
  // forward-history entry — breaking the Forward button.
  const applyingFromUrl = useRef(false);

  // Commit the current palette to the URL and mirror it into appStore so the
  // Header logo can return to it this session. `method` selects history behavior:
  // 'pushState' for structural edits (each palette is a distinct entry),
  // 'replaceState' for name-only changes (metadata — not worth a back-button entry).
  const commitPaletteUrl = useCallback(
    (state: GeneratorState, method: 'push' | 'replace' = 'push') => {
      const fullUrl = buildPaletteUrl(state, useAppStore.getState().paletteId);

      // History API, not router.push: a palette edit is a client-only URL update, but on
      // these force-dynamic routes router navigation does a server round-trip that
      // re-renders the generator subtree — closing an open popover and desyncing the
      // controlled slider mid-edit. pushState/replaceState integrate with the Next Router
      // (usePathname/useSearchParams update, back/forward works) without that round-trip.
      window.history[method === 'push' ? 'pushState' : 'replaceState'](null, '', fullUrl);
      useAppStore.getState().setSessionPalettePath(fullUrl);
    },
    [],
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

    if (pathname.startsWith(`${PALETTE_PATH_PREFIX}/`)) {
      const parsed = parsePaletteFromUrl(currentUrl);

      if (parsed) {
        const { dropped, state: urlState } = parsed;
        const urlWithoutId = decoratePaletteUrl(currentUrl, { id: null });
        const storeUrlWithoutId = decoratePaletteUrl(storeUrl, { id: null });

        if (storeUrlWithoutId !== urlWithoutId) {
          applyingFromUrl.current = true;
          generatorStoreApi.setState(state => {
            const colors = urlState.colors.map((c, index) =>
              state.colors[index] ? { ...c, id: state.colors[index].id } : c,
            );
            const activeColorId = colors.some(c => c.id === state.activeColorId)
              ? state.activeColorId
              : (colors[0]?.id ?? null);

            return { ...urlState, colors, activeColorId };
          });
          applyingFromUrl.current = false;
        }

        if (dropped.length > 0 && lastDroppedUrl.current !== currentUrl) {
          lastDroppedUrl.current = currentUrl;
          addToast({
            title: `Dropped invalid ${dropped.length === 1 ? 'color' : 'colors'}: ${dropped.join(', ')}`,
            color: 'warning',
          });

          window.history.replaceState(null, '', buildPaletteUrl(urlState, urlId));
        } else if (dropped.length === 0) {
          // Canonicalise legacy URL forms (hex, 0-1 OKLCH) to the current OKLCH form.
          // replaceState keeps the legacy URL out of the back-button history.
          const canonicalUrl = buildPaletteUrl(urlState, urlId);

          if (canonicalUrl !== currentUrl) {
            window.history.replaceState(null, '', canonicalUrl);
          }
        }

        return;
      }

      // Unparseable `/p/…` → reflect the seeded palette in the URL (same segment cleanup).
      window.history.replaceState(null, '', serializePaletteToUrl(generatorStoreApi.getState()));
    }

    // Bare `/p` is the stable target `/` redirects to. Reflect the server-seeded random palette in
    // the URL so the visitor lands on a concrete, shareable `/p/<slug>`. This is URL-only — a
    // replaceState does not re-run `generateMetadata` (server-only), so head tags stay as SSR'd
    // (`canonical=/p`, no per-palette `og:`): no content/head flip, just the URL. Keeping this out of
    // the server redirect is what stops crawlers being fed a fresh palette URL per hit (the Search
    // Console flood) — Googlebot hitting `/` now always lands on the stable `/p`.
    if (pathname === PALETTE_PATH_PREFIX) {
      window.history.replaceState(null, '', serializePaletteToUrl(generatorStoreApi.getState()));
    }
  }, [pathname, searchParams, generatorStoreApi]);

  const isPaused = useRef(false);

  // Watch for user interaction on ColorPicker / ChannelSliders roots.
  // They expose `data-interacting="true"` while a descendant is under pointer
  // or keyboard interaction; we pause URL writes during that window and flush
  // once on release so mid-interaction route churn doesn't break the gesture.
  useEffect(() => {
    let wasInteracting = false;

    const observer = new MutationObserver(() => {
      const isInteracting = document.querySelector(`[${DATA_INTERACTING_ATTR}="true"]`) !== null;

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
      attributeFilter: [DATA_INTERACTING_ATTR],
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
      if (isPaused.current || applyingFromUrl.current) {
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
