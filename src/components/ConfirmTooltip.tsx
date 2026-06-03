import {
  cloneElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type TooltipProps } from '@heroui/react';

import Tooltip from './Tooltip';

export interface ConfirmTooltipProps {
  /**
   * The trigger element (usually a Button).
   */
  children: ReactNode;
  /**
   * Tooltip color in confirm state.
   * @default "danger"
   */
  confirmColor?: TooltipProps['color'];
  /**
   * Message shown after first click.
   * @default "Click again to confirm"
   */
  confirmMessage?: string;
  /**
   * Tooltip delay in ms.
   * @default 250
   */
  delay?: number;
  /**
   * Disable the confirmation trigger.
   */
  isDisabled?: boolean;
  /**
   * Default tooltip message.
   * @default "Click to confirm"
   */
  message?: string;
  /**
   * Callback executed on second click (confirmation).
   */
  onConfirm: () => void;
  /**
   * Tooltip placement.
   * @default "bottom-end"
   */
  placement?: TooltipProps['placement'];
  /**
   * Auto-reset timeout in ms.
   * @default 2000
   */
  timeout?: number;
}

export default function ConfirmTooltip(props: ConfirmTooltipProps) {
  const {
    children,
    confirmColor = 'danger',
    confirmMessage = 'Click again to confirm',
    delay = 250,
    isDisabled = false,
    message = 'Click to confirm',
    onConfirm,
    placement = 'bottom-end',
    timeout = 2000,
  } = props;

  const [needsConfirm, setNeedsConfirm] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handlePress = () => {
    if (isDisabled) {
      return;
    }

    if (!needsConfirm) {
      setNeedsConfirm(true);
      timeoutRef.current = setTimeout(() => setNeedsConfirm(false), timeout);
    } else {
      onConfirm();
      setNeedsConfirm(false);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const trigger = cloneElement(children as ReactElement<{ onPress?: () => void }>, {
    onPress: handlePress,
  });

  return (
    <Tooltip
      classNames={{
        base: 'before:right-2!',
      }}
      color={needsConfirm ? confirmColor : 'tooltip'}
      content={needsConfirm ? confirmMessage : message}
      delay={delay}
      isDisabled={isDisabled}
      isOpen={needsConfirm}
      placement={placement}
    >
      {trigger}
    </Tooltip>
  );
}
