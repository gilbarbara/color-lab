import { LockSimpleIcon, WarningIcon } from '@phosphor-icons/react';
import { convertCSS, deltaE, readableColor } from 'colorizr';

import { trackEvent } from '~/utils/analytics';
import { formatOklch } from '~/utils/color';

import CopyText from '~/components/CopyText';
import TooltipClickable from '~/components/TooltipClickable';

import { CircleChip, ShadeBgChip } from './Chip';

interface RowProps {
  color: string;
  isLocked: boolean;
  isSelected: boolean;
  onSelect: (step: string) => void;
  step: string;
}

const GAMUT_DELTA_FULL = 0.04;
const GAMUT_DELTA_MIN_OPACITY = 0.15;

export default function Row({ color, isLocked, isSelected, onSelect, step }: RowProps) {
  const hex = convertCSS(color, 'hex');
  const delta = deltaE(color, hex);
  const gamutOpacity = Math.min(1, Math.max(GAMUT_DELTA_MIN_OPACITY, delta / GAMUT_DELTA_FULL));

  const displayColor = formatOklch(color);

  const handleSelect = () => {
    trackEvent('info:select_step', { source: 'table', step });
    onSelect(step);
  };

  return (
    <tr
      className={`border-t border-default-100 cursor-pointer scroll-mt-10 ${
        isSelected ? 'bg-default-100' : 'hover:bg-default-50'
      }`}
      data-step={step}
      data-testid="ColorInfo-Row"
      onClick={handleSelect}
    >
      <td className="py-2 px-2 text-foreground-500 text-sm">
        {/* The row's click is a pointer convenience only — it can't be the control, because the
            cells below hold their own buttons. This is the keyboard- and AT-reachable one. */}
        <button
          aria-label={`Step ${step}${isLocked ? ', locked' : ''}`}
          aria-pressed={isSelected}
          className="w-full flex flex-col items-center gap-0.5 leading-tight cursor-pointer"
          onClick={event => {
            // Stop the row's own handler from firing a second `info:select_step`.
            event.stopPropagation();
            handleSelect();
          }}
          type="button"
        >
          {step}
          {isLocked && <LockSimpleIcon data-testid="ColorInfo-Row-Lock" weight="bold" />}
        </button>
      </td>
      <td className="py-2 pr-3">
        <div className="flex items-center gap-2">
          <ShadeBgChip shade={displayColor} />
          <CircleChip
            bg="#ffffff"
            fg={displayColor}
            testid="ColorInfo-Chip-OnWhite"
            title="Shade on white"
          />
          <CircleChip
            bg="#000000"
            fg={displayColor}
            testid="ColorInfo-Chip-OnBlack"
            title="Shade on black"
          />
        </div>
      </td>
      <td className="py-2 pr-3">
        <div
          className="inline-flex gap-0.5 rounded-md overflow-hidden ring-1 ring-default-200"
          data-testid="ColorInfo-Gamut"
        >
          <span
            className="block size-9"
            style={{ backgroundColor: displayColor }}
            title={`OKLCH · ${displayColor}`}
          />
          <span
            className="size-9 flex items-center justify-center text-white/40"
            style={{ backgroundColor: hex }}
            title={`Hex · ${hex}`}
          >
            <TooltipClickable
              classNames={{ base: 'z-200' }}
              content={`Hex roundtrip drift · ΔE ${delta.toFixed(3)}`}
            >
              <WarningIcon
                color={readableColor(color, 'apca')}
                style={{ opacity: gamutOpacity }}
                weight="bold"
              />
            </TooltipClickable>
          </span>
        </div>
      </td>
      <td className="py-2 pr-3 font-mono whitespace-nowrap">
        <div className="flex items-center gap-2 text-sm">
          {displayColor}{' '}
          <CopyText
            content="Copy OKLCH"
            label="Copy OKLCH"
            onCopy={() => trackEvent('info:copy', { format: 'oklch' })}
            showToast
            value={displayColor}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground-500">
          {hex}{' '}
          <CopyText
            content="Copy HEX"
            label="Copy HEX"
            onCopy={() => trackEvent('info:copy', { format: 'hex' })}
            showToast
            value={hex}
          />
        </div>
      </td>
    </tr>
  );
}
