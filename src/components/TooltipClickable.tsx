import { type FocusEvent, type MouseEvent, useEffect, useRef, useState } from 'react';
import { cn } from '@heroui/react';
import { InfoIcon } from '@phosphor-icons/react';

import Tooltip, { type TooltipProps } from '~/components/Tooltip';

type OpenSource = 'click' | 'hover' | 'focus';

interface TooltipClickableProps extends TooltipProps {
  'aria-label'?: string;
  className?: string;
}

export default function TooltipClickable(props: TooltipClickableProps) {
  const {
    'aria-label': ariaLabel = 'More information',
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const openSourceRef = useRef<OpenSource | null>(null);

  const open = (source: OpenSource) => {
    openSourceRef.current = source;
    setIsOpen(true);
  };

  const close = () => {
    openSourceRef.current = null;
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    const handleOutside = (event: Event) => {
      if (!buttonRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('pointerdown', handleOutside, true);
    document.addEventListener('focusin', handleOutside, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('pointerdown', handleOutside, true);
      document.removeEventListener('focusin', handleOutside, true);
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (openSourceRef.current === 'click') {
      return;
    }

    timeoutRef.current = setTimeout(() => open('hover'), delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);

    if (openSourceRef.current === 'click') {
      return;
    }

    close();
  };

  const handleFocus = (event: FocusEvent<HTMLButtonElement>) => {
    if (event.currentTarget.matches(':focus-visible')) {
      open('focus');
    }
  };

  const handleBlur = () => {
    if (openSourceRef.current === 'click') {
      return;
    }

    close();
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    clearTimeout(timeoutRef.current);

    if (isOpen) {
      close();
    } else {
      open('click');
    }
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
        ref={buttonRef}
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={cn('inline-flex shrink-0 text-base', className)}
        disabled={isDisabled}
        onBlur={handleBlur}
        onClick={handleClick}
        onFocus={handleFocus}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        type="button"
      >
        {children}
      </button>
    </Tooltip>
  );
}
