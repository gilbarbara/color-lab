import { act, renderHook } from '@testing-library/react';

import { IDLE_SESSION_MS } from '~/config/globals';
import useSessionSnapshot from '~/hooks/useSessionSnapshot';
import { initialState as appInitialState, useAppStore } from '~/stores/appStore';
import { useAuthStore } from '~/stores/authStore';
import type { GeneratorStoreApi } from '~/stores/generatorStore';
import { createTestPalette } from '~/test-fixtures';
import { trackEvent } from '~/utils/analytics';
import type { SnapshotGeneratorState } from '~/utils/sessionSnapshot';

const mocks = vi.hoisted(() => {
  const subscribers = new Set<() => void>();
  const ref: { current: SnapshotGeneratorState } = { current: null as never };

  return {
    ref,
    subscribers,
    api: {
      getState: () => mocks.ref.current,
      subscribe: (callback: () => void) => {
        mocks.subscribers.add(callback);

        return () => mocks.subscribers.delete(callback);
      },
    },
  };
});

vi.mock('~/hooks/useGeneratorStore', () => ({
  useGeneratorStoreApi: () => mocks.api as unknown as GeneratorStoreApi,
}));

// Keep the real module (buildSessionSnapshotProps / isEngagedSession run for real); stub only
// the sink so we can assert emissions.
vi.mock('~/utils/analytics', async importOriginal => {
  const actual = await importOriginal<typeof import('~/utils/analytics')>();

  return { ...actual, trackEvent: vi.fn() };
});

function commit() {
  act(() => {
    mocks.subscribers.forEach(callback => callback());
  });
}

function hideTab() {
  setVisibility('hidden');
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

function makeGenerator(colorCount: number): SnapshotGeneratorState {
  const palette = createTestPalette(colorCount);

  return {
    chartColorIds: new Set(),
    colors: palette.colors,
    globalOptions: palette.globalOptions,
  };
}

function setVisibility(state: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
}

function showTab() {
  setVisibility('visible');
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

describe('hooks/useSessionSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useAppStore.setState(appInitialState);
    useAuthStore.setState({ status: 'unauthenticated', user: null });
    mocks.subscribers.clear();
    // Engaged (2 colors) by default.
    mocks.ref.current = makeGenerator(2);
    setVisibility('visible');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits app:session when the tab is hidden', () => {
    renderHook(() => useSessionSnapshot());

    hideTab();

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith(
      'app:session',
      expect.objectContaining({ color_count: 2 }),
    );
  });

  it('does not emit when the tab becomes visible', () => {
    renderHook(() => useSessionSnapshot());

    showTab();

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('emits on pagehide', () => {
    renderHook(() => useSessionSnapshot());

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(trackEvent).toHaveBeenCalledWith('app:session', expect.any(Object));
  });

  it('does not emit for a non-engaged (fresh default) session', () => {
    mocks.ref.current = makeGenerator(1);
    renderHook(() => useSessionSnapshot());

    hideTab();

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('emits via the idle backstop after the idle window', () => {
    renderHook(() => useSessionSnapshot());

    act(() => {
      vi.advanceTimersByTime(IDLE_SESSION_MS);
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it('re-arms the idle backstop on store commits so an active session does not fire', () => {
    renderHook(() => useSessionSnapshot());

    act(() => {
      vi.advanceTimersByTime(IDLE_SESSION_MS - 1);
    });

    // A store commit just before the window elapses re-arms the timer.
    commit();

    // Past the original deadline (total elapsed > IDLE_SESSION_MS): un-re-armed, this would fire.
    act(() => {
      vi.advanceTimersByTime(IDLE_SESSION_MS - 1);
    });

    expect(trackEvent).not.toHaveBeenCalled();

    // Reaching the re-armed deadline finally emits.
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it('dedupes identical consecutive snapshots', () => {
    renderHook(() => useSessionSnapshot());

    hideTab();
    hideTab();

    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it('emits again when the config changed between captures', () => {
    renderHook(() => useSessionSnapshot());

    hideTab();
    mocks.ref.current = makeGenerator(3);
    hideTab();

    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it('stops emitting after unmount', () => {
    const { unmount } = renderHook(() => useSessionSnapshot());

    unmount();
    hideTab();

    expect(trackEvent).not.toHaveBeenCalled();
  });
});
