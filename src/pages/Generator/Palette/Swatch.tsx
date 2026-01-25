import type { KeyboardEvent, ReactNode } from 'react';
import { addToast } from '@heroui/react';
import { LockSimpleIcon } from '@phosphor-icons/react';
import { readableColorAPCA } from 'colorizr';

import { trackEvent } from '~/utils/analytics';

import Tooltip from '~/components/Tooltip';

interface SwatchProps {
  color: string;
  lock?: number;
  step: string;
}

export default function Swatch({ color, lock, step }: SwatchProps) {
  const handleClick = () => {
    trackEvent('copy-swatch');
    navigator.clipboard
      .writeText(color)
      .then(() => {
        addToast({
          description: `${color} copied`,
          color: 'foreground',
          variant: 'solid',
          timeout: 2500,
        });
      })
      .catch(() => {
        addToast({
          description: `Failed to copy ${color} to your clipboard`,
          color: 'danger',
          timeout: 2500,
        });
      });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  let icon: ReactNode;

  if (parseInt(step, 10) === lock) {
    icon = (
      <span className="mb-auto lg:mt-2 order-1 md:order-0">
        <LockSimpleIcon className="text-base" weight="bold" />
      </span>
    );
  }

  return (
    <Tooltip content={color} placement="bottom" size="lg">
      <div
        className="min-w-12 lg:min-w-18 lg:h-22 relative flex flex-row lg:flex-col gap-2 items-center justify-between lg:justify-end px-2 py-4 rounded-md text-center cursor-pointer"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        style={{ backgroundColor: color, color: readableColorAPCA(color) }}
        tabIndex={0}
      >
        {icon}
        <p className="text-base/4">{step}</p>
      </div>
    </Tooltip>
  );
}
