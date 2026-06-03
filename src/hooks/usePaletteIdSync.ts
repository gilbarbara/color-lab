'use client';

import { useEffect, useRef } from 'react';
import { addToast } from '@heroui/react';
import * as Sentry from '@sentry/nextjs';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { ROUTER_NAVIGATION_OPTIONS } from '~/config/globals';
import useApp from '~/hooks/useApp';
import useAuth from '~/hooks/useAuth';
import { useGeneratorStoreApi } from '~/hooks/useGeneratorStore';
import { getPalette, migratePaletteUrl } from '~/services/palettes';
import { usePalettesStore } from '~/stores/palettesStore';
import {
  canonicalizeUrl,
  decoratePaletteUrl,
  getPaletteIdFromUrl,
  stripPaletteIdentity,
} from '~/utils/url';

/**
 * Validates palette ID from URL and manages palette identity state.
 * Call once in Generator alongside useUrlSync.
 */
export default function usePaletteIdSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { clearPalette, paletteId, setPalette } = useApp('clearPalette', 'paletteId', 'setPalette');
  const { palettes } = usePalettesStore();
  const generatorStoreApi = useGeneratorStoreApi();

  const updatePaletteInStore = usePalettesStore(state => state.updatePalette);

  const hasValidatedId = useRef(false);
  const lastPath = useRef<string | null>(null);
  const lastSearch = useRef<string>('');
  const lastAuthState = useRef<boolean | null>(null);

  useEffect(() => {
    // Canonicalise the palette URL (legacy hex / 3-decimal OKLCH → current OKLCH),
    // fire-and-forget the Firestore migration when needed, and return the
    // canonical url-with-id for setPalette. Migration write omits
    // `updatedAt` so we don't bump it for a non-user-initiated change.
    const canonicalizeAndMigrate = (id: string, urlWithId: string): string => {
      const canonical = canonicalizeUrl(urlWithId);
      // Firestore stores the structural url (no id, no name); the store cache keeps
      // the decorated url so consumers (e.g. PaletteCard links) stay self-describing.
      const canonicalStructural = stripPaletteIdentity(canonical);
      const originalStructural = stripPaletteIdentity(urlWithId);

      if (canonicalStructural !== originalStructural) {
        migratePaletteUrl(id, canonicalStructural).catch(error => {
          Sentry.addBreadcrumb({
            category: 'palette-load',
            message: 'migratePaletteUrl failed',
            level: 'warning',
            data: { paletteId: id, error: String(error) },
          });
        });
        updatePaletteInStore(id, { url: canonical });
      }

      return canonical;
    };

    const searchString = searchParams.toString();
    const search = searchString ? `?${searchString}` : '';

    // Detect what actually changed since the last run before mutating refs.
    const pathChanged = lastPath.current !== pathname;
    const searchChanged = lastSearch.current !== search;
    const authStateJustChanged =
      lastAuthState.current !== null && lastAuthState.current !== isAuthenticated;

    if (pathChanged || authStateJustChanged) {
      hasValidatedId.current = false;
    }

    lastPath.current = pathname;
    lastSearch.current = search;
    lastAuthState.current = isAuthenticated;

    // Wait for auth to settle
    if (isLoading) return;

    const urlPaletteId = getPaletteIdFromUrl(search);

    if (!urlPaletteId) {
      // Only clear on genuine URL change. A re-run triggered by appStore.paletteId
      // changing (e.g. savePalette flow) sees the stale location and would
      // otherwise misread it as "user navigated away" and clear.
      if ((pathChanged || searchChanged) && paletteId) {
        clearPalette();
      }

      return;
    }

    if (hasValidatedId.current) return;

    hasValidatedId.current = true;

    const currentUrl = `${pathname}${search}`;

    if (!isAuthenticated || !user) {
      // Not logged in - remove ID from URL
      router.replace(decoratePaletteUrl(currentUrl, { id: null }), ROUTER_NAVIGATION_OPTIONS);
      clearPalette();

      return;
    }

    // Check cache first (from My Palettes visit)
    const cachedPalette = palettes.find(p => p.id === urlPaletteId);

    if (cachedPalette && cachedPalette.userId === user.uid) {
      const canonical = canonicalizeAndMigrate(cachedPalette.id, cachedPalette.url);

      setPalette(cachedPalette.id, cachedPalette.name, canonical);
      // Record name is authoritative — seed it into the working store. The URL
      // reflects it via useUrlSync's name-only `replace` (no extra history entry).
      generatorStoreApi.getState().setName(cachedPalette.name);

      return;
    }

    // Fall back to API call (direct URL access, refresh, shared URL)
    (async () => {
      const result = await getPalette(urlPaletteId);

      if (result.kind === 'success' && result.palette.userId === user.uid) {
        const canonical = canonicalizeAndMigrate(result.palette.id, result.palette.url);

        setPalette(result.palette.id, result.palette.name, canonical);
        generatorStoreApi.getState().setName(result.palette.name);

        return;
      }

      if (result.kind === 'error') {
        Sentry.addBreadcrumb({
          category: 'palette-load',
          message: 'getPalette error — toast shown',
          level: 'warning',
          data: { paletteId: urlPaletteId },
        });

        addToast({
          title: 'Could not load palette',
          description: 'Check your connection and try again.',
          color: 'danger',
        });

        // Keep ID in URL — user can retry
        return;
      }

      // not-found / forbidden (deleted, not-owned, denied) → this isn't a saved
      // palette we can load, so drop the whole saved identity (name + id) and keep
      // only the colors. Silent: a denied/stale link is not an error worth a toast.
      router.replace(stripPaletteIdentity(currentUrl), ROUTER_NAVIGATION_OPTIONS);
      clearPalette();
    })();
  }, [
    clearPalette,
    generatorStoreApi,
    isAuthenticated,
    isLoading,
    paletteId,
    pathname,
    searchParams,
    router,
    palettes,
    setPalette,
    updatePaletteInStore,
    user,
  ]);
}
