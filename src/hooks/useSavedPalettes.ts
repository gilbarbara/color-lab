'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { ROUTER_NAVIGATION_OPTIONS } from '~/config/globals';
import useApp from '~/hooks/useApp';
import useAuth from '~/hooks/useAuth';
import useGenerator from '~/hooks/useGenerator';
import { useGeneratorStoreApi } from '~/hooks/useGeneratorStore';
import { usePalettesStore } from '~/stores/palettesStore';
import { loadPalettesService } from '~/utils/load-palettes';
import { stripPaletteIdentity } from '~/utils/url';

import type { SavedPalette } from '~/types';

/**
 * Full saved-palette hook: list management plus save/update of the *current* palette.
 * The save operations read the per-request generator store, so this must be used inside
 * a GeneratorStoreProvider (the generator routes). The `/palettes` list page should use
 * {@link useSavedPalettesList} instead.
 */
export default function useSavedPalettes() {
  const router = useRouter();
  const { user } = useAuth();
  const list = useSavedPalettesList();

  const { generatorUrl: currentUrl, name } = useGenerator('generatorUrl', 'name');
  const generatorStoreApi = useGeneratorStoreApi();
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

  // Unsaved when the structural URL (name- and id-free on both sides) diverges,
  // or when the working name differs from the saved record name (paletteName).
  const hasUnsavedChanges = useMemo(() => {
    if (!paletteId || !lastSavedUrl) {
      return false;
    }

    const savedStructural = stripPaletteIdentity(lastSavedUrl);

    return currentUrl !== savedStructural || name !== paletteName;
  }, [currentUrl, lastSavedUrl, name, paletteId, paletteName]);

  // Save a new palette
  const savePalette = useCallback(
    async (rawName: string): Promise<SavedPalette | null> => {
      const trimmedName = rawName.trim();

      if (!trimmedName || !user?.uid) {
        return null;
      }

      setStatus('saving');

      try {
        // Firestore service is dynamic-imported to keep it off the first-load path.
        const { createPalette } = await loadPalettesService();
        const palette = await createPalette(user.uid, trimmedName, currentUrl);

        addPalette(palette);
        setPalette(palette.id, palette.name, palette.url);
        // Sync the working store name to the saved record name (the modal name
        // may differ from the store's current name).
        generatorStoreApi.getState().setName(palette.name);

        // Write the new id to the address bar (nothing else does after save).
        // The service url already carries `?name=` + `?id=`, which matches the
        // store's serialized form, so useUrlSync's guard short-circuits and
        // leaves the id alone.
        router.replace(palette.url, ROUTER_NAVIGATION_OPTIONS);

        setStatus('idle');

        return palette;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to save palette');

        return null;
      }
    },
    [user?.uid, currentUrl, generatorStoreApi, setPalette, addPalette, setError, setStatus, router],
  );

  // Update the currently loaded palette
  const updateCurrentPalette = useCallback(async (): Promise<boolean> => {
    if (!paletteId) {
      return false;
    }

    setStatus('saving');

    try {
      // Persist the working name alongside the url (read live to avoid a stale closure).
      const nextName = generatorStoreApi.getState().name;
      const { updatePalette: updatePaletteService } = await loadPalettesService();
      const updated = await updatePaletteService(paletteId, { url: currentUrl, name: nextName });

      updatePaletteInStore(paletteId, {
        name: updated.name,
        url: updated.url,
        updatedAt: updated.updatedAt,
      });
      setPalette(paletteId, updated.name, updated.url);
      setStatus('idle');

      return true;
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to update palette');

      return false;
    }
  }, [
    paletteId,
    currentUrl,
    generatorStoreApi,
    updatePaletteInStore,
    setPalette,
    setError,
    setStatus,
  ]);

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
 * depend on the per-request generator store, so it is safe to use outside the
 * GeneratorStoreProvider (e.g. the `/palettes` page).
 */
export function useSavedPalettesList() {
  const { isAuthenticated, user } = useAuth();
  const { clearPalette, paletteId, paletteName } = useApp(
    'clearPalette',
    'paletteId',
    'paletteName',
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
        const { listPalettes } = await loadPalettesService();
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
        const { deletePalette: deletePaletteService } = await loadPalettesService();

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

      const previous = palette.isFavorite;

      // Optimistic: flip the heart immediately so it responds without waiting on Firestore.
      updatePaletteInStore(id, { isFavorite: !previous });

      try {
        const { updatePalette: updatePaletteService } = await loadPalettesService();

        await updatePaletteService(id, { isFavorite: !previous });

        return true;
      } catch (error_) {
        updatePaletteInStore(id, { isFavorite: previous });
        setError(error_ instanceof Error ? error_.message : 'Failed to update favorite');

        return false;
      }
    },
    [palettes, updatePaletteInStore, setError],
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
    toggleFavorite,
  };
}
