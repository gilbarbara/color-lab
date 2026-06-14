import type { GlobalScaleOptions } from '~/types';

/**
 * Interaction plumbing shared by every setting component. The orchestrator owns the
 * `data-interacting` wrapper ref; children call `start`/`end` around a gesture and use
 * `scheduleUpdate` for raf-coalesced drags, `onUpdate` for immediate (mode/reset) writes.
 */
export interface ScaleColorSharedProps {
  end: () => void;
  headingSize?: 'md' | 'lg';
  onUpdate: (updates: Partial<GlobalScaleOptions>) => void;
  scheduleUpdate: (updates: Partial<GlobalScaleOptions>) => void;
  start: () => void;
}
