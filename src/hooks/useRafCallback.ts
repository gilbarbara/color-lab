import { useCallback, useEffect, useRef } from 'react';

/**
 * Coalesce multiple synchronous calls within one frame into a single deferred
 * invocation with the latest args. Cancels any pending frame on unmount.
 */
export default function useRafCallback<A extends unknown[]>(callback: (...arguments_: A) => void) {
  const rafRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return useCallback((...arguments_: A) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => callbackRef.current(...arguments_));
  }, []);
}
