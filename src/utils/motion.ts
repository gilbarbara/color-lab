import { REDUCED_MOTION_QUERY } from '~/config/ui';

/**
 * One-shot read of the OS motion preference. A util rather than a hook because every caller
 * reads it inside an effect, an event handler, or a requestAnimationFrame callback — a
 * subscription would only add re-renders on a value that cannot change mid-gesture.
 *
 * This covers the JS-driven motion the CSS blanket in index.css cannot reach: framer-motion's
 * imperative `animate()` and any `scrollIntoView` that passes an explicit `behavior: 'smooth'`
 * (per CSSOM-View, the options dictionary wins over the `scroll-behavior` property).
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
