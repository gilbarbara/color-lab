import { extendVariants, Tooltip as HeroUITooltip } from '@heroui/react';

const Tooltip = extendVariants(HeroUITooltip, {
  defaultVariants: {
    color: 'tooltip',
    placement: 'bottom-start',
    shadow: 'lg',
    showArrow: 'true',
    size: 'md',
  },
  slots: {
    content: 'max-w-64 items-start px-2 py-1 rounded-small',
  },
  variants: {
    color: {
      tooltip: {
        base: 'before:bg-tooltip',
        content: 'bg-tooltip',
      },
    },
  },
});

export type { TooltipProps } from '@heroui/react';

export default Tooltip;
