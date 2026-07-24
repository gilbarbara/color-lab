import { animate } from 'framer-motion';

import { prefersReducedMotion } from '~/utils/motion';

export function scrollToSelector(
  id: string | undefined,
  container?: HTMLElement | null,
  offset = 0,
  instant = false,
) {
  if (!id) return;

  // The OS preference decides on its own; `instant` stays an explicit override for callers
  // that need a jump regardless. Read here rather than threaded down from the caller: this
  // runs inside a requestAnimationFrame, where a one-shot read is always current, and the
  // sole production caller doesn't pass `instant` — an opt-in every future caller has to
  // remember is a latent bug.
  const jump = instant || prefersReducedMotion();

  if (container) {
    const target = container.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;

    if (!target) return;

    const start = container.scrollTop;
    const delta = target.getBoundingClientRect().top - container.getBoundingClientRect().top;
    const end = start + delta - offset;

    if (jump) {
      container.scrollTo(0, end);

      return;
    }

    animate(start, end, {
      duration: 0.4,
      ease: 'easeInOut',
      onUpdate: y => container.scrollTo(0, y),
    });

    return;
  }

  const element = document.getElementById(id);

  element?.scrollIntoView({ behavior: jump ? 'auto' : 'smooth', block: 'start' });
}
