import { act, renderHook } from '@testing-library/react';
import { formatCSS, parseCSS } from 'colorizr';

import usePalette from '~/hooks/usePalette';
import useUrlSync from '~/hooks/useUrlSync';
import { useAppStore } from '~/stores/appStore';
import { usePaletteStore } from '~/stores/paletteStore';
import { createPalette, getDefaultGlobalOptions } from '~/utils/palette';

function hexToOklch(hex: string): string {
  return formatCSS(parseCSS(hex, 'oklch'), { format: 'oklch' });
}

const mockNavigate = vi.fn();
let mockLocation = { pathname: '/', search: '' };

vi.mock('react-router', () => ({
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate,
}));

vi.mock('~/hooks/useAuth', () => ({
  default: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

vi.mock('~/services/palettes', () => ({
  getPalette: vi.fn().mockResolvedValue(null),
}));

describe('hooks/useUrlSync', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLocation = { pathname: '/', search: '' };
    usePaletteStore.setState(createPalette());
    useAppStore.setState({
      loadedPaletteId: null,
      loadedPaletteName: 'Palette',
      lastSavedUrl: null,
    });
  });

  describe('initialization', () => {
    it('creates fresh palette when no URL palette exists', () => {
      mockLocation = { pathname: '/', search: '' };

      renderHook(() => useUrlSync());

      const state = usePaletteStore.getState();

      expect(state.colors).toHaveLength(1);
      expect(state.colors[0].name).toBe('Primary');
      expect(state.globalOptions).toEqual(getDefaultGlobalOptions(state.colors[0].value));
    });

    it('parses palette from valid URL', () => {
      mockLocation = { pathname: '/p/Primary-FF0044/Secondary-00FF00', search: '' };

      renderHook(() => useUrlSync());

      const state = usePaletteStore.getState();

      expect(state.colors).toHaveLength(2);
      expect(state.colors[0].name).toBe('Primary');
      expect(state.colors[0].value).toBe(hexToOklch('#FF0044'));
      expect(state.colors[1].name).toBe('Secondary');
      expect(state.colors[1].value).toBe(hexToOklch('#00FF00'));
    });

    it('parses global options from query params', () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '?f=1.8&i=15' };

      renderHook(() => useUrlSync());

      const state = usePaletteStore.getState();

      expect(state.globalOptions.lightnessCurve).toBe(1.8);
      expect(state.globalOptions.steps).toBe(15);
    });

    it('parses per-color overrides from URL', () => {
      mockLocation = { pathname: '/p/Primary-FF0044-x:0.9,m:d', search: '' };

      renderHook(() => useUrlSync());

      const state = usePaletteStore.getState();

      expect(state.colors[0].overrides).toEqual({ maxLightness: 0.9, mode: 'dark' });
    });

    it('creates fresh palette for invalid URL', () => {
      mockLocation = { pathname: '/p/InvalidColor', search: '' };

      renderHook(() => useUrlSync());

      const state = usePaletteStore.getState();

      expect(state.colors).toHaveLength(1);
      expect(state.colors[0].name).toBe('Primary');
    });
  });

  describe('URL navigation', () => {
    it('navigates to URL on initial mount when no palette in URL', () => {
      mockLocation = { pathname: '/', search: '' };

      renderHook(() => useUrlSync());

      expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/p\/Primary-[\d._]+$/), {
        replace: true,
      });
    });

    it('does not navigate on initial mount when palette exists in URL', () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '' };

      renderHook(() => useUrlSync());

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates when state changes', () => {
      mockLocation = { pathname: '/p/Primary-0.64_0.142_329', search: '' };

      renderHook(() => useUrlSync());
      const { result } = renderHook(() => usePalette());

      mockNavigate.mockClear();

      act(() => {
        result.current.addColor('oklch(0.7 0.15 180)');
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/p/Primary-0.64_0.142_329/Secondary-'),
      );
    });
  });
});
