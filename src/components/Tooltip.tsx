import type { HTMLAttributes } from 'react';
import { extendVariants, Tooltip as HeroUITooltip, type TooltipProps } from '@heroui/react';
import { XCircleIcon } from '@phosphor-icons/react';

import useMergeClassNames from '~/hooks/useMergeClassNames';

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

export function TooltipCloseButton(props: HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="absolute -top-2 -right-2 rounded-full p-0.5 bg-tooltip"
      type="button"
      {...props}
    >
      <XCircleIcon className="text-base" />
    </button>
  );
}

export function TooltipOld(props: TooltipProps) {
  const { classNames: customClassNames, ...rest } = props;

  const classNames = useMergeClassNames(
    {
      base: ['max-w-64', 'before:bg-tooltip'],
      content: ['bg-tooltip', 'px-2 py-1'],
    },
    customClassNames,
  );

  return (
    <HeroUITooltip classNames={classNames} placement="bottom" shadow="lg" showArrow {...rest} />
  );
}

export default Tooltip;
