import { renderHook, waitFor } from '@testing-library/react';

import usePaletteIdSync from '~/hooks/usePaletteIdSync';
import { useAppStore } from '~/stores/appStore';
import { usePalettesStore } from '~/stores/palettesStore';

import type { SavedPalette } from '~/types';

const mockNavigate = vi.fn();
let mockLocation = { pathname: '/p/Primary-FF0044', search: '' };

vi.mock('react-router', () => ({
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate,
}));

let mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null as { $id: string } | null,
};

vi.mock('~/hooks/useAuth', () => ({
  default: () => mockAuthState,
}));

const mockGetPalette = vi.fn();

vi.mock('~/services/palettes', () => ({
  getPalette: (...arguments_: unknown[]) => mockGetPalette(...arguments_),
}));

const mockPalette: SavedPalette = {
  $id: 'palette-123',
  $createdAt: '2024-01-01T00:00:00.000Z',
  $updatedAt: '2024-01-02T00:00:00.000Z',
  $permissions: [],
  $databaseId: 'color-lab',
  $tableId: 'palettes',
  $sequence: 1,
  userId: 'user-1',
  name: 'Test Palette',
  url: '/p/Primary-FF0044?id=palette-123',
  isFavorite: false,
};

describe('hooks/usePaletteIdSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation = { pathname: '/p/Primary-FF0044', search: '' };
    mockAuthState = { isAuthenticated: false, isLoading: false, user: null };
    mockGetPalette.mockResolvedValue(null);
    useAppStore.setState({
      loadedPaletteId: null,
      loadedPaletteName: 'Palette',
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
      mockLocation = { pathname: '/p/Primary-FF0044', search: '' };
      useAppStore.setState({ loadedPaletteId: 'palette-123' });

      renderHook(() => usePaletteIdSync());

      expect(useAppStore.getState().loadedPaletteId).toBe(null);
    });

    it('does nothing when URL has no ID and no palette loaded', () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '' };

      renderHook(() => usePaletteIdSync());

      expect(useAppStore.getState().loadedPaletteId).toBe(null);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('auth loading state', () => {
    it('does nothing while auth is loading', () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '?id=palette-123' };
      mockAuthState = { isAuthenticated: false, isLoading: true, user: null };

      renderHook(() => usePaletteIdSync());

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockGetPalette).not.toHaveBeenCalled();
    });
  });

  describe('unauthenticated user with ID in URL', () => {
    it('removes ID from URL and clears state', () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '?id=palette-123' };
      mockAuthState = { isAuthenticated: false, isLoading: false, user: null };

      renderHook(() => usePaletteIdSync());

      expect(mockNavigate).toHaveBeenCalledWith('/p/Primary-FF0044', { replace: true });
      expect(useAppStore.getState().loadedPaletteId).toBe(null);
    });
  });

  describe('authenticated user - cache hit', () => {
    it('loads palette from cache when found with matching userId', () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '?id=palette-123' };
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { $id: 'user-1' } };
      usePalettesStore.setState({ palettes: [mockPalette] });

      renderHook(() => usePaletteIdSync());

      expect(mockGetPalette).not.toHaveBeenCalled();
      expect(useAppStore.getState().loadedPaletteId).toBe('palette-123');
      expect(useAppStore.getState().loadedPaletteName).toBe('Test Palette');
      expect(useAppStore.getState().lastSavedUrl).toBe('/p/Primary-FF0044?id=palette-123');
    });

    it('does not load from cache when userId does not match', async () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '?id=palette-123' };
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { $id: 'other-user' } };
      usePalettesStore.setState({ palettes: [mockPalette] });
      mockGetPalette.mockResolvedValue(null);

      renderHook(() => usePaletteIdSync());

      await waitFor(() => {
        expect(mockGetPalette).toHaveBeenCalledWith('palette-123');
      });
    });
  });

  describe('authenticated user - API fallback', () => {
    it('fetches from API when not in cache and sets state on success', async () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '?id=palette-123' };
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { $id: 'user-1' } };
      mockGetPalette.mockResolvedValue(mockPalette);

      renderHook(() => usePaletteIdSync());

      await waitFor(() => {
        expect(mockGetPalette).toHaveBeenCalledWith('palette-123');
      });

      expect(useAppStore.getState().loadedPaletteId).toBe('palette-123');
      expect(useAppStore.getState().loadedPaletteName).toBe('Test Palette');
    });

    it('removes ID and clears state when API returns null', async () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '?id=palette-123' };
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { $id: 'user-1' } };
      mockGetPalette.mockResolvedValue(null);

      renderHook(() => usePaletteIdSync());

      await waitFor(() => {
        expect(mockGetPalette).toHaveBeenCalledWith('palette-123');
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/p/Primary-FF0044', { replace: true });
      });

      expect(useAppStore.getState().loadedPaletteId).toBe(null);
    });

    it('removes ID and clears state when API returns palette with wrong userId', async () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '?id=palette-123' };
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { $id: 'user-1' } };
      mockGetPalette.mockResolvedValue({ ...mockPalette, userId: 'other-user' });

      renderHook(() => usePaletteIdSync());

      await waitFor(() => {
        expect(mockGetPalette).toHaveBeenCalledWith('palette-123');
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/p/Primary-FF0044', { replace: true });
      });

      expect(useAppStore.getState().loadedPaletteId).toBe(null);
    });
  });

  describe('validation flag', () => {
    it('does not re-validate on same path after initial validation', async () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '?id=palette-123' };
      mockAuthState = { isAuthenticated: true, isLoading: false, user: { $id: 'user-1' } };
      usePalettesStore.setState({ palettes: [mockPalette] });

      const { rerender } = renderHook(() => usePaletteIdSync());

      expect(useAppStore.getState().loadedPaletteId).toBe('palette-123');

      // Rerender without changing location
      rerender();

      // Should only have set state once
      expect(mockGetPalette).not.toHaveBeenCalled();
    });
  });

  describe('URL with additional query params', () => {
    it('preserves other query params when removing ID', () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '?f=1.8&id=palette-123' };
      mockAuthState = { isAuthenticated: false, isLoading: false, user: null };

      renderHook(() => usePaletteIdSync());

      expect(mockNavigate).toHaveBeenCalledWith('/p/Primary-FF0044?f=1.8', { replace: true });
    });
  });
});
