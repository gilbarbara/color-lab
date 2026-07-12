import { memo, type MouseEvent, type TouchEvent } from 'react';
import { cn } from '@heroui/react';
import { CaretUpIcon } from '@phosphor-icons/react';

import useGenerator from '~/hooks/useGenerator';

import ColorBox from '~/components/ColorBox';

interface PanelBottomBarProps {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
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

function PanelBottomBar(props: PanelBottomBarProps) {
  const { onClick, onTouchEnd, onTouchStart, showBottomBar, toggleBottomBar } = props;
  // Self-subscribe to `colors` (the color strip) so a color edit re-renders just this bar, not
  // the Panel shell it lives in.
  const { colors } = useGenerator('colors');

  return (
    // The handle can't be the control: it wraps the color strip's buttons, and interactive
    // descendants of a `role="button"` are not reachable. So tap and swipe here stay a pointer-only
    // affordance, and the caret below is the real focusable control — which is why this div needs
    // no role, tabindex, or key handler.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="md:hidden sticky top-0 h-16 flex items-center justify-between p-4 bg-default-800 text-background dark:bg-default-100 dark:text-foreground z-20 border-b border-default touch-none"
      data-testid="GeneratorPanel-Handle"
      onClick={() => toggleBottomBar()}
      onTouchEnd={onTouchEnd}
      onTouchStart={onTouchStart}
    >
      {!showBottomBar && (
        <div className="h-1 w-8 absolute top-0 left-1/2 -translate-x-1/2 z-30 bg-foreground rounded-full" />
      )}
      {/* The dots share their names with the scale swatches — same action, different place. The
          group names them collectively so the two sets are tellable apart. */}
      <div
        aria-label="Color strip"
        className={cn('w-full flex items-center', {
          'mask-r-from-90%': colors.length >= 3,
        })}
        role="group"
      >
        {colors.map(color => (
          <ColorBox
            key={color.id}
            aria-label={`Select ${color.name}`}
            className={cn('first:ms-0', getStripSpacing(colors.length))}
            color={color.value}
            data-id={color.id}
            onClick={onClick}
            size="sm"
          />
        ))}
      </div>
      <button
        aria-expanded={showBottomBar}
        aria-label="Toggle Bottom Bar"
        className="p-2 -mr-2 shrink-0 cursor-pointer"
        onClick={event => {
          // The wrapper's own onClick already toggles; without this the bar would toggle twice.
          event.stopPropagation();
          toggleBottomBar();
        }}
        type="button"
      >
        <CaretUpIcon
          className={cn('transition-transform text-base', {
            'rotate-180': showBottomBar,
          })}
        />
      </button>
    </div>
  );
}

export default memo(PanelBottomBar);
