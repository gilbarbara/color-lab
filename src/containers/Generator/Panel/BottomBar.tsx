import type { KeyboardEvent, MouseEvent, TouchEvent } from 'react';
import { cn } from '@heroui/react';
import { CaretUpIcon } from '@phosphor-icons/react';

import ColorBox from '~/components/ColorBox';

import type { ColorEntry } from '~/types';

interface PanelBottomBarProps {
  colors: ColorEntry[];
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  showBottomBar: boolean;
  toggleBottomBar: () => void;
}

/**
 * Inter-box spacing for the color strip, as a `margin-inline-start` value on
 * every box but the first. Positive = gap, negative = overlap. The strip is
 * `md:hidden`, so only the sub-768px tiers matter; `xs` (≥360px) and `xsm`
 * (≥400px) relax the spacing as width grows. Values fit 32px boxes into the
 * available strip width (`viewport − 64`) at each tier's low edge (320/360/400)
 * with a small buffer so they never reach the caret.
 */
function getStripSpacing(count: number): string {
  if (count >= 10) return '-ms-2 xs:-ms-0 xsm:ms-0.5';
  if (count === 9) return '-ms-2 xs:ms-0.5 xsm:ms-1';
  if (count === 8) return '-ms-1 xs:ms-1 xsm:ms-2';
  if (count === 7) return 'ms-1 xs:ms-2';

  return 'ms-2';
}

export default function PanelBottomBar(props: PanelBottomBarProps) {
  const { colors, onClick, onKeyDown, onTouchEnd, onTouchStart, showBottomBar, toggleBottomBar } =
    props;

  return (
    <div
      aria-label="Toggle Bottom Bar"
      className="md:hidden sticky top-0 h-16 flex items-center justify-between p-4 bg-default-800 text-background dark:bg-default-100 dark:text-foreground z-20 border-b border-default touch-none"
      data-testid="GeneratorPanel-Handle"
      onClick={() => toggleBottomBar()}
      onKeyDown={onKeyDown}
      onTouchEnd={onTouchEnd}
      onTouchStart={onTouchStart}
      role="button"
      tabIndex={0}
    >
      {!showBottomBar && (
        <div className="h-1 w-8 absolute top-0 left-1/2 -translate-x-1/2 z-30 bg-foreground rounded-full" />
      )}
      <div
        className={cn('w-full flex items-center', {
          'mask-r-from-90%': colors.length >= 3,
        })}
      >
        {colors.map(color => (
          <ColorBox
            key={color.id}
            className={cn('first:ms-0', getStripSpacing(colors.length))}
            color={color.value}
            data-id={color.id}
            onClick={onClick}
            size="sm"
          />
        ))}
      </div>
      <span className="p-2 -mr-2 shrink-0">
        <CaretUpIcon
          className={cn('transition-transform text-base', {
            'rotate-180': showBottomBar,
          })}
        />
      </span>
    </div>
  );
}
