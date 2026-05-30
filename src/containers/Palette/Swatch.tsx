import { type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { addToast, cn } from '@heroui/react';
import { LockSimpleIcon } from '@phosphor-icons/react';
import { convertCSS, readableColor } from 'colorizr';

import useApp from '~/hooks/useApp';
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
  // Store gamut drives clipboard text and tooltip content (post-mount user
  // preference). The painted background uses CSS vars instead — see below.
  const { gamut } = useApp('gamut');

  const oklch = formatOklch(color);
  const hex = convertCSS(color, 'hex');
  const displayColor = gamut === 'srgb' ? hex : oklch;

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
      <span className="mb-auto @xl:mt-2 @xl:order-1">
        <LockSimpleIcon className="text-base" weight="bold" />
      </span>
    );
  }

  return (
    <Tooltip content={displayColor} placement="bottom" size="lg">
      <div
        className={cn(
          'relative flex-1 min-w-9 @xl:h-22',
          'flex flex-row @xl:flex-col items-center justify-between @xl:justify-end gap-2',
          'px-2 py-4 rounded-md text-center cursor-pointer',
          'bg-(--gamut-bg-oklch) gamut-srgb:bg-(--gamut-bg-hex)',
          className,
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        style={
          {
            '--gamut-bg-oklch': oklch,
            '--gamut-bg-hex': hex,
            color: readableColor(color, 'apca'),
          } as CSSProperties
        }
        tabIndex={0}
      >
        <p className="text-base/4 @xl:order-2">{step}</p>
        {icon}
      </div>
    </Tooltip>
  );
}
