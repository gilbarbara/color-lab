import { act, renderHook } from '@testing-library/react';

import usePalette from '~/hooks/usePalette';
import useUrlSync from '~/hooks/useUrlSync';
import { usePaletteStore } from '~/stores/paletteStore';
import { createPalette, getDefaultGlobalOptions } from '~/utils/palette';

const mockNavigate = vi.fn();
let mockLocation = { pathname: '/', search: '' };

vi.mock('react-router', () => ({
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate,
}));

describe('hooks/useUrlSync', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLocation = { pathname: '/', search: '' };
    usePaletteStore.setState(createPalette());
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
      expect(state.colors[0].value).toBe('#FF0044');
      expect(state.colors[1].name).toBe('Secondary');
      expect(state.colors[1].value).toBe('#00FF00');
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
      mockLocation = { pathname: '/p/Primary-FF0044', search: '' };

      renderHook(() => useUrlSync());
      const { result } = renderHook(() => usePalette());

      mockNavigate.mockClear();

      act(() => {
        result.current.addColor('#00FF00');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/p/Primary-FF0044/Secondary-00FF00');
    });
  });
});
