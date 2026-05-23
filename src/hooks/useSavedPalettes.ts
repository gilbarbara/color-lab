import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';

import useApp from '~/hooks/useApp';
import useAuth from '~/hooks/useAuth';
import {
  createPalette,
  deletePalette as deletePaletteService,
  listPalettes,
  updatePalette as updatePaletteService,
} from '~/services/palettes';
import { usePalettesStore } from '~/stores/palettesStore';
import { usePaletteStore } from '~/stores/paletteStore';
import { serializePaletteToUrl, updatePaletteIdInUrl } from '~/utils/url';

import type { SavedPalette } from '~/types';

export default function useSavedPalettes() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const paletteStore = usePaletteStore();
  const { clearPalette, lastSavedUrl, paletteId, paletteName, setPalette } = useApp(
    'clearPalette',
    'lastSavedUrl',
    'paletteId',
    'paletteName',
    'setPalette',
  );
  const {
    addPalette,
    error,
    palettes,
    removePalette,
    reset,
    setError,
    setPalettes,
    setStatus,
    status,
    updatePalette: updatePaletteInStore,
  } = usePalettesStore();

  // Compute current URL from palette state
  const currentUrl = useMemo(
    () =>
      serializePaletteToUrl({
        colors: paletteStore.colors,
        globalOptions: paletteStore.globalOptions,
      }),
    [paletteStore.colors, paletteStore.globalOptions],
  );

  // Check if there are unsaved changes (strip ID from lastSavedUrl for comparison)
  const hasUnsavedChanges = useMemo(() => {
    if (!paletteId || !lastSavedUrl) {
      return false;
    }

    return currentUrl !== updatePaletteIdInUrl(lastSavedUrl, null);
  }, [currentUrl, lastSavedUrl, paletteId]);

  // Fetch palettes on mount when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      reset();

      return;
    }

    const fetchPalettes = async () => {
      setStatus('loading');

      try {
        const response = await listPalettes(user.uid);

        setPalettes(response);
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to load palettes');
      }
    };

    fetchPalettes();
  }, [isAuthenticated, user?.uid, reset, setError, setPalettes, setStatus]);

  // Save a new palette
  const savePalette = useCallback(
    async (name: string): Promise<SavedPalette | null> => {
      if (!user?.uid) {
        return null;
      }

      try {
        const palette = await createPalette(user.uid, name, currentUrl);

        addPalette(palette);
        setPalette(palette.id, palette.name, palette.url);

        navigate(palette.url, { replace: true });

        return palette;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to save palette');

        return null;
      }
    },
    [user?.uid, currentUrl, addPalette, setPalette, setError, navigate],
  );

  // Update the currently loaded palette
  const updateCurrentPalette = useCallback(async (): Promise<boolean> => {
    if (!paletteId) {
      return false;
    }

    try {
      const updated = await updatePaletteService(paletteId, { url: currentUrl });

      updatePaletteInStore(paletteId, { url: updated.url, updatedAt: updated.updatedAt });
      setPalette(paletteId, paletteName, updated.url);

      return true;
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to update palette');

      return false;
    }
  }, [paletteId, paletteName, currentUrl, updatePaletteInStore, setPalette, setError]);

  // Delete a palette
  const deletePalette = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deletePaletteService(id);
        removePalette(id);

        // If we deleted the currently loaded palette, clear it and remove ID from URL
        if (paletteId === id) {
          clearPalette();

          const cleanUrl = updatePaletteIdInUrl(currentUrl, null);

          navigate(cleanUrl, { replace: true });
        }

        return true;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to delete palette');

        return false;
      }
    },
    [removePalette, paletteId, clearPalette, setError, currentUrl, navigate],
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
    async (id: string, name: string): Promise<boolean> => {
      try {
        const updated = await updatePaletteService(id, { name });

        updatePaletteInStore(id, { name: updated.name });

        // Update loaded palette name if it's the current one
        if (paletteId === id) {
          setPalette(id, name, lastSavedUrl);
        }

        return true;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to rename palette');

        return false;
      }
    },
    [updatePaletteInStore, paletteId, lastSavedUrl, setPalette, setError],
  );

  return {
    // State
    currentUrl,
    error,
    hasUnsavedChanges,
    isLoading: status === 'loading',
    paletteId,
    paletteName,
    palettes,

    // Actions
    clearPalette,
    deletePalette,
    renamePalette,
    savePalette,
    toggleFavorite,
    updateCurrentPalette,
  };
}
