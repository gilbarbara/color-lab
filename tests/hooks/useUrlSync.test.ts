import { act, renderHook } from '@testing-library/react';

import useGenerator from '~/hooks/useGenerator';
import useUrlSync from '~/hooks/useUrlSync';
import { useAppStore } from '~/stores/appStore';
import { CRIMSON } from '~/test-fixtures';
import { getGeneratorStore, mockAddToast, setMockRoute } from '~/test-mocks';
import { toOklch } from '~/utils/color';
import { createPalette, getDefaultGlobalOptions } from '~/utils/generator';

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
  let historyPush: ReturnType<typeof vi.spyOn>;
  let historyReplace: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // commitPaletteUrl writes the URL via the History API (see useUrlSync). Stub the
    // native methods so we can assert commits without mutating jsdom's location.
    historyPush = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
    historyReplace = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    setMockRoute('/');

    const palette = createPalette();

    getGeneratorStore().setState({ ...palette, activeColorId: palette.colors[0].id });
    useAppStore.setState({
      paletteId: null,
      paletteName: 'Palette',
      lastSavedUrl: null,
    });
  });

  afterEach(() => {
    historyPush.mockRestore();
    historyReplace.mockRestore();
  });

  describe('initialization', () => {
    it('creates fresh palette when no URL palette exists', () => {
      setMockRoute('/');

      renderHook(() => useUrlSync());

      const state = getGeneratorStore().getState();

      expect(state.colors).toHaveLength(1);
      expect(state.colors[0].name).toBe('Primary');
      expect(state.globalOptions).toEqual(getDefaultGlobalOptions(state.colors[0].value));
    });

    it('parses palette from valid URL', () => {
      setMockRoute('/p/Primary-FF0044/Secondary-00FF00');

      renderHook(() => useUrlSync());

      const state = getGeneratorStore().getState();

      expect(state.colors).toHaveLength(2);
      expect(state.colors[0].name).toBe('Primary');
      expect(state.colors[0].value).toBe(CRIMSON);
      expect(state.colors[1].name).toBe('Secondary');
      expect(state.colors[1].value).toBe('oklch(86.64% 0.295 142.5)');
    });

    it('parses global options from query params', () => {
      setMockRoute('/p/Primary-FF0044?f=1.8&i=15');

      renderHook(() => useUrlSync());

      const state = getGeneratorStore().getState();

      expect(state.globalOptions.lightnessCurve).toBe(1.8);
      expect(state.globalOptions.steps).toBe(15);
    });

    it('parses per-color overrides from URL', () => {
      setMockRoute('/p/Primary-FF0044-x:0.9,m:d');

      renderHook(() => useUrlSync());

      const state = getGeneratorStore().getState();

      expect(state.colors[0].overrides).toEqual({ maxLightness: 0.9, mode: 'dark' });
    });

    it('creates fresh palette for invalid URL', () => {
      setMockRoute('/p/InvalidColor');

      renderHook(() => useUrlSync());

      const state = getGeneratorStore().getState();

      expect(state.colors).toHaveLength(1);
      expect(state.colors[0].name).toBe('Primary');
      expect(state.activeColorId).toBe(state.colors[0].id);
    });

    it('resets activeColorId to first color when URL hydrates with new ids', () => {
      getGeneratorStore().setState({ activeColorId: 'stale-id-from-prior-session' });
      setMockRoute('/p/Primary-FF0044/Secondary-00FF00');

      renderHook(() => useUrlSync());

      const state = getGeneratorStore().getState();

      expect(state.activeColorId).toBe(state.colors[0].id);
    });

    it('preserves existing color ids when URL parse triggers state update', () => {
      getGeneratorStore().setState({
        colors: [
          { id: 'fixed-id-1', name: 'Primary', value: toOklch('#FF0044') },
          { id: 'fixed-id-2', name: 'Secondary', value: toOklch('#00FF00') },
        ],
        activeColorId: 'fixed-id-1',
      });

      setMockRoute('/p/Primary-FF0044-x:0.9/Secondary-00FF00');

      renderHook(() => useUrlSync());

      const state = getGeneratorStore().getState();

      expect(state.colors[0].id).toBe('fixed-id-1');
      expect(state.colors[1].id).toBe('fixed-id-2');
      expect(state.colors[0].overrides).toEqual({ maxLightness: 0.9 });
      expect(state.activeColorId).toBe('fixed-id-1');
    });
  });

  describe('URL navigation', () => {
    it('does not navigate on bare entry with no palette in the URL', () => {
      // `/` and bare `/p` are the indexable anchors — `/` server-redirects visitors to a
      // palette URL, so the hook must not client-flip here (that's what duplicated tags).
      setMockRoute('/p');

      renderHook(() => useUrlSync());

      expect(historyReplace).not.toHaveBeenCalled();
      expect(historyPush).not.toHaveBeenCalled();
    });

    it('rewrites an unparseable /p/ URL to the seeded palette', () => {
      setMockRoute('/p/InvalidColor');

      renderHook(() => useUrlSync());

      expect(historyReplace).toHaveBeenCalledWith(
        null,
        '',
        expect.stringMatching(/^\/p\/Primary-[\d._]+$/),
      );
    });

    it('does not navigate on initial mount when palette URL is already canonical OKLCH', () => {
      setMockRoute('/p/Primary-63.27_0.254_19.9');

      renderHook(() => useUrlSync());

      expect(historyPush).not.toHaveBeenCalled();
      expect(historyReplace).not.toHaveBeenCalled();
    });

    it('rewrites legacy hex URL to canonical OKLCH form with replace', () => {
      setMockRoute('/p/Primary-FF0044');

      renderHook(() => useUrlSync());

      expect(historyReplace).toHaveBeenCalledTimes(1);
      expect(historyReplace).toHaveBeenCalledWith(null, '', '/p/Primary-63.27_0.254_19.9');
      expect(getGeneratorStore().getState().colors[0].value).toBe(CRIMSON);
    });

    it('rewrites legacy 0-1 OKLCH URL to percentage form with replace', () => {
      setMockRoute('/p/Primary-0.64_0.142_329');

      renderHook(() => useUrlSync());

      expect(historyReplace).toHaveBeenCalledTimes(1);
      expect(historyReplace).toHaveBeenCalledWith(null, '', '/p/Primary-64_0.142_329');
    });

    it('preserves id query when canonicalising legacy URL', () => {
      setMockRoute('/p/Primary-FF0044?id=abc123');
      useAppStore.setState({ paletteId: 'abc123' });

      renderHook(() => useUrlSync());

      expect(historyReplace).toHaveBeenCalledTimes(1);
      expect(historyReplace).toHaveBeenCalledWith(
        null,
        '',
        '/p/Primary-63.27_0.254_19.9?id=abc123',
      );
    });

    it('preserves id query when canonicalising before store has paletteId', () => {
      setMockRoute('/p/Primary-FF0044?id=abc123');

      renderHook(() => useUrlSync());

      expect(historyReplace).toHaveBeenCalledTimes(1);
      expect(historyReplace).toHaveBeenCalledWith(
        null,
        '',
        '/p/Primary-63.27_0.254_19.9?id=abc123',
      );
    });

    it('does not navigate when canonical URL with id matches before store sync', () => {
      setMockRoute('/p/Primary-63.27_0.254_19.9?id=abc123');

      renderHook(() => useUrlSync());

      expect(historyPush).not.toHaveBeenCalled();
      expect(historyReplace).not.toHaveBeenCalled();
    });

    it('drops invalid colors with a toast and rewrites to the cleaned URL', () => {
      // Mixed URL: one valid color, one unparseable. parsePaletteFromUrl keeps the valid
      // color and reports the bad slot via `dropped` (a full failure would return null and
      // hit the unparseable path instead).
      setMockRoute('/p/Primary-FF0044/Broken-ZZZZZZ');

      renderHook(() => useUrlSync());

      expect(getGeneratorStore().getState().colors).toHaveLength(1);
      expect(mockAddToast).toHaveBeenCalledWith({
        title: 'Dropped invalid color: Broken',
        color: 'warning',
      });
      expect(historyReplace).toHaveBeenCalledTimes(1);
      expect(historyReplace).toHaveBeenCalledWith(null, '', '/p/Primary-63.27_0.254_19.9');
    });

    it('commits to the URL when state changes', () => {
      setMockRoute('/p/Primary-0.64_0.142_329');

      renderHook(() => useUrlSync());
      const { result } = renderHook(() => useGenerator('addColor'));

      historyPush.mockClear();

      act(() => {
        result.current.addColor(toOklch('oklch(0.7 0.15 180)'));
      });

      expect(historyPush).toHaveBeenCalledWith(
        null,
        '',
        expect.stringContaining('/p/Primary-64_0.142_329/Secondary-'),
      );
    });

    it('does not re-commit when applying URL state (back/forward)', () => {
      // A back/forward fires popstate → Next updates the route → the hydrate effect writes
      // URL → store. The store → URL subscription must NOT push again: that extra entry
      // would clobber the forward-history entry and break the Forward button.
      setMockRoute('/p/Primary-FF0044/Secondary-00FF00');

      const { rerender } = renderHook(() => useUrlSync());

      historyPush.mockClear();

      // rerender() re-runs the hydrate effect with the new route (it flushes effects in act).
      setMockRoute('/p/Primary-FF0044');
      rerender();

      // Store followed the URL (2 → 1 colors)…
      expect(getGeneratorStore().getState().colors).toHaveLength(1);
      // …but no push was issued for that URL-driven change.
      expect(historyPush).not.toHaveBeenCalled();
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
      const { result } = renderHook(() => useGenerator('addColor'));

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
      historyPush.mockClear();
      historyReplace.mockClear();

      interactingEl.setAttribute('data-interacting', 'true');
      await flushObserver();

      act(() => {
        getGeneratorStore().setState(state => ({
          globalOptions: { ...state.globalOptions, steps: 12 },
        }));
      });

      expect(historyPush).not.toHaveBeenCalled();
      expect(historyReplace).not.toHaveBeenCalled();
    });

    it('flushes once on release with latest state', async () => {
      setMockRoute('/p/Primary-FF0044');

      renderHook(() => useUrlSync());
      historyPush.mockClear();
      historyReplace.mockClear();

      interactingEl.setAttribute('data-interacting', 'true');
      await flushObserver();

      act(() => {
        getGeneratorStore().setState(state => ({
          globalOptions: { ...state.globalOptions, steps: 12 },
        }));
      });
      act(() => {
        getGeneratorStore().setState(state => ({
          globalOptions: { ...state.globalOptions, steps: 15 },
        }));
      });

      expect(historyPush).not.toHaveBeenCalled();

      interactingEl.removeAttribute('data-interacting');
      await flushObserver();

      expect(historyPush).toHaveBeenCalledTimes(1);
      expect(historyPush).toHaveBeenCalledWith(null, '', expect.stringContaining('i=15'));
    });

    it('resumes normal sync after release', async () => {
      setMockRoute('/p/Primary-FF0044');

      renderHook(() => useUrlSync());
      historyPush.mockClear();
      historyReplace.mockClear();

      interactingEl.setAttribute('data-interacting', 'true');
      await flushObserver();
      interactingEl.removeAttribute('data-interacting');
      await flushObserver();

      historyPush.mockClear();

      act(() => {
        getGeneratorStore().setState(state => ({
          globalOptions: { ...state.globalOptions, steps: 20 },
        }));
      });

      expect(historyPush).toHaveBeenCalledTimes(1);
      expect(historyPush).toHaveBeenCalledWith(null, '', expect.stringContaining('i=20'));
    });
  });
});
