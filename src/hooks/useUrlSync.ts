import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { addToast } from '@heroui/react';

import { useAppStore } from '~/stores/appStore';
import { usePaletteStore } from '~/stores/paletteStore';
import { createPalette } from '~/utils/palette';
import {
  getPaletteIdFromUrl,
  parsePaletteFromUrl,
  serializePaletteToUrl,
  updatePaletteIdInUrl,
} from '~/utils/url';

/**
 * Syncs palette store with URL. Call once in Generator.
 */
export default function useUrlSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastDroppedUrl = useRef<string | null>(null);

  // Hydrate store from URL
  useEffect(() => {
    const currentUrl = `${location.pathname}${location.search}`;
    const storeUrl = serializePaletteToUrl(usePaletteStore.getState());
    const { loadedPaletteId } = useAppStore.getState();
    // URL is the source of truth for the id while syncing — store value
    // may not have caught up yet on initial palette load.
    const urlId = getPaletteIdFromUrl(location.search) ?? loadedPaletteId;

    // Skip if URL already matches store state
    if (updatePaletteIdInUrl(storeUrl, urlId) === currentUrl) {
      return;
    }

    if (location.pathname.startsWith('/p/')) {
      const parsed = parsePaletteFromUrl(currentUrl);

      if (parsed) {
        const { dropped, state: urlState } = parsed;
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

        if (dropped.length > 0 && lastDroppedUrl.current !== currentUrl) {
          lastDroppedUrl.current = currentUrl;
          addToast({
            title: `Dropped invalid ${dropped.length === 1 ? 'color' : 'colors'}: ${dropped.join(', ')}`,
            color: 'warning',
          });

          const cleanedUrl = updatePaletteIdInUrl(serializePaletteToUrl(urlState), urlId);

          navigate(cleanedUrl, { replace: true });
        } else if (dropped.length === 0) {
          // Canonicalise legacy URL forms (hex, 0-1 OKLCH) to the current OKLCH form.
          // replace: true keeps the legacy URL out of the back-button history.
          const canonicalUrl = updatePaletteIdInUrl(serializePaletteToUrl(urlState), urlId);

          if (canonicalUrl !== currentUrl) {
            navigate(canonicalUrl, { replace: true });
          }
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
