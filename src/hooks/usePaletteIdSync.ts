import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';

import useAuth from '~/hooks/useAuth';
import { getPalette } from '~/services/palettes';
import { useAppStore } from '~/stores/appStore';
import { usePalettesStore } from '~/stores/palettesStore';
import { getPaletteIdFromUrl, updatePaletteIdInUrl } from '~/utils/url';

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

  const hasValidatedId = useRef(false);
  const lastPath = useRef<string | null>(null);
  const lastAuthState = useRef<boolean | null>(null);

  useEffect(() => {
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
    const cachedPalette = palettes.find(p => p.$id === paletteId);

    if (cachedPalette && cachedPalette.userId === user.$id) {
      setLoadedPalette(cachedPalette.$id, cachedPalette.name, cachedPalette.url);

      return;
    }

    // Fall back to API call (direct URL access, refresh, shared URL)
    (async () => {
      const palette = await getPalette(paletteId);

      if (palette && palette.userId === user.$id) {
        setLoadedPalette(palette.$id, palette.name, palette.url);
      } else {
        navigate(updatePaletteIdInUrl(currentUrl, null), { replace: true });
        clearLoadedPalette();
      }
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
    user,
  ]);
}
