'use client';

import { useEffect } from 'react';

import { useAppStore } from '~/stores/appStore';

/**
 * Triggers manual persist rehydration once mounted, then keeps the
 * `<html>` attributes (`data-gamut`, `data-sidebar`, `data-preview`,
 * `data-color-options`, `data-palette-options`) in sync with store changes so
 * CSS-driven components (Swatch, sidebar, collapse panels) re-paint when the
 * user toggles them.
 *
 * The pre-paint script in app/layout.tsx sets the initial attribute values
 * before React mounts — this component just keeps them aligned with subsequent
 * store updates.
 */
export default function AppStoreSync() {
  useEffect(() => {
    useAppStore.persist.rehydrate();

    const setOpen = (root: HTMLElement, attribute: string, value: boolean) => {
      root.setAttribute(attribute, value ? 'open' : 'closed');
    };

    const unsubscribe = useAppStore.subscribe((state, previous) => {
      const root = document.documentElement;

      if (state.gamut !== previous.gamut) {
        root.setAttribute('data-gamut', state.gamut);
      }

      if (state.showSidebar !== previous.showSidebar) {
        setOpen(root, 'data-sidebar', state.showSidebar);
      }

      if (state.showPreview !== previous.showPreview) {
        setOpen(root, 'data-preview', state.showPreview);
      }

      if (state.showColorOptionsPanel !== previous.showColorOptionsPanel) {
        setOpen(root, 'data-color-options', state.showColorOptionsPanel);
      }

      if (state.showPaletteOptionsPanel !== previous.showPaletteOptionsPanel) {
        setOpen(root, 'data-palette-options', state.showPaletteOptionsPanel);
      }
    });

    return unsubscribe;
  }, []);

  return null;
}
