import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { cn } from '@heroui/react';
import { InfoIcon } from '@phosphor-icons/react';

import Tooltip, { type TooltipProps } from '~/components/Tooltip';

interface TooltipClickableProps extends TooltipProps {
  'aria-label'?: string;
  className?: string;
}

export default function TooltipClickable(props: TooltipClickableProps) {
  const {
    'aria-label': ariaLabel,
    children = <InfoIcon />,
    className,
    classNames,
    content,
    delay = 250,
    isDisabled,
    placement = 'bottom-start',
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setIsOpen(false);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    clearTimeout(timeoutRef.current);
    setIsOpen(previous => !previous);
  };

  return (
    <Tooltip
      classNames={classNames}
      content={content}
      isDisabled={isDisabled}
      isOpen={isOpen}
      placement={placement}
    >
      <button
        aria-label={ariaLabel}
        className={cn('inline-flex shrink-0', className)}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={-1}
        type="button"
      >
        {children}
      </button>
    </Tooltip>
  );
}
