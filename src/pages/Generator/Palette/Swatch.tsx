import type { KeyboardEvent, ReactNode } from 'react';
import { addToast, cn } from '@heroui/react';
import { LockSimpleIcon } from '@phosphor-icons/react';
import { convertCSS, readableColor } from 'colorizr';

import { useAppStore } from '~/stores/appStore';
import { trackEvent } from '~/utils/analytics';
import { formatOklch } from '~/utils/color';

import Tooltip from '~/components/Tooltip';

interface SwatchProps {
  className?: string;
  color: string;
  lock?: number;
  step: string;
}

export default function Swatch(props: SwatchProps) {
  const { className, color, lock, step } = props;
  const gamut = useAppStore(state => state.gamut);

  const displayColor = gamut === 'srgb' ? convertCSS(color, 'hex') : formatOklch(color);

  const handleClick = () => {
    trackEvent('copy-swatch');
    navigator.clipboard
      .writeText(displayColor)
      .then(() => {
        addToast({
          description: `${displayColor} copied`,
          color: 'foreground',
          variant: 'solid',
          timeout: 2500,
        });
      })
      .catch(() => {
        addToast({
          description: `Failed to copy ${displayColor} to your clipboard`,
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
      <span className="mb-auto lg:mt-2 md:order-1">
        <LockSimpleIcon className="text-base" weight="bold" />
      </span>
    );
  }

  return (
    <Tooltip content={displayColor} placement="bottom" size="lg">
      <div
        className={cn(
          'relative flex-1 min-w-9 lg:h-22',
          'flex flex-row lg:flex-col items-center justify-between lg:justify-end gap-2',
          'px-2 py-4 rounded-md text-center cursor-pointer',
          className,
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        style={{
          backgroundColor: displayColor,
          color: readableColor(displayColor, 'apca'),
        }}
        tabIndex={0}
      >
        <p className="text-base/4 lg:order-2">{step}</p>
        {icon}
      </div>
    </Tooltip>
  );
}
