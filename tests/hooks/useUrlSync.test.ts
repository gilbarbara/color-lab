import { act, renderHook } from '@testing-library/react';

import usePalette from '~/hooks/usePalette';
import useUrlSync from '~/hooks/useUrlSync';
import { useAppStore } from '~/stores/appStore';
import { usePaletteStore } from '~/stores/paletteStore';
import { CRIMSON } from '~/test-fixtures';
import { toOklch } from '~/utils/color';
import { createPalette, getDefaultGlobalOptions } from '~/utils/palette';

async function flushObserver() {
  await act(async () => {
    await Promise.resolve();
  });
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

    const palette = createPalette();

    usePaletteStore.setState({ ...palette, activeColorId: palette.colors[0].id });
    useAppStore.setState({
      paletteId: null,
      paletteName: 'Palette',
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
      expect(state.colors[0].value).toBe(CRIMSON);
      expect(state.colors[1].name).toBe('Secondary');
      expect(state.colors[1].value).toBe('oklch(86.64% 0.295 142.5)');
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
      expect(state.activeColorId).toBe(state.colors[0].id);
    });

    it('resets activeColorId to first color when URL hydrates with new ids', () => {
      usePaletteStore.setState({ activeColorId: 'stale-id-from-prior-session' });
      mockLocation = { pathname: '/p/Primary-FF0044/Secondary-00FF00', search: '' };

      renderHook(() => useUrlSync());

      const state = usePaletteStore.getState();

      expect(state.activeColorId).toBe(state.colors[0].id);
    });

    it('preserves existing color ids when URL parse triggers state update', () => {
      usePaletteStore.setState({
        colors: [
          { id: 'fixed-id-1', name: 'Primary', value: toOklch('#FF0044') },
          { id: 'fixed-id-2', name: 'Secondary', value: toOklch('#00FF00') },
        ],
        activeColorId: 'fixed-id-1',
      });

      mockLocation = {
        pathname: '/p/Primary-FF0044-x:0.9/Secondary-00FF00',
        search: '',
      };

      renderHook(() => useUrlSync());

      const state = usePaletteStore.getState();

      expect(state.colors[0].id).toBe('fixed-id-1');
      expect(state.colors[1].id).toBe('fixed-id-2');
      expect(state.colors[0].overrides).toEqual({ maxLightness: 0.9 });
      expect(state.activeColorId).toBe('fixed-id-1');
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

    it('does not navigate on initial mount when palette URL is already canonical OKLCH', () => {
      mockLocation = { pathname: '/p/Primary-63.27_0.254_19.9', search: '' };

      renderHook(() => useUrlSync());

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('rewrites legacy hex URL to canonical OKLCH form with replace', () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '' };

      renderHook(() => useUrlSync());

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/p/Primary-63.27_0.254_19.9', {
        replace: true,
      });
      expect(usePaletteStore.getState().colors[0].value).toBe(CRIMSON);
    });

    it('rewrites legacy 0-1 OKLCH URL to percentage form with replace', () => {
      mockLocation = { pathname: '/p/Primary-0.64_0.142_329', search: '' };

      renderHook(() => useUrlSync());

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/p/Primary-64_0.142_329', { replace: true });
    });

    it('preserves id query when canonicalising legacy URL', () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '?id=abc123' };
      useAppStore.setState({ paletteId: 'abc123' });

      renderHook(() => useUrlSync());

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/p/Primary-63.27_0.254_19.9?id=abc123', {
        replace: true,
      });
    });

    it('preserves id query when canonicalising before store has paletteId', () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '?id=abc123' };

      renderHook(() => useUrlSync());

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/p/Primary-63.27_0.254_19.9?id=abc123', {
        replace: true,
      });
    });

    it('does not navigate when canonical URL with id matches before store sync', () => {
      mockLocation = {
        pathname: '/p/Primary-63.27_0.254_19.9',
        search: '?id=abc123',
      };

      renderHook(() => useUrlSync());

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates when state changes', () => {
      mockLocation = { pathname: '/p/Primary-0.64_0.142_329', search: '' };

      renderHook(() => useUrlSync());
      const { result } = renderHook(() => usePalette('addColor'));

      mockNavigate.mockClear();

      act(() => {
        result.current.addColor(toOklch('oklch(0.7 0.15 180)'));
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/p/Primary-64_0.142_329/Secondary-'),
      );
    });
  });

  describe('interaction pause', () => {
    let interactingEl: HTMLDivElement;

    beforeEach(() => {
      interactingEl = document.createElement('div');
      document.body.appendChild(interactingEl);
    });

    afterEach(() => {
      interactingEl.remove();
    });

    it('pauses URL updates while data-interacting is true', async () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '' };

      renderHook(() => useUrlSync());
      mockNavigate.mockClear();

      interactingEl.setAttribute('data-interacting', 'true');
      await flushObserver();

      act(() => {
        usePaletteStore.setState(state => ({
          globalOptions: { ...state.globalOptions, steps: 12 },
        }));
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('flushes once on release with latest state', async () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '' };

      renderHook(() => useUrlSync());
      mockNavigate.mockClear();

      interactingEl.setAttribute('data-interacting', 'true');
      await flushObserver();

      act(() => {
        usePaletteStore.setState(state => ({
          globalOptions: { ...state.globalOptions, steps: 12 },
        }));
      });
      act(() => {
        usePaletteStore.setState(state => ({
          globalOptions: { ...state.globalOptions, steps: 15 },
        }));
      });

      expect(mockNavigate).not.toHaveBeenCalled();

      interactingEl.removeAttribute('data-interacting');
      await flushObserver();

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('i=15'));
    });

    it('resumes normal sync after release', async () => {
      mockLocation = { pathname: '/p/Primary-FF0044', search: '' };

      renderHook(() => useUrlSync());
      mockNavigate.mockClear();

      interactingEl.setAttribute('data-interacting', 'true');
      await flushObserver();
      interactingEl.removeAttribute('data-interacting');
      await flushObserver();

      mockNavigate.mockClear();

      act(() => {
        usePaletteStore.setState(state => ({
          globalOptions: { ...state.globalOptions, steps: 20 },
        }));
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('i=20'));
    });
  });
});
