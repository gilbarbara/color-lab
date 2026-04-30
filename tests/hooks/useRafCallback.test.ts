import { act, renderHook } from '@testing-library/react';

import useRafCallback from '~/hooks/useRafCallback';

describe('hooks/useRafCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('coalesces multiple calls within a frame to a single invocation with last args', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useRafCallback(callback));

    act(() => {
      result.current(1);
      result.current(2);
      result.current(3);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(16);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(3);
  });

  it('uses latest callback closure (no stale captures)', () => {
    let counter = 0;
    const { rerender, result } = renderHook(
      ({ value }) =>
        useRafCallback(() => {
          counter = value;
        }),
      {
        initialProps: { value: 1 },
      },
    );

    rerender({ value: 42 });

    act(() => {
      result.current();
      vi.advanceTimersByTime(16);
    });

    expect(counter).toBe(42);
  });

  it('cancels pending frame on unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useRafCallback(callback));

    act(() => {
      result.current('queued');
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(32);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('returns stable reference across renders', () => {
    const { rerender, result } = renderHook(({ cb }) => useRafCallback(cb), {
      initialProps: { cb: () => {} },
    });

    const first = result.current;

    rerender({ cb: () => {} });

    expect(result.current).toBe(first);
  });
});
