'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import useApp from '~/hooks/useApp';
import useAuth from '~/hooks/useAuth';
import usePalette from '~/hooks/usePalette';
import {
  createPalette,
  deletePalette as deletePaletteService,
  listPalettes,
  updatePalette as updatePaletteService,
} from '~/services/palettes';
import { usePalettesStore } from '~/stores/palettesStore';
import { updatePaletteIdInUrl } from '~/utils/url';

import type { SavedPalette } from '~/types';

/**
 * Full saved-palette hook: list management plus save/update of the *current* palette.
 * The save operations read the per-request palette store, so this must be used inside
 * a PaletteStoreProvider (the generator routes). The `/palettes` list page should use
 * {@link useSavedPalettesList} instead.
 */
export default function useSavedPalettes() {
  const router = useRouter();
  const { user } = useAuth();
  const list = useSavedPalettesList();

  const { generatorUrl: currentUrl } = usePalette('generatorUrl');
  const { lastSavedUrl, paletteId, paletteName, setPalette } = useApp(
    'lastSavedUrl',
    'paletteId',
    'paletteName',
    'setPalette',
  );
  const {
    addPalette,
    setError,
    setStatus,
    updatePalette: updatePaletteInStore,
  } = usePalettesStore();

  // Check if there are unsaved changes (strip ID from lastSavedUrl for comparison)
  const hasUnsavedChanges = useMemo(() => {
    if (!paletteId || !lastSavedUrl) {
      return false;
    }

    return currentUrl !== updatePaletteIdInUrl(lastSavedUrl, null);
  }, [currentUrl, lastSavedUrl, paletteId]);

  // Save a new palette
  const savePalette = useCallback(
    async (rawName: string): Promise<SavedPalette | null> => {
      const name = rawName.trim();

      if (!name || !user?.uid) {
        return null;
      }

      setStatus('saving');

      try {
        const palette = await createPalette(user.uid, name, currentUrl);

        addPalette(palette);
        setPalette(palette.id, palette.name, palette.url);

        router.replace(palette.url);

        setStatus('idle');

        return palette;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to save palette');

        return null;
      }
    },
    [user?.uid, currentUrl, setPalette, addPalette, setError, setStatus, router],
  );

  // Update the currently loaded palette
  const updateCurrentPalette = useCallback(async (): Promise<boolean> => {
    if (!paletteId) {
      return false;
    }

    setStatus('saving');

    try {
      const updated = await updatePaletteService(paletteId, { url: currentUrl });

      updatePaletteInStore(paletteId, { url: updated.url, updatedAt: updated.updatedAt });
      setPalette(paletteId, paletteName, updated.url);
      setStatus('idle');

      return true;
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to update palette');

      return false;
    }
  }, [paletteId, paletteName, currentUrl, updatePaletteInStore, setPalette, setError, setStatus]);

  return {
    ...list,
    currentUrl,
    hasUnsavedChanges,
    savePalette,
    updateCurrentPalette,
  };
}

/**
 * Saved-palette list management (fetch + CRUD on the user's saved list). Does NOT
 * depend on the per-request palette store, so it is safe to use outside the
 * PaletteStoreProvider (e.g. the `/palettes` page).
 */
export function useSavedPalettesList() {
  const { isAuthenticated, user } = useAuth();
  const { clearPalette, lastSavedUrl, paletteId, paletteName, setPalette } = useApp(
    'clearPalette',
    'lastSavedUrl',
    'paletteId',
    'paletteName',
    'setPalette',
  );
  const {
    error,
    loadedUserId,
    palettes,
    removePalette,
    reset,
    setError,
    setPalettes,
    setStatus,
    status,
    updatePalette: updatePaletteInStore,
  } = usePalettesStore();

  // Fetch palettes on mount when authenticated; dedupe per uid
  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      reset();

      return;
    }

    if (loadedUserId === user.uid) {
      return;
    }

    const fetchPalettes = async () => {
      setStatus('loading');

      try {
        const response = await listPalettes(user.uid);

        setPalettes(response, user.uid);
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to load palettes');
      }
    };

    fetchPalettes();
  }, [isAuthenticated, user?.uid, loadedUserId, reset, setError, setPalettes, setStatus]);

  // Delete a palette
  const deletePalette = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deletePaletteService(id);
        removePalette(id);

        if (paletteId === id) {
          clearPalette();
        }

        return true;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to delete palette');

        return false;
      }
    },
    [removePalette, paletteId, clearPalette, setError],
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (id: string): Promise<boolean> => {
      const palette = palettes.find(p => p.id === id);

      if (!palette) {
        return false;
      }

      try {
        const updated = await updatePaletteService(id, { isFavorite: !palette.isFavorite });

        updatePaletteInStore(id, { isFavorite: updated.isFavorite });

        return true;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to update favorite');

        return false;
      }
    },
    [palettes, updatePaletteInStore, setError],
  );

  // Rename a palette
  const renamePalette = useCallback(
    async (id: string, rawName: string): Promise<boolean> => {
      const name = rawName.trim();

      if (!name) {
        return false;
      }

      setStatus('saving');

      try {
        const updated = await updatePaletteService(id, { name });

        updatePaletteInStore(id, { name: updated.name });

        // Update loaded palette name if it's the current one
        if (paletteId === id) {
          setPalette(id, name, lastSavedUrl);
        }

        setStatus('idle');

        return true;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to rename palette');

        return false;
      }
    },
    [updatePaletteInStore, paletteId, lastSavedUrl, setPalette, setError, setStatus],
  );

  return {
    error,
    isLoading: status === 'loading',
    isSaving: status === 'saving',
    paletteId,
    paletteName,
    palettes,
    clearPalette,
    deletePalette,
    renamePalette,
    toggleFavorite,
  };
}
