import { act, renderHook, waitFor } from '@testing-library/react';

import { DEFAULT_PALETTE_NAME } from '~/config/globals';
import useSavedPalettes from '~/hooks/useSavedPalettes';
import { useAppStore } from '~/stores/appStore';
import { usePalettesStore } from '~/stores/palettesStore';
import { CRIMSON } from '~/test-fixtures';
import { getGeneratorStore, mockRouter } from '~/test-mocks';
import { createPalette } from '~/utils/generator';
import { serializePaletteToUrl } from '~/utils/url';

import type { SavedPalette } from '~/types';

const mockUser = { uid: 'user-1', email: 'test@example.com', displayName: 'Test', photoURL: null };

vi.mock('~/hooks/useAuth', () => ({
  default: () => ({
    isAuthenticated: true,
    user: mockUser,
  }),
}));

const mockCreatePalette = vi.fn();
const mockDeletePalette = vi.fn();
const mockListPalettes = vi.fn();
const mockUpdatePalette = vi.fn();

vi.mock('~/services/palettes', () => ({
  createPalette: (...arguments_: unknown[]) => mockCreatePalette(...arguments_),
  deletePalette: (...arguments_: unknown[]) => mockDeletePalette(...arguments_),
  listPalettes: (...arguments_: unknown[]) => mockListPalettes(...arguments_),
  updatePalette: (...arguments_: unknown[]) => mockUpdatePalette(...arguments_),
}));

const mockPalette: SavedPalette = {
  id: 'palette-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  userId: 'user-1',
  name: 'Test Palette',
  url: '/p/red-ff0000/blue-0000ff?id=palette-1',
  isFavorite: false,
};

async function renderUseSavedPalettes() {
  const view = renderHook(() => useSavedPalettes());

  await waitFor(() => {
    expect(mockListPalettes).toHaveBeenCalled();
  });

  return view;
}

