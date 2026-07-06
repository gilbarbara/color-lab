import { type ScaleMode as ScaleModeType } from 'colorizr';

import ToggleGroup from '~/components/ToggleGroup';
import TooltipClickable from '~/components/TooltipClickable';

interface OptionsModeProps {
  mode: ScaleModeType;
  onChange: (value: ScaleModeType) => void;
}

const MODES: Array<{ label: string; value: ScaleModeType }> = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Reversed', value: 'reversed' },
];

export default function OptionsMode(props: OptionsModeProps) {
  const { mode, onChange } = props;

  return (
    <ToggleGroup
      info={
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
      }
      items={MODES}
      label="Mode"
      onChange={onChange}
      value={mode}
    />
  );
}
