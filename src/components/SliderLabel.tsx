import { type DOMAttributes, type MouseEvent, type ReactNode } from 'react';
import { cn } from '@heroui/react';
import { EraserIcon } from '@phosphor-icons/react';

import { getTextFromNode } from '~/utils/strings';

import Tooltip from '~/components/Tooltip';
import TooltipClickable from '~/components/TooltipClickable';

interface SliderLabelProps extends DOMAttributes<HTMLLabelElement> {
  children?: ReactNode;
  description?: ReactNode;
  disableReset?: boolean;
  isDisabled?: boolean;
  // Overrides DOMAttributes' onReset; the optional event keeps consumers free to pass a
  // handler that takes the reset event, even though the reset button invokes it with none.
  onReset?: (event?: any) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function SliderLabel(props: SliderLabelProps) {
  const {
    children,
    description,
    disableReset,
    isDisabled = false,
    onReset,
    size = 'sm',
    ...rest
  } = props;

  const handleClickReset = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (disableReset) {
      return;
    }

    onReset?.();
  };

  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label {...rest} className="flex gap-2 items-center">
      <span
        className={cn('text-sm/5', {
          'text-foreground-500': size === 'sm',
          'text-sm/5': size === 'md',
          'text-base/5': size === 'lg',
        })}
      >
        {children}
      </span>
      {!!description && (
        <TooltipClickable
          aria-label={`Description for ${getTextFromNode(children)}`}
          classNames={{
            base: '-ml-2',
          }}
          content={description}
          isDisabled={isDisabled}
        />
      )}
      {!!onReset && (
        <Tooltip
          classNames={{
            base: '-ml-2',
          }}
          content="Reset to default"
          isDisabled={isDisabled}
        >
          <button
            aria-label={`Reset ${getTextFromNode(children)} to default`}
            className="text-lg transition-colors text-secondary disabled:text-foreground-500"
            disabled={disableReset || isDisabled}
            onClick={handleClickReset}
            type="button"
          >
            <EraserIcon weight="fill" />
          </button>
        </Tooltip>
      )}
    </label>
  );
}
