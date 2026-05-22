import { animate } from 'framer-motion';

export function scrollToSelector(
  id: string | undefined,
  container?: HTMLElement | null,
  offset = 0,
) {
  if (!id) return;

  if (container) {
    const target = container.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;

    if (!target) return;

    const start = container.scrollTop;
    const delta = target.getBoundingClientRect().top - container.getBoundingClientRect().top;

    animate(start, start + delta - offset, {
      duration: 0.4,
      ease: 'easeInOut',
      onUpdate: y => container.scrollTo(0, y),
    });

    return;
  }

  const element = document.getElementById(id);

  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
