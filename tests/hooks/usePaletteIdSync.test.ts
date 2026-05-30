import { act, renderHook, waitFor } from '@testing-library/react';

import usePaletteIdSync from '~/hooks/usePaletteIdSync';
import { useAppStore } from '~/stores/appStore';
import { usePalettesStore } from '~/stores/palettesStore';
import { mockAddToast, mockRouter, setMockRoute } from '~/test-mocks';

import type { SavedPalette } from '~/types';

let mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null as { uid: string } | null,
};

vi.mock('~/hooks/useAuth', () => ({
  default: () => mockAuthState,
}));

const mockGetPalette = vi.fn();
const mockMigratePaletteUrl = vi.fn();

vi.mock('~/services/palettes', () => ({
  getPalette: (...arguments_: unknown[]) => mockGetPalette(...arguments_),
  migratePaletteUrl: (...arguments_: unknown[]) => mockMigratePaletteUrl(...arguments_),
}));

const mockPalette: SavedPalette = {
  id: 'palette-123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  userId: 'user-1',
  name: 'Test Palette',
  url: '/p/Primary-FF0044?id=palette-123',
  isFavorite: false,
};

describe('hooks/usePaletteIdSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockRoute('/p/Primary-FF0044');
    mockAuthState = { isAuthenticated: false, isLoading: false, user: null };
    mockGetPalette.mockResolvedValue({ kind: 'not-found' });
    mockMigratePaletteUrl.mockResolvedValue(undefined);
    useAppStore.setState({
      paletteId: null,
      paletteName: 'Palette',
      lastSavedUrl: null,
    });
    usePalettesStore.setState({
      error: null,
      palettes: [],
      status: 'idle',
    });
  });

  describe('no ID in URL', () => {
    it('clears loaded palette when URL has no ID but one was loaded', () => {
      setMockRoute('/p/Primary-FF0044');
      useAppStore.setState({ paletteId: 'palette-123' });

      renderHook(() => usePaletteIdSync());

      expect(useAppStore.getState().paletteId).toBe(null);
    });

    it('does nothing when URL has no ID and no palette loaded', () => {
      setMockRoute('/p/Primary-FF0044');

      renderHook(() => usePaletteIdSync());

      expect(useAppStore.getState().paletteId).toBe(null);
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  describe('auth loading state', () => {
    it('does nothing while auth is loading', () => {
      setMockRoute('/p/Primary-FF0044?id=palette-123');
      mockAuthState = { isAuthenticated: false, isLoading: true, user: null };

      renderHook(() => usePaletteIdSync());

      expect(mockRouter.replace).not.toHaveBeenCalled();
      expect(mockGetPalette).not.toHaveBeenCalled();
    });
  });

  describe('unauthenticated user with ID in URL', () => {
    it('removes ID from URL and clears state', () => {
      setMockRoute('/p/Primary-FF0044?id=palette-123');
      mockAuthState = { isAuthenticated: false, isLoading: false, user: null };

      renderHook(() => usePaletteIdSync());

      expect(mockRouter.replace).toHaveBeenCalledWith('/p/Primary-FF0044');
      expect(useAppStore.getState().paletteId).toBe(null);
    });
  });

  describe('authenticated user - cache hit', () => {
    it('loads palette from cache when found with matching userId, canonicalising legacy URL', () => {
      setMockRoute('/p/Primary-FF0044?id=palette-123');
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { uid: 'user-1' } };
      usePalettesStore.setState({ palettes: [mockPalette] });

      renderHook(() => usePaletteIdSync());

      expect(mockGetPalette).not.toHaveBeenCalled();
      expect(useAppStore.getState().paletteId).toBe('palette-123');
      expect(useAppStore.getState().paletteName).toBe('Test Palette');
      expect(useAppStore.getState().lastSavedUrl).toMatch(/^\/p\/Primary-\d/);
      expect(useAppStore.getState().lastSavedUrl).toContain('?id=palette-123');
      expect(mockMigratePaletteUrl).toHaveBeenCalledWith('palette-123', expect.any(String));
    });

    it('does not migrate or rewrite a palette already in canonical OKLCH form', () => {
      const canonicalUrl = '/p/Primary-63.27_0.254_19.9?id=palette-123';

      setMockRoute(canonicalUrl);
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { uid: 'user-1' } };
      usePalettesStore.setState({
        palettes: [{ ...mockPalette, url: canonicalUrl }],
      });

      renderHook(() => usePaletteIdSync());

      expect(mockMigratePaletteUrl).not.toHaveBeenCalled();
      expect(useAppStore.getState().lastSavedUrl).toBe(canonicalUrl);
    });

    it('does not load from cache when userId does not match', async () => {
      setMockRoute('/p/Primary-FF0044?id=palette-123');
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { uid: 'other-user' } };
      usePalettesStore.setState({ palettes: [mockPalette] });
      mockGetPalette.mockResolvedValue({ kind: 'not-found' });

      renderHook(() => usePaletteIdSync());

      await waitFor(() => {
        expect(mockGetPalette).toHaveBeenCalledWith('palette-123');
      });
    });
  });

  describe('authenticated user - API fallback', () => {
    it('fetches from API when not in cache and sets state on success', async () => {
      setMockRoute('/p/Primary-FF0044?id=palette-123');
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { uid: 'user-1' } };
      mockGetPalette.mockResolvedValue({ kind: 'success', palette: mockPalette });

      renderHook(() => usePaletteIdSync());

      await waitFor(() => {
        expect(mockGetPalette).toHaveBeenCalledWith('palette-123');
      });

      expect(useAppStore.getState().paletteId).toBe('palette-123');
      expect(useAppStore.getState().paletteName).toBe('Test Palette');
    });

    it('removes ID and clears state when API returns not-found', async () => {
      setMockRoute('/p/Primary-FF0044?id=palette-123');
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { uid: 'user-1' } };
      mockGetPalette.mockResolvedValue({ kind: 'not-found' });

      renderHook(() => usePaletteIdSync());

      await waitFor(() => {
        expect(mockGetPalette).toHaveBeenCalledWith('palette-123');
      });

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/p/Primary-FF0044');
      });

      expect(useAppStore.getState().paletteId).toBe(null);
    });

    it('removes ID and clears state when API returns palette with wrong userId', async () => {
      setMockRoute('/p/Primary-FF0044?id=palette-123');
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { uid: 'user-1' } };
      mockGetPalette.mockResolvedValue({
        kind: 'success',
        palette: { ...mockPalette, userId: 'other-user' },
      });

      renderHook(() => usePaletteIdSync());

      await waitFor(() => {
        expect(mockGetPalette).toHaveBeenCalledWith('palette-123');
      });

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/p/Primary-FF0044');
      });

      expect(useAppStore.getState().paletteId).toBe(null);
    });

    it('keeps ID, shows toast, and skips navigation on error', async () => {
      setMockRoute('/p/Primary-FF0044?id=palette-123');
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { uid: 'user-1' } };
      mockGetPalette.mockResolvedValue({ kind: 'error', error: new Error('Network') });

      renderHook(() => usePaletteIdSync());

      await waitFor(() => {
        expect(mockGetPalette).toHaveBeenCalledWith('palette-123');
      });

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Could not load palette',
          color: 'danger',
        }),
      );
      expect(mockRouter.replace).not.toHaveBeenCalled();
      expect(useAppStore.getState().paletteId).toBe(null);
    });
  });

  describe('validation flag', () => {
    it('does not re-validate on same path after initial validation', async () => {
      setMockRoute('/p/Primary-FF0044?id=palette-123');
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { uid: 'user-1' } };
      usePalettesStore.setState({ palettes: [mockPalette] });

      const { rerender } = renderHook(() => usePaletteIdSync());

      expect(useAppStore.getState().paletteId).toBe('palette-123');

      rerender();

      expect(mockGetPalette).not.toHaveBeenCalled();
    });
  });

  describe('URL with additional query params', () => {
    it('preserves other query params when removing ID', () => {
      setMockRoute('/p/Primary-FF0044?f=1.8&id=palette-123');
      mockAuthState = { isAuthenticated: false, isLoading: false, user: null };

      renderHook(() => usePaletteIdSync());

      expect(mockRouter.replace).toHaveBeenCalledWith('/p/Primary-FF0044?f=1.8');
    });
  });

  describe('clearPalette guard', () => {
    it('does not clear when paletteId is set in store while location is unchanged (savePalette race)', () => {
      setMockRoute('/p/Primary-FF0044');
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { uid: 'user-1' } };

      const { rerender } = renderHook(() => usePaletteIdSync());

      expect(useAppStore.getState().paletteId).toBe(null);

      act(() => {
        useAppStore.setState({
          paletteId: 'palette-123',
          paletteName: 'Shim',
          lastSavedUrl: '/p/Primary-FF0044?id=palette-123',
        });
      });

      rerender();

      expect(useAppStore.getState().paletteId).toBe('palette-123');
      expect(useAppStore.getState().paletteName).toBe('Shim');
    });

    it('clears when SPA navigation moves to a fresh /p/* without id', () => {
      setMockRoute('/p/Primary-FF0044?id=palette-123');
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { uid: 'user-1' } };
      usePalettesStore.setState({ palettes: [mockPalette] });
      useAppStore.setState({
        paletteId: 'palette-123',
        paletteName: 'Loaded',
        lastSavedUrl: '/p/Primary-FF0044?id=palette-123',
      });

      const { rerender } = renderHook(() => usePaletteIdSync());

      setMockRoute('/p/Secondary-00FF00');
      rerender();

      expect(useAppStore.getState().paletteId).toBe(null);
      expect(useAppStore.getState().paletteName).toBe('Color Palette');
    });
  });
});
