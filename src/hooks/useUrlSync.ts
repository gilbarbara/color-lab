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
          usePaletteStore.setState(state => {
            const colors = urlState.colors.map((c, index) =>
              state.colors[index] ? { ...c, id: state.colors[index].id } : c,
            );
            const activeColorId = colors.some(c => c.id === state.activeColorId)
              ? state.activeColorId
              : (colors[0]?.id ?? null);

            return { ...urlState, colors, activeColorId };
          });
        }

        return;
      }
    }

    // Invalid URL → create default palette
    const state = createPalette();

    usePaletteStore.setState({ ...state, activeColorId: state.colors[0]?.id ?? null });
    navigate(serializePaletteToUrl(state), { replace: true });
  }, [location.pathname, location.search, navigate]);

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

      const url = serializePaletteToUrl(usePaletteStore.getState());
      const { loadedPaletteId } = useAppStore.getState();

      navigate(updatePaletteIdInUrl(url, loadedPaletteId));
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-interacting'],
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
