'use client';

import type { ReactNode } from 'react';
import { useMediaQuery } from '@gilbarbara/hooks';
import { MotionConfig } from 'framer-motion';

import { REDUCED_MOTION_QUERY } from '~/config/ui';

interface MotionProviderProps {
  children: ReactNode;
}

/**
 * Honors the OS reduced-motion preference for every framer-motion component in the tree.
 *
 * `skipAnimations`, not `reducedMotion` — do not "fix" this. `reducedMotion` only disables
 * *transform* animations, which covers none of what this app animates (Collapse tweens height
 * and opacity). `skipAnimations` resolves every value animation to its final keyframe on the
 * next frame while still firing onAnimationStart/onAnimationComplete, which ColorItem's
 * collapseAnimationCount bookkeeping depends on.
 *
 * @heroui/react takes framer-motion as a peer and resolves to the same copy, so HeroUI's own
 * animated surfaces inherit this context — `HeroUIProvider disableAnimation` would be redundant.
 * This must stay ABOVE ThemeProvider: ThemeProvider renders ToastProvider as a sibling of its
 * children, so a MotionProvider nested inside it leaves the toast region ungated.
 *
 * This does NOT reach the imperative `animate()` calls in utils/scroll and containers/Preview:
 * those don't read React context. They gate on utils/motion's prefersReducedMotion() instead.
 */
export default function MotionProvider({ children }: MotionProviderProps) {
  const reduceMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  return <MotionConfig skipAnimations={reduceMotion}>{children}</MotionConfig>;
}
