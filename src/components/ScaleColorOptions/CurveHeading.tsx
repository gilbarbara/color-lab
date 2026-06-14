import { type MouseEvent, type ReactNode } from 'react';
import { cn } from '@heroui/react';
import { EraserIcon } from '@phosphor-icons/react';

import { getTextFromNode } from '~/utils/strings';

import Tooltip from '~/components/Tooltip';
import TooltipClickable from '~/components/TooltipClickable';

interface CurveHeadingProps {
  children?: ReactNode;
  description?: ReactNode;
  disableReset?: boolean;
  /** Target for the group's `aria-labelledby`; the title's accessible name. */
  id: string;
  isDisabled?: boolean;
  onReset?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Title for a curve-editor control group. Unlike SliderLabel it is not a `<label>` — it
 * names a `role="group"` wrapper via `aria-labelledby`, so it must not be associated with
 * a single control. The info/reset affordances mirror SliderLabel's markup by design.
 */
export default function CurveHeading(props: CurveHeadingProps) {
  const {
    children,
    description,
    disableReset,
    id,
    isDisabled = false,
    onReset,
    size = 'sm',
  } = props;

  const handleClickReset = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (disableReset) {
      return;
    }

    onReset?.();
  };

  return (
    <div className="flex gap-2 items-center">
      <span
        className={cn('text-sm/5', {
          'text-foreground-500': size === 'sm',
          'text-sm/5': size === 'md',
          'text-base/5': size === 'lg',
        })}
        id={id}
      >
        {children}
      </span>
      {!!description && (
        <TooltipClickable
          aria-label={`Description for ${getTextFromNode(children)}`}
          content={description}
          isDisabled={isDisabled}
        />
      )}
      {!!onReset && (
        <Tooltip content="Reset to default" isDisabled={isDisabled}>
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
    </div>
  );
}
