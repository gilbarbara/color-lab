import { animate } from 'framer-motion';

export function scrollToSelector(
  id: string | undefined,
  container?: HTMLElement | null,
  offset = 0,
  instant = false,
) {
  if (!id) return;

  if (container) {
    const target = container.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;

    if (!target) return;

    const start = container.scrollTop;
    const delta = target.getBoundingClientRect().top - container.getBoundingClientRect().top;
    const end = start + delta - offset;

    if (instant) {
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

  element?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' });
}
