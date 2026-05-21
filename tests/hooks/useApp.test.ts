import { act, renderHook } from '@testing-library/react';

import useApp from '~/hooks/useApp';
import { initialState, useAppStore } from '~/stores/appStore';

describe('hooks/useApp', () => {
  beforeEach(() => {
    useAppStore.setState(initialState);
  });

  describe('keyed selector', () => {
    it('picks a single key', () => {
      const { result } = renderHook(() => useApp('gamut'));

      expect(Object.keys(result.current)).toEqual(['gamut']);
      expect(result.current.gamut).toBe(useAppStore.getState().gamut);
    });

    it('picks multiple keys', () => {
      const { result } = renderHook(() => useApp('gamut', 'showSidebar', 'toggleSidebar'));

      expect(Object.keys(result.current).sort()).toEqual(['gamut', 'showSidebar', 'toggleSidebar']);
      expect(result.current.showSidebar).toBe(true);
      expect(typeof result.current.toggleSidebar).toBe('function');
    });

    it('reflects mutations on picked keys', () => {
      const { result } = renderHook(() => useApp('gamut'));

      act(() => {
        useAppStore.getState().setGamut('srgb');
      });

      expect(result.current.gamut).toBe('srgb');
    });
  });

  describe('subscription stability', () => {
    it('action-only consumer never re-renders on unrelated state changes', () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;

        return useApp('toggleSidebar');
      });

      const initialToggle = result.current.toggleSidebar;

      expect(renderCount).toBe(1);

      act(() => {
        useAppStore.getState().setGamut('srgb');
      });
      expect(renderCount).toBe(1);

      act(() => {
        useAppStore.getState().openLoginModal();
      });
      expect(renderCount).toBe(1);

      act(() => {
        useAppStore.getState().requestPreviewScroll();
      });
      expect(renderCount).toBe(1);

      expect(result.current.toggleSidebar).toBe(initialToggle);
    });

    it('ignores unrelated key changes, re-renders on picked key change', () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;

        return useApp('gamut');
      });

      expect(renderCount).toBe(1);

      act(() => {
        useAppStore.getState().toggleSidebar();
      });
      expect(renderCount).toBe(1);

      act(() => {
        useAppStore.getState().setGamut('srgb');
      });
      expect(renderCount).toBe(2);
      expect(result.current.gamut).toBe('srgb');
    });

    it('returned object stays shallow-stable across unrelated mutations', () => {
      const { result } = renderHook(() => useApp('gamut', 'showSidebar'));

      const previous = result.current;

      act(() => {
        useAppStore.getState().openLoginModal();
      });

      expect(result.current).toBe(previous);
    });

    it('idempotent set keeps returned object stable', () => {
      const { result } = renderHook(() => useApp('showPreview'));

      const previous = result.current;

      act(() => {
        useAppStore.getState().togglePreview(true);
      });

      expect(result.current.showPreview).toBe(true);
      expect(result.current).toBe(previous);
    });
  });
});