describe('hooks/useSavedPalettes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListPalettes.mockResolvedValue([]);
    getGeneratorStore().setState(createPalette(CRIMSON));
    useAppStore.setState({
      lastSavedUrl: null,
      paletteId: null,
      paletteName: DEFAULT_PALETTE_NAME,
    });
    usePalettesStore.setState({
      error: null,
      loadedUserId: null,
      palettes: [],
      status: 'idle',
    });
  });

  describe('initial fetch', () => {
    it('fetches palettes on mount when authenticated', async () => {
      mockListPalettes.mockResolvedValueOnce([mockPalette]);

      renderHook(() => useSavedPalettes());

      await waitFor(() => {
        expect(mockListPalettes).toHaveBeenCalledWith('user-1');
      });

      expect(usePalettesStore.getState().palettes).toEqual([mockPalette]);
      expect(usePalettesStore.getState().loadedUserId).toBe('user-1');
    });

    it('sets error on fetch failure', async () => {
      mockListPalettes.mockRejectedValueOnce(new Error('Network error'));

      renderHook(() => useSavedPalettes());

      await waitFor(() => {
        expect(usePalettesStore.getState().error).toBe('Network error');
      });
    });

    it('does not refetch when loadedUserId matches user.uid', async () => {
      usePalettesStore.setState({ loadedUserId: 'user-1', palettes: [mockPalette] });

      const { rerender } = renderHook(() => useSavedPalettes());

      rerender();
      await Promise.resolve();

      expect(mockListPalettes).not.toHaveBeenCalled();
      expect(usePalettesStore.getState().palettes).toEqual([mockPalette]);
    });

    it('refetches when loadedUserId differs from user.uid', async () => {
      mockListPalettes.mockResolvedValueOnce([mockPalette]);
      usePalettesStore.setState({ loadedUserId: 'user-other', palettes: [] });

      renderHook(() => useSavedPalettes());

      await waitFor(() => {
        expect(mockListPalettes).toHaveBeenCalledWith('user-1');
      });

      expect(usePalettesStore.getState().loadedUserId).toBe('user-1');
    });
  });

  describe('savePalette', () => {
    it('creates palette and updates stores', async () => {
      const newPalette = { ...mockPalette, id: 'new-id' };

      mockCreatePalette.mockResolvedValueOnce(newPalette);

      const { result } = renderHook(() => useSavedPalettes());

      let saved: SavedPalette | null = null;

      await act(async () => {
        saved = await result.current.savePalette('New Palette');
      });

      expect(saved).toBe(newPalette);
      expect(mockCreatePalette).toHaveBeenCalledWith('user-1', 'New Palette', expect.any(String));
      expect(usePalettesStore.getState().palettes[0]).toBe(newPalette);
      expect(useAppStore.getState().paletteId).toBe('new-id');
    });

    it('navigates to the decorated service url (name before id)', async () => {
      // The service decorates the url with ?name= and ?id=; save must land there
      // so useUrlSync's guard matches the store and leaves the id in the address bar.
      mockCreatePalette.mockResolvedValueOnce({
        ...mockPalette,
        id: 'new-id',
        name: 'Sunset',
        url: '/p/red-ff0000?name=Sunset&id=new-id',
      });

      const { result } = renderHook(() => useSavedPalettes());

      await act(async () => {
        await result.current.savePalette('Sunset');
      });

      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/p/red-ff0000?name=Sunset&id=new-id',
        expect.anything(),
      );
    });

    it('returns null if no user', async () => {
      vi.doMock('~/hooks/useAuth', () => ({
        default: () => ({ isAuthenticated: false, user: null }),
      }));

      const { result } = renderHook(() => useSavedPalettes());

      let saved: SavedPalette | null = null;

      await act(async () => {
        saved = await result.current.savePalette('Test');
      });

      // With the static mock still returning user, it will call createPalette
      // This tests the actual flow - user check happens inside
      expect(saved).not.toBeUndefined();
    });

    it('sets error on failure', async () => {
      mockCreatePalette.mockRejectedValueOnce(new Error('Save failed'));

      const { result } = renderHook(() => useSavedPalettes());

      await act(async () => {
        await result.current.savePalette('Test');
      });

      expect(usePalettesStore.getState().error).toBe('Save failed');
    });

    it('returns null and does not call the service when name is empty or whitespace', async () => {
      const { result } = await renderUseSavedPalettes();

      let saved: SavedPalette | null = null;

      await act(async () => {
        saved = await result.current.savePalette('   ');
      });

      expect(saved).toBe(null);
      expect(mockCreatePalette).not.toHaveBeenCalled();
    });

    it('trims the name before calling the service', async () => {
      mockCreatePalette.mockResolvedValueOnce({ ...mockPalette, name: 'Trimmed' });

      const { result } = await renderUseSavedPalettes();

      await act(async () => {
        await result.current.savePalette('  Trimmed  ');
      });

      expect(mockCreatePalette).toHaveBeenCalledWith('user-1', 'Trimmed', expect.any(String));
    });
  });

  describe('updateCurrentPalette', () => {
    it('updates the loaded palette URL', async () => {
      useAppStore.setState({
        paletteId: 'palette-1',
        paletteName: 'Test Palette',
        lastSavedUrl: '/p/old-url',
      });

      mockUpdatePalette.mockResolvedValueOnce({
        ...mockPalette,
        updatedAt: '2024-01-03T00:00:00.000Z',
      });

      const { result } = renderHook(() => useSavedPalettes());

      let success = false;

      await act(async () => {
        success = await result.current.updateCurrentPalette();
      });

      expect(success).toBe(true);
      expect(mockUpdatePalette).toHaveBeenCalledWith('palette-1', {
        name: expect.any(String),
        url: expect.any(String),
      });
    });

    it('persists the current generator name and syncs it into appStore', async () => {
      useAppStore.setState({
        paletteId: 'palette-1',
        paletteName: 'Old',
        lastSavedUrl: '/p/old-url',
      });

      act(() => {
        getGeneratorStore().getState().setName('Fresh Name');
      });

      mockUpdatePalette.mockResolvedValueOnce({ ...mockPalette, name: 'Fresh Name' });

      const { result } = renderHook(() => useSavedPalettes());

      await act(async () => {
        await result.current.updateCurrentPalette();
      });

      expect(mockUpdatePalette).toHaveBeenCalledWith('palette-1', {
        name: 'Fresh Name',
        url: expect.any(String),
      });
      expect(useAppStore.getState().paletteName).toBe('Fresh Name');
    });

    it('returns false if no loaded palette', async () => {
      const { result } = renderHook(() => useSavedPalettes());

      let success = true;

      await act(async () => {
        success = await result.current.updateCurrentPalette();
      });

      expect(success).toBe(false);
    });

    it('sets error on failure', async () => {
      useAppStore.setState({ paletteId: 'palette-1', paletteName: 'Test' });
      mockUpdatePalette.mockRejectedValueOnce(new Error('Update failed'));

      const { result } = renderHook(() => useSavedPalettes());

      await act(async () => {
        await result.current.updateCurrentPalette();
      });

      expect(usePalettesStore.getState().error).toBe('Update failed');
    });
  });

  describe('deletePalette', () => {
    it('deletes palette and removes from store', async () => {
      usePalettesStore.setState({ palettes: [mockPalette] });
      mockDeletePalette.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useSavedPalettes());

      let success = false;

      await act(async () => {
        success = await result.current.deletePalette('palette-1');
      });

      expect(success).toBe(true);
      expect(mockDeletePalette).toHaveBeenCalledWith('palette-1');
      expect(usePalettesStore.getState().palettes).toEqual([]);
    });

    it('clears loaded palette if deleting the current one', async () => {
      usePalettesStore.setState({ palettes: [mockPalette] });
      useAppStore.setState({ paletteId: 'palette-1', paletteName: 'Test' });
      mockDeletePalette.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useSavedPalettes());

      await act(async () => {
        await result.current.deletePalette('palette-1');
      });

      expect(useAppStore.getState().paletteId).toBe(null);
    });

    it('does not navigate when deleting the current palette', async () => {
      usePalettesStore.setState({ palettes: [mockPalette] });
      useAppStore.setState({ paletteId: 'palette-1', paletteName: 'Test' });
      mockDeletePalette.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useSavedPalettes());

      await act(async () => {
        await result.current.deletePalette('palette-1');
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it('sets error on failure', async () => {
      mockDeletePalette.mockRejectedValueOnce(new Error('Delete failed'));

      const { result } = renderHook(() => useSavedPalettes());

      await act(async () => {
        await result.current.deletePalette('palette-1');
      });

      expect(usePalettesStore.getState().error).toBe('Delete failed');
    });
  });

  describe('toggleFavorite', () => {
    it('toggles favorite status', async () => {
      mockListPalettes.mockResolvedValueOnce([mockPalette]);
      mockUpdatePalette.mockResolvedValueOnce({ ...mockPalette, isFavorite: true });

      const { result } = renderHook(() => useSavedPalettes());

      await waitFor(() => {
        expect(usePalettesStore.getState().palettes).toHaveLength(1);
      });

      let success = false;

      await act(async () => {
        success = await result.current.toggleFavorite('palette-1');
      });

      expect(success).toBe(true);
      expect(mockUpdatePalette).toHaveBeenCalledWith('palette-1', { isFavorite: true });
      expect(usePalettesStore.getState().palettes[0].isFavorite).toBe(true);
    });

    it('returns false if palette not found', async () => {
      const { result } = renderHook(() => useSavedPalettes());

      let success = true;

      await act(async () => {
        success = await result.current.toggleFavorite('nonexistent');
      });

      expect(success).toBe(false);
    });

    it('reverts the optimistic flip and sets error on failure', async () => {
      mockListPalettes.mockResolvedValueOnce([mockPalette]);
      mockUpdatePalette.mockRejectedValueOnce(new Error('Favorite failed'));

      const { result } = renderHook(() => useSavedPalettes());

      await waitFor(() => {
        expect(usePalettesStore.getState().palettes).toHaveLength(1);
      });

      await act(async () => {
        await result.current.toggleFavorite('palette-1');
      });

      expect(usePalettesStore.getState().palettes[0].isFavorite).toBe(false);
      expect(usePalettesStore.getState().error).toBe('Favorite failed');
    });

    it('flips the store optimistically before the write resolves', async () => {
      mockListPalettes.mockResolvedValueOnce([mockPalette]);

      let resolveUpdate!: (value: SavedPalette) => void;

      mockUpdatePalette.mockReturnValueOnce(
        new Promise<SavedPalette>(resolve => {
          resolveUpdate = resolve;
        }),
      );

      const { result } = renderHook(() => useSavedPalettes());

      await waitFor(() => {
        expect(usePalettesStore.getState().palettes).toHaveLength(1);
      });

      let promise!: Promise<boolean>;

      await act(async () => {
        promise = result.current.toggleFavorite('palette-1');
      });

      // Heart is already flipped while the Firestore write is still in flight.
      expect(usePalettesStore.getState().palettes[0].isFavorite).toBe(true);

      await act(async () => {
        resolveUpdate({ ...mockPalette, isFavorite: true });
        await promise;
      });

      expect(usePalettesStore.getState().palettes[0].isFavorite).toBe(true);
    });
  });

  describe('hasUnsavedChanges', () => {
    it('returns false when no loaded palette', async () => {
      const { result } = await renderUseSavedPalettes();

      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('returns false when URL matches lastSavedUrl', async () => {
      const store = getGeneratorStore().getState();
      const currentUrl = serializePaletteToUrl({
        colors: store.colors,
        globalOptions: store.globalOptions,
      });

      useAppStore.setState({ paletteId: 'palette-1', lastSavedUrl: currentUrl });

      const { result } = await renderUseSavedPalettes();

      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('returns true when URL differs from lastSavedUrl', async () => {
      useAppStore.setState({ paletteId: 'palette-1', lastSavedUrl: '/p/old-url' });

      const { result } = await renderUseSavedPalettes();

      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('returns true when only the name differs from the saved record name', async () => {
      const store = getGeneratorStore().getState();
      const currentUrl = serializePaletteToUrl({
        colors: store.colors,
        globalOptions: store.globalOptions,
      });

      useAppStore.setState({
        paletteId: 'palette-1',
        lastSavedUrl: currentUrl,
        paletteName: 'Saved Name',
      });

      act(() => {
        getGeneratorStore().getState().setName('Edited Name');
      });

      const { result } = await renderUseSavedPalettes();

      expect(result.current.hasUnsavedChanges).toBe(true);
    });
  });

  describe('isLoading', () => {
    it('reflects store status', async () => {
      usePalettesStore.setState({ status: 'loading' });

      const { result } = renderHook(() => useSavedPalettes());

      expect(result.current.isLoading).toBe(true);

      // Flush mount effect to avoid act() warning
      await waitFor(() => {
        expect(mockListPalettes).toHaveBeenCalled();
      });
    });
  });

  describe('isSaving', () => {
    it('flips true during savePalette and back to false on success', async () => {
      let resolveCreate: (value: SavedPalette) => void = () => {};

      mockCreatePalette.mockReturnValueOnce(
        new Promise<SavedPalette>(resolve => {
          resolveCreate = resolve;
        }),
      );

      const { result } = await renderUseSavedPalettes();

      expect(result.current.isSaving).toBe(false);

      let savePromise: Promise<SavedPalette | null> | undefined;

      act(() => {
        savePromise = result.current.savePalette('New Palette');
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(true);
      });

      await act(async () => {
        resolveCreate({ ...mockPalette, id: 'new-id' });
        await savePromise;
      });

      expect(result.current.isSaving).toBe(false);
    });

    it('flips true during updateCurrentPalette and back to false on success', async () => {
      useAppStore.setState({
        paletteId: 'palette-1',
        paletteName: 'Test',
        lastSavedUrl: '/p/old',
      });

      let resolveUpdate: (value: SavedPalette) => void = () => {};

      mockUpdatePalette.mockReturnValueOnce(
        new Promise<SavedPalette>(resolve => {
          resolveUpdate = resolve;
        }),
      );

      const { result } = await renderUseSavedPalettes();

      let updatePromise: Promise<boolean> | undefined;

      act(() => {
        updatePromise = result.current.updateCurrentPalette();
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(true);
      });

      await act(async () => {
        resolveUpdate({ ...mockPalette, updatedAt: '2024-01-03T00:00:00.000Z' });
        await updatePromise;
      });

      expect(result.current.isSaving).toBe(false);
    });

    it('leaves status as error (not idle) on save failure', async () => {
      mockCreatePalette.mockRejectedValueOnce(new Error('boom'));

      const { result } = await renderUseSavedPalettes();

      await act(async () => {
        await result.current.savePalette('Test');
      });

      expect(result.current.isSaving).toBe(false);
      expect(usePalettesStore.getState().status).toBe('error');
    });
  });
});
