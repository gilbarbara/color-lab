import { act, renderHook } from '@testing-library/react';

import useScrollToColor from '~/hooks/useScrollToColor';
import { initialState as appInitial, useAppStore } from '~/stores/appStore';
import { getGeneratorStore } from '~/test-mocks';

const paletteInitial = getGeneratorStore().getState();
const COLOR_ID = paletteInitial.colors[0].id;

const breakpointMock = vi.hoisted(() => ({
  max: vi.fn<(key: string) => boolean>(),
}));

vi.mock('@gilbarbara/hooks', async () => {
  const actual = await vi.importActual<typeof import('@gilbarbara/hooks')>('@gilbarbara/hooks');

  return {
    ...actual,
    useBreakpoint: () => ({ max: breakpointMock.max, min: vi.fn() }),
  };
});

const OPEN_ANIMATION_MS = 500;

function setDesktop() {
  breakpointMock.max.mockImplementation(() => false);
}

function setMobile() {
  breakpointMock.max.mockImplementation((key: string) => key === 'md');
}

describe('hooks/useScrollToColor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    breakpointMock.max.mockReset();
    useAppStore.setState(appInitial);
    getGeneratorStore().setState(paletteInitial);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('desktop', () => {
    beforeEach(setDesktop);

    it('sets active color, bumps nonce, leaves sidebar untouched when open', () => {
      useAppStore.setState({ showSidebar: true });
      const { result } = renderHook(() => useScrollToColor());

      act(() => {
        result.current(COLOR_ID);
      });

      expect(getGeneratorStore().getState().activeColorId).toBe(COLOR_ID);
      expect(useAppStore.getState().colorScrollRequest).toEqual({ id: COLOR_ID, nonce: 1 });
      expect(useAppStore.getState().showSidebar).toBe(true);
    });

    it('forces sidebar open and delays nonce bump when sidebar closed', () => {
      useAppStore.setState({ showSidebar: false });
      const { result } = renderHook(() => useScrollToColor());

      act(() => {
        result.current(COLOR_ID);
      });

      expect(useAppStore.getState().showSidebar).toBe(true);
      expect(useAppStore.getState().colorScrollRequest).toBe(null);

      act(() => {
        vi.advanceTimersByTime(OPEN_ANIMATION_MS);
      });

      expect(useAppStore.getState().colorScrollRequest).toEqual({ id: COLOR_ID, nonce: 1 });
    });

    it('does not touch bottom bar', () => {
      useAppStore.setState({ showSidebar: false, showBottomBar: false });
      const { result } = renderHook(() => useScrollToColor());

      act(() => {
        result.current(COLOR_ID);
      });

      expect(useAppStore.getState().showBottomBar).toBe(false);
    });
  });

  describe('mobile', () => {
    beforeEach(setMobile);

    it('forces bottom bar open and delays nonce bump when closed', () => {
      useAppStore.setState({ showBottomBar: false });
      const { result } = renderHook(() => useScrollToColor());

      act(() => {
        result.current(COLOR_ID);
      });

      expect(useAppStore.getState().showBottomBar).toBe(true);
      expect(useAppStore.getState().colorScrollRequest).toBe(null);

      act(() => {
        vi.advanceTimersByTime(OPEN_ANIMATION_MS);
      });

      expect(useAppStore.getState().colorScrollRequest).toEqual({ id: COLOR_ID, nonce: 1 });
    });

    it('bumps nonce immediately when bottom bar already open', () => {
      useAppStore.setState({ showBottomBar: true });
      const { result } = renderHook(() => useScrollToColor());

      act(() => {
        result.current(COLOR_ID);
      });

      expect(useAppStore.getState().colorScrollRequest).toEqual({ id: COLOR_ID, nonce: 1 });
      expect(useAppStore.getState().showBottomBar).toBe(true);
    });

    it('does not touch sidebar', () => {
      useAppStore.setState({ showBottomBar: false, showSidebar: false });
      const { result } = renderHook(() => useScrollToColor());

      act(() => {
        result.current(COLOR_ID);
      });

      expect(useAppStore.getState().showSidebar).toBe(false);
    });
  });

  describe('activate option', () => {
    beforeEach(setDesktop);

    it('skips setActiveColor when activate is false', () => {
      useAppStore.setState({ showSidebar: true });
      getGeneratorStore().setState({ activeColorId: 'previous' });
      const { result } = renderHook(() => useScrollToColor());

      act(() => {
        result.current(COLOR_ID, { activate: false });
      });

      expect(getGeneratorStore().getState().activeColorId).toBe('previous');
      expect(useAppStore.getState().colorScrollRequest).toEqual({ id: COLOR_ID, nonce: 1 });
    });

    it('sets active color by default', () => {
      useAppStore.setState({ showSidebar: true });
      const { result } = renderHook(() => useScrollToColor());

      act(() => {
        result.current(COLOR_ID);
      });

      expect(getGeneratorStore().getState().activeColorId).toBe(COLOR_ID);
    });
  });
});
