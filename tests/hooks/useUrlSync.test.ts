import { act, renderHook } from '@testing-library/react';

import usePalette from '~/hooks/usePalette';
import useUrlSync from '~/hooks/useUrlSync';
import { useAppStore } from '~/stores/appStore';
import { CRIMSON } from '~/test-fixtures';
import { getPaletteStore, mockRouter, setMockRoute } from '~/test-mocks';
import { toOklch } from '~/utils/color';
import { createPalette, getDefaultGlobalOptions } from '~/utils/palette';

async function flushObserver() {
  await act(async () => {
    await Promise.resolve();
  });
}

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
    vi.clearAllMocks();
    setMockRoute('/');

    const palette = createPalette();

    getPaletteStore().setState({ ...palette, activeColorId: palette.colors[0].id });
    useAppStore.setState({
      paletteId: null,
      paletteName: 'Palette',
      lastSavedUrl: null,
    });
  });

  describe('initialization', () => {
    it('creates fresh palette when no URL palette exists', () => {
      setMockRoute('/');

      renderHook(() => useUrlSync());

      const state = getPaletteStore().getState();

      expect(state.colors).toHaveLength(1);
      expect(state.colors[0].name).toBe('Primary');
      expect(state.globalOptions).toEqual(getDefaultGlobalOptions(state.colors[0].value));
    });

    it('parses palette from valid URL', () => {
      setMockRoute('/p/Primary-FF0044/Secondary-00FF00');

      renderHook(() => useUrlSync());

      const state = getPaletteStore().getState();

      expect(state.colors).toHaveLength(2);
      expect(state.colors[0].name).toBe('Primary');
      expect(state.colors[0].value).toBe(CRIMSON);
      expect(state.colors[1].name).toBe('Secondary');
      expect(state.colors[1].value).toBe('oklch(86.64% 0.295 142.5)');
    });

    it('parses global options from query params', () => {
      setMockRoute('/p/Primary-FF0044?f=1.8&i=15');

      renderHook(() => useUrlSync());

      const state = getPaletteStore().getState();

      expect(state.globalOptions.lightnessCurve).toBe(1.8);
      expect(state.globalOptions.steps).toBe(15);
    });

    it('parses per-color overrides from URL', () => {
      setMockRoute('/p/Primary-FF0044-x:0.9,m:d');

      renderHook(() => useUrlSync());

      const state = getPaletteStore().getState();

      expect(state.colors[0].overrides).toEqual({ maxLightness: 0.9, mode: 'dark' });
    });

    it('creates fresh palette for invalid URL', () => {
      setMockRoute('/p/InvalidColor');

      renderHook(() => useUrlSync());

      const state = getPaletteStore().getState();

      expect(state.colors).toHaveLength(1);
      expect(state.colors[0].name).toBe('Primary');
      expect(state.activeColorId).toBe(state.colors[0].id);
    });

    it('resets activeColorId to first color when URL hydrates with new ids', () => {
      getPaletteStore().setState({ activeColorId: 'stale-id-from-prior-session' });
      setMockRoute('/p/Primary-FF0044/Secondary-00FF00');

      renderHook(() => useUrlSync());

      const state = getPaletteStore().getState();

      expect(state.activeColorId).toBe(state.colors[0].id);
    });

    it('preserves existing color ids when URL parse triggers state update', () => {
      getPaletteStore().setState({
        colors: [
          { id: 'fixed-id-1', name: 'Primary', value: toOklch('#FF0044') },
          { id: 'fixed-id-2', name: 'Secondary', value: toOklch('#00FF00') },
        ],
        activeColorId: 'fixed-id-1',
      });

      setMockRoute('/p/Primary-FF0044-x:0.9/Secondary-00FF00');

      renderHook(() => useUrlSync());

      const state = getPaletteStore().getState();

      expect(state.colors[0].id).toBe('fixed-id-1');
      expect(state.colors[1].id).toBe('fixed-id-2');
      expect(state.colors[0].overrides).toEqual({ maxLightness: 0.9 });
      expect(state.activeColorId).toBe('fixed-id-1');
    });
  });

  describe('URL navigation', () => {
    it('navigates to URL on initial mount when no palette in URL', () => {
      setMockRoute('/');

      renderHook(() => useUrlSync());

      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringMatching(/^\/p\/Primary-[\d._]+$/),
      );
    });

    it('does not navigate on initial mount when palette URL is already canonical OKLCH', () => {
      setMockRoute('/p/Primary-63.27_0.254_19.9');

      renderHook(() => useUrlSync());

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it('rewrites legacy hex URL to canonical OKLCH form with replace', () => {
      setMockRoute('/p/Primary-FF0044');

      renderHook(() => useUrlSync());

      expect(mockRouter.replace).toHaveBeenCalledTimes(1);
      expect(mockRouter.replace).toHaveBeenCalledWith('/p/Primary-63.27_0.254_19.9');
      expect(getPaletteStore().getState().colors[0].value).toBe(CRIMSON);
    });

    it('rewrites legacy 0-1 OKLCH URL to percentage form with replace', () => {
      setMockRoute('/p/Primary-0.64_0.142_329');

      renderHook(() => useUrlSync());

      expect(mockRouter.replace).toHaveBeenCalledTimes(1);
      expect(mockRouter.replace).toHaveBeenCalledWith('/p/Primary-64_0.142_329');
    });

    it('preserves id query when canonicalising legacy URL', () => {
      setMockRoute('/p/Primary-FF0044?id=abc123');
      useAppStore.setState({ paletteId: 'abc123' });

      renderHook(() => useUrlSync());

      expect(mockRouter.replace).toHaveBeenCalledTimes(1);
      expect(mockRouter.replace).toHaveBeenCalledWith('/p/Primary-63.27_0.254_19.9?id=abc123');
    });

    it('preserves id query when canonicalising before store has paletteId', () => {
      setMockRoute('/p/Primary-FF0044?id=abc123');

      renderHook(() => useUrlSync());

      expect(mockRouter.replace).toHaveBeenCalledTimes(1);
      expect(mockRouter.replace).toHaveBeenCalledWith('/p/Primary-63.27_0.254_19.9?id=abc123');
    });

    it('does not navigate when canonical URL with id matches before store sync', () => {
      setMockRoute('/p/Primary-63.27_0.254_19.9?id=abc123');

      renderHook(() => useUrlSync());

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it('navigates when state changes', () => {
      setMockRoute('/p/Primary-0.64_0.142_329');

      renderHook(() => useUrlSync());
      const { result } = renderHook(() => usePalette('addColor'));

      mockRouter.push.mockClear();
      mockRouter.replace.mockClear();

      act(() => {
        result.current.addColor(toOklch('oklch(0.7 0.15 180)'));
      });

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining('/p/Primary-64_0.142_329/Secondary-'),
      );
    });
  });

  describe('session palette path (Header logo)', () => {
    it('seeds sessionPalettePath from the current palette on mount', () => {
      setMockRoute('/p/Primary-63.27_0.254_19.9');

      renderHook(() => useUrlSync());

      expect(useAppStore.getState().sessionPalettePath).toMatch(/^\/p\/Primary-/);
    });

    it('updates sessionPalettePath when the palette changes', () => {
      setMockRoute('/p/Primary-63.27_0.254_19.9');

      renderHook(() => useUrlSync());
      const { result } = renderHook(() => usePalette('addColor'));

      act(() => {
        result.current.addColor(toOklch('oklch(0.7 0.15 180)'));
      });

      expect(useAppStore.getState().sessionPalettePath).toContain('/Secondary-');
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
      setMockRoute('/p/Primary-FF0044');

      renderHook(() => useUrlSync());
      mockRouter.push.mockClear();
      mockRouter.replace.mockClear();

      interactingEl.setAttribute('data-interacting', 'true');
      await flushObserver();

      act(() => {
        getPaletteStore().setState(state => ({
          globalOptions: { ...state.globalOptions, steps: 12 },
        }));
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it('flushes once on release with latest state', async () => {
      setMockRoute('/p/Primary-FF0044');

      renderHook(() => useUrlSync());
      mockRouter.push.mockClear();
      mockRouter.replace.mockClear();

      interactingEl.setAttribute('data-interacting', 'true');
      await flushObserver();

      act(() => {
        getPaletteStore().setState(state => ({
          globalOptions: { ...state.globalOptions, steps: 12 },
        }));
      });
      act(() => {
        getPaletteStore().setState(state => ({
          globalOptions: { ...state.globalOptions, steps: 15 },
        }));
      });

      expect(mockRouter.push).not.toHaveBeenCalled();

      interactingEl.removeAttribute('data-interacting');
      await flushObserver();

      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('i=15'));
    });

    it('resumes normal sync after release', async () => {
      setMockRoute('/p/Primary-FF0044');

      renderHook(() => useUrlSync());
      mockRouter.push.mockClear();
      mockRouter.replace.mockClear();

      interactingEl.setAttribute('data-interacting', 'true');
      await flushObserver();
      interactingEl.removeAttribute('data-interacting');
      await flushObserver();

      mockRouter.push.mockClear();

      act(() => {
        getPaletteStore().setState(state => ({
          globalOptions: { ...state.globalOptions, steps: 20 },
        }));
      });

      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('i=20'));
    });
  });
});
