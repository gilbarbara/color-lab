import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useAppStore } from '~/stores/appStore';
import { usePaletteStore } from '~/stores/paletteStore';
import { createPalette } from '~/utils/palette';
import { parsePaletteFromUrl, serializePaletteToUrl, updatePaletteIdInUrl } from '~/utils/url';

/**
 * Syncs palette store with URL. Call once in Generator.
 */
export default function useUrlSync() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hydrate store from URL
  useEffect(() => {
    const currentUrl = `${location.pathname}${location.search}`;
    const storeUrl = serializePaletteToUrl(usePaletteStore.getState());
    const { loadedPaletteId } = useAppStore.getState();

    // Skip if URL already matches store state
    if (updatePaletteIdInUrl(storeUrl, loadedPaletteId) === currentUrl) {
      return;
    }

    if (location.pathname.startsWith('/p/')) {
      const urlState = parsePaletteFromUrl(currentUrl);

      if (urlState) {
        const urlWithoutId = updatePaletteIdInUrl(currentUrl, null);
        const storeUrlWithoutId = updatePaletteIdInUrl(storeUrl, null);

        if (storeUrlWithoutId !== urlWithoutId) {
          usePaletteStore.setState(urlState);
        }

        return;
      }
    }

    // Invalid URL → create default palette
    const state = createPalette();

    usePaletteStore.setState(state);
    navigate(serializePaletteToUrl(state), { replace: true });
  }, [location.pathname, location.search, navigate]);

  const isPaused = useRef(false);

  // Watch slider thumbs for drag state
  useEffect(() => {
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        const el = m.target as HTMLElement;

        if (el.dataset.slot !== 'thumb') {
          continue;
        }

        const dragging = el.dataset.dragging === 'true';

        if (dragging) {
          isPaused.current = true;
        } else if (isPaused.current) {
          isPaused.current = false;

          const url = serializePaletteToUrl(usePaletteStore.getState());
          const { loadedPaletteId } = useAppStore.getState();

          navigate(updatePaletteIdInUrl(url, loadedPaletteId));
        }
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-dragging'],
      subtree: true,
    });

    return () => observer.disconnect();
  }, [navigate]);

  // Store changes → URL (skips when slider is being dragged)
  useEffect(() => {
    const unsubscribe = usePaletteStore.subscribe((state, previousState) => {
      if (isPaused.current) {
        return;
      }

      if (
        state.colors !== previousState.colors ||
        state.globalOptions !== previousState.globalOptions
      ) {
        const url = serializePaletteToUrl(state);
        const { loadedPaletteId } = useAppStore.getState();

        navigate(updatePaletteIdInUrl(url, loadedPaletteId));
      }
    });

    return unsubscribe;
  }, [navigate]);
}
