import { type KeyboardEvent, useId } from 'react';
import { type ScaleMode as ScaleModeType } from 'colorizr';

import TooltipClickable from '~/components/TooltipClickable';

import Button from './Button';

interface ScaleModeProps {
  mode: ScaleModeType;
  onClick: (value: ScaleModeType) => void;
}

const MODES: Array<{ label: string; value: ScaleModeType }> = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Reversed', value: 'reversed' },
];

export default function ScaleMode(props: ScaleModeProps) {
  const { mode, onClick } = props;

  const labelId = useId();

  // Roving focus: arrow keys move selection + focus within the group (single tab stop).
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = MODES.findIndex(item => item.value === mode);
    let next: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (current + 1) % MODES.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (current - 1 + MODES.length) % MODES.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = MODES.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    onClick(MODES[next].value);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div className="flex items-center gap-2">
      <span id={labelId}>Mode</span>
      <TooltipClickable
        aria-label="Scale mode"
        content={
          <>
            <p className="mb-1">Sets the lightness direction of the scale.</p>
            <p>
              <b>Light</b>: 50 lightest, 950 darkest.
            </p>
            <p>
              <b>Dark</b>: 50 darkest, 950 lightest, re-derived for dark themes.
            </p>
            <p>
              <b>Reversed</b>: the Light scale with its keys mirrored (50↔950).
            </p>
          </>
        }
      />
      <div
        aria-labelledby={labelId}
        className="flex items-center gap-1 bg-default-100 rounded-full"
        onKeyDown={handleKeyDown}
        role="radiogroup"
        tabIndex={-1}
      >
        {MODES.map(({ label, value }) => (
          <Button
            key={value}
            aria-checked={mode === value}
            className="px-3 rounded-full"
            onPress={() => onClick(value)}
            role="radio"
            size="xs"
            tabIndex={mode === value ? 0 : -1}
            variant={mode === value ? 'solid' : 'light'}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
