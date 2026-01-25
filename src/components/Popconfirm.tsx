import { type ReactNode, useState } from 'react';
import {
  Button,
  type ButtonProps,
  Popover,
  PopoverContent,
  type PopoverProps,
  PopoverTrigger,
  useDisclosure,
} from '@heroui/react';
import { WarningCircleIcon } from '@phosphor-icons/react';

export interface PopconfirmProps {
  /**
   * Cancel button text.
   * @default "Cancel"
   */
  cancelText?: string;
  /**
   * The trigger element that opens the popconfirm.
   */
  children: ReactNode;
  /**
   * Confirm button color.
   * @default "danger"
   */
  confirmColor?: ButtonProps['color'];
  /**
   * Confirm button text.
   * @default "OK"
   */
  confirmText?: string;
  /**
   * Optional description text.
   */
  description?: ReactNode;
  /**
   * Custom icon to display. Set to `null` to hide the icon.
   * @default WarningCircleIcon
   */
  icon?: ReactNode;
  /**
   * Whether the popconfirm trigger is disabled.
   */
  isDisabled?: boolean;
  /**
   * Callback when cancel button is clicked.
   */
  onCancel?: () => void;
  /**
   * Callback when confirm button is clicked. Supports async functions.
   */
  onConfirm?: () => void | Promise<void>;
  /**
   * Popover placement.
   * @default "bottom"
   */
  placement?: PopoverProps['placement'];
  /**
   * The confirmation title/message.
   */
  title: ReactNode;
}

export default function Popconfirm(props: PopconfirmProps) {
  const {
    cancelText = 'Cancel',
    children,
    confirmColor = 'primary',
    confirmText = 'Confirm',
    description,
    icon = <WarningCircleIcon className="size-5 text-danger shrink-0" weight="fill" />,
    isDisabled = false,
    onCancel,
    onConfirm,
    placement = 'bottom',
    title,
  } = props;

  const { isOpen, onClose, onOpenChange } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      await onConfirm?.();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover
      classNames={{
        content: 'p-4 w-64',
      }}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement={placement}
      showArrow
    >
      <PopoverTrigger disabled={isDisabled}>{children}</PopoverTrigger>
      <PopoverContent>
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-base font-medium">{title}</p>
        </div>
        {description && <div className="mt-2 text-sm">{description}</div>}
        <div className="w-full flex justify-end mt-3 gap-2">
          <Button onPress={handleCancel} size="sm" variant="light">
            {cancelText}
          </Button>
          <Button color={confirmColor} isLoading={isLoading} onPress={handleConfirm} size="sm">
            {confirmText}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
