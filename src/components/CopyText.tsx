import type { ReactNode } from 'react';
import { CopyIcon } from '@phosphor-icons/react';

import { copyToClipboard } from '~/utils/clipboard';

import Tooltip, { type TooltipProps } from '~/components/Tooltip';

interface CopyTextProps {
  children?: ReactNode;
  color?: string;
  content: ReactNode;
  label: string;
  onCopy?: (value: string) => void;
  placement?: TooltipProps['placement'];
  showToast?: boolean;
  value: string;
}

export default function CopyText(props: CopyTextProps) {
  const {
    children,
    color,
    content,
    label,
    onCopy,
    placement = 'bottom',
    showToast = false,
    value,
  } = props;

  const handleCopyToClipboard = async () => {
    if (await copyToClipboard(value, { showToast })) {
      onCopy?.(value);
    }
  };

  return (
    <Tooltip content={content} placement={placement}>
      <button
        aria-label={label}
        className="inline-flex items-center gap-1"
        onClick={handleCopyToClipboard}
        type="button"
      >
        {children}
        <CopyIcon className="text-base" style={{ color }} />
      </button>
    </Tooltip>
  );
}
