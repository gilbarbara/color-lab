import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { addToast } from '@heroui/react';
import * as Sentry from '@sentry/react';

import useAuth from '~/hooks/useAuth';
import { getPalette, migratePaletteUrl } from '~/services/palettes';
import { useAppStore } from '~/stores/appStore';
import { usePalettesStore } from '~/stores/palettesStore';
import { canonicalizeUrl, getPaletteIdFromUrl, updatePaletteIdInUrl } from '~/utils/url';

/**
 * Validates palette ID from URL and manages loadedPalette state.
 * Call once in Generator alongside useUrlSync.
 */
export default function usePaletteIdSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { clearLoadedPalette, loadedPaletteId, setLoadedPalette } = useAppStore();
  const { palettes } = usePalettesStore();

  const updatePaletteInStore = usePalettesStore(state => state.updatePalette);

  const hasValidatedId = useRef(false);
  const lastPath = useRef<string | null>(null);
  const lastAuthState = useRef<boolean | null>(null);

  useEffect(() => {
    // Canonicalise the palette URL (legacy hex / 3-decimal OKLCH → current OKLCH),
    // fire-and-forget the Firestore migration when needed, and return the
    // canonical url-with-id for setLoadedPalette. Migration write omits
    // `updatedAt` so we don't bump it for a non-user-initiated change.
    const canonicalizeAndMigrate = (id: string, urlWithId: string): string => {
      const canonical = canonicalizeUrl(urlWithId);
      const canonicalNoId = updatePaletteIdInUrl(canonical, null);
      const originalNoId = updatePaletteIdInUrl(urlWithId, null);

      if (canonicalNoId !== originalNoId) {
        migratePaletteUrl(id, canonicalNoId).catch(error => {
          Sentry.addBreadcrumb({
            category: 'palette-load',
            message: 'migratePaletteUrl failed',
            level: 'warning',
            data: { paletteId: id, error: String(error) },
          });
        });
        updatePaletteInStore(id, { url: canonicalNoId });
      }

      return canonical;
    };

    // Reset on path change
    if (lastPath.current !== location.pathname) {
      hasValidatedId.current = false;
      lastPath.current = location.pathname;
    }

    // Reset on auth state change (e.g., logout)
    const authStateJustChanged =
      lastAuthState.current !== null && lastAuthState.current !== isAuthenticated;

    if (authStateJustChanged) {
      hasValidatedId.current = false;
    }

    lastAuthState.current = isAuthenticated;

    // Wait for auth to settle
    if (isLoading) return;

    const paletteId = getPaletteIdFromUrl(location.search);

    if (!paletteId) {
      if (loadedPaletteId) clearLoadedPalette();

      return;
    }

    if (hasValidatedId.current) return;

    hasValidatedId.current = true;

    const currentUrl = `${location.pathname}${location.search}`;

    if (!isAuthenticated || !user) {
      // Not logged in - remove ID from URL
      navigate(updatePaletteIdInUrl(currentUrl, null), { replace: true });
      clearLoadedPalette();

      return;
    }

    // Check cache first (from My Palettes visit)
    const cachedPalette = palettes.find(p => p.id === paletteId);

    if (cachedPalette && cachedPalette.userId === user.uid) {
      const canonical = canonicalizeAndMigrate(cachedPalette.id, cachedPalette.url);

      setLoadedPalette(cachedPalette.id, cachedPalette.name, canonical);

      return;
    }

    // Fall back to API call (direct URL access, refresh, shared URL)
    (async () => {
      const result = await getPalette(paletteId);

      if (result.kind === 'success' && result.palette.userId === user.uid) {
        const canonical = canonicalizeAndMigrate(result.palette.id, result.palette.url);

        setLoadedPalette(result.palette.id, result.palette.name, canonical);

        return;
      }

      if (result.kind === 'error') {
        Sentry.addBreadcrumb({
          category: 'palette-load',
          message: 'getPalette error — toast shown',
          level: 'warning',
          data: { paletteId },
        });

        addToast({
          title: 'Could not load palette',
          description: 'Check your connection and try again.',
          color: 'danger',
        });

        // Keep ID in URL — user can retry
        return;
      }

      // not-found OR success-but-wrong-user → strip ID
      navigate(updatePaletteIdInUrl(currentUrl, null), { replace: true });
      clearLoadedPalette();
    })();
  }, [
    clearLoadedPalette,
    isAuthenticated,
    isLoading,
    loadedPaletteId,
    location.pathname,
    location.search,
    navigate,
    palettes,
    setLoadedPalette,
    updatePaletteInStore,
    user,
  ]);
}
