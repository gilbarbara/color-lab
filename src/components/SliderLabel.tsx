import { type DOMAttributes, type MouseEvent, type ReactNode } from 'react';
import { EraserIcon } from '@phosphor-icons/react';

import { getTextFromNode } from '~/utils/strings';

import Tooltip from '~/components/Tooltip';
import TooltipClickable from '~/components/TooltipClickable';

interface SliderLabelProps extends DOMAttributes<HTMLLabelElement> {
  children?: ReactNode;
  description?: ReactNode;
  disableReset: boolean;
  id?: string;
  isDisabled?: boolean;
  onReset: () => void;
}

export default function SliderLabel(props: SliderLabelProps) {
  const { children, description, disableReset, id, isDisabled = false, onReset, ...rest } = props;

  const handleClickReset = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (disableReset) {
      return;
    }

    onReset();
  };

  return (
    <label {...rest} className="flex gap-2 items-center" htmlFor={id}>
      {children}
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
      <Tooltip
        classNames={{
          base: '-ml-2',
        }}
        content="Reset to default"
        isDisabled={isDisabled}
      >
        <button
          aria-label={`Reset ${getTextFromNode(children)} to default`}
          className="text-lg transition-opacity opacity-80 hover:opacity-100 disabled:opacity-60"
          disabled={disableReset || isDisabled}
          onClick={handleClickReset}
          type="button"
        >
          <EraserIcon weight="fill" />
        </button>
      </Tooltip>
    </label>
  );
}
