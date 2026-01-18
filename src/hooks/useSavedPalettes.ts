import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';

import useAuth from '~/hooks/useAuth';
import {
  createPalette,
  deletePalette as deletePaletteService,
  listPalettes,
  updatePalette as updatePaletteService,
} from '~/services/palettes';
import { useAppStore } from '~/stores/appStore';
import { usePalettesStore } from '~/stores/palettesStore';
import { usePaletteStore } from '~/stores/paletteStore';
import { parsePaletteFromUrl, serializePaletteToUrl } from '~/utils/url';

import type { SavedPalette } from '~/types';

export default function useSavedPalettes() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const paletteStore = usePaletteStore();
  const { clearLoadedPalette, lastSavedUrl, loadedPaletteId, loadedPaletteName, setLoadedPalette } =
    useAppStore();
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

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!loadedPaletteId || !lastSavedUrl) {
      return false;
    }

    return currentUrl !== lastSavedUrl;
  }, [currentUrl, lastSavedUrl, loadedPaletteId]);

  // Fetch palettes on mount when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.$id) {
      reset();

      return;
    }

    const fetchPalettes = async () => {
      setStatus('loading');

      try {
        const response = await listPalettes(user.$id);

        setPalettes(response);
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to load palettes');
      }
    };

    fetchPalettes();
  }, [isAuthenticated, user?.$id, reset, setError, setPalettes, setStatus]);

  // Save a new palette
  const savePalette = useCallback(
    async (name: string): Promise<SavedPalette | null> => {
      if (!user?.$id) {
        return null;
      }

      try {
        const palette = await createPalette(user.$id, name, currentUrl);

        addPalette(palette);
        setLoadedPalette(palette.$id, palette.name, palette.url);

        return palette;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to save palette');

        return null;
      }
    },
    [user?.$id, currentUrl, addPalette, setLoadedPalette, setError],
  );

  // Update the currently loaded palette
  const updateCurrentPalette = useCallback(async (): Promise<boolean> => {
    if (!loadedPaletteId) {
      return false;
    }

    try {
      const updated = await updatePaletteService(loadedPaletteId, { url: currentUrl });

      updatePaletteInStore(loadedPaletteId, { url: currentUrl, $updatedAt: updated.$updatedAt });
      setLoadedPalette(loadedPaletteId, loadedPaletteName, currentUrl);

      return true;
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to update palette');

      return false;
    }
  }, [
    loadedPaletteId,
    loadedPaletteName,
    currentUrl,
    updatePaletteInStore,
    setLoadedPalette,
    setError,
  ]);

  // Load a palette (parse URL and update stores)
  const loadPalette = useCallback(
    (palette: SavedPalette) => {
      // Parse the URL to get palette state
      const paletteState = parsePaletteFromUrl(palette.url);

      if (!paletteState) {
        setError('Failed to parse palette URL');

        return;
      }

      // Update palette store with the loaded state
      usePaletteStore.setState(paletteState);

      // Track the loaded palette
      setLoadedPalette(palette.$id, palette.name, palette.url);

      // Navigate to the palette URL
      navigate(palette.url);
    },
    [navigate, setLoadedPalette, setError],
  );

  // Delete a palette
  const deletePalette = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deletePaletteService(id);
        removePalette(id);

        // If we deleted the currently loaded palette, clear it
        if (loadedPaletteId === id) {
          clearLoadedPalette();
        }

        return true;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to delete palette');

        return false;
      }
    },
    [removePalette, loadedPaletteId, clearLoadedPalette, setError],
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (id: string): Promise<boolean> => {
      const palette = palettes.find(p => p.$id === id);

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
        if (loadedPaletteId === id) {
          setLoadedPalette(id, name, lastSavedUrl);
        }

        return true;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to rename palette');

        return false;
      }
    },
    [updatePaletteInStore, loadedPaletteId, lastSavedUrl, setLoadedPalette, setError],
  );

  return {
    // State
    currentUrl,
    error,
    hasUnsavedChanges,
    isLoading: status === 'loading',
    loadedPaletteId,
    loadedPaletteName,
    palettes,

    // Actions
    clearLoadedPalette,
    deletePalette,
    loadPalette,
    renamePalette,
    savePalette,
    toggleFavorite,
    updateCurrentPalette,
  };
}
