import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCSS, type HSL, parseCSS } from 'colorizr';

import TooltipClickable from '~/components/TooltipClickable';

import { hslHueGradient, saturationTooltip } from './constants';
import GradientSlider from './GradientSlider';
import NumericInput from './NumericInput';

interface HSLSlidersProps {
  color: string;
  disableSaturation: boolean;
  onChangeColor: (value: string) => void;
}

export default function HSLSliders(props: HSLSlidersProps) {
  const { color, disableSaturation, onChangeColor } = props;

  const lastEmittedRef = useRef<string>('');
  const [hsl, setHsl] = useState<HSL>(() => parseCSS(color, 'hsl'));

  // Re-derive HSL only from external changes (not our own round-trip)
  useEffect(() => {
    if (color !== lastEmittedRef.current) {
      setHsl(parseCSS(color, 'hsl'));
    }
  }, [color]);

  const { h, l, s } = hsl;

  const saturationGradient = useMemo(
    () => `linear-gradient(to right, hsl(${h} 0% ${l}%), hsl(${h} 100% ${l}%))`,
    [h, l],
  );

  const lightnessGradient = useMemo(
    () =>
      `linear-gradient(to right, hsl(${h} ${s}% 0%), hsl(${h} ${s}% 50%), hsl(${h} ${s}% 100%))`,
    [h, s],
  );

  const update = (newHsl: HSL) => {
    setHsl(newHsl);

    const oklch = formatCSS(newHsl, { format: 'oklch' });

    lastEmittedRef.current = oklch;
    onChangeColor(oklch);
  };

  return (
    <>
      <GradientSlider
        aria-label="Hue"
        endContent={
          <NumericInput
            max={360}
            min={0}
            onChange={v => update({ h: v, s, l })}
            suffix="°"
            value={`${Math.round(h)}`}
          />
        }
        gradient={hslHueGradient}
        maxValue={359.9}
        onValueChange={v => update({ h: v, s, l })}
        startContent="H"
        step={1}
        value={h}
      />
      <GradientSlider
        aria-label="Saturation"
        endContent={
          <NumericInput
            max={100}
            min={0}
            onChange={v => update({ h, s: v, l })}
            suffix="%"
            value={`${Math.round(s)}`}
          />
        }
        gradient={saturationGradient}
        isDisabled={disableSaturation}
        maxValue={100}
        onValueChange={v => update({ h, s: v, l })}
        startContent={
          <TooltipClickable
            classNames={{ base: '-ml-3' }}
            content={saturationTooltip}
            isDisabled={!disableSaturation}
          >
            S
          </TooltipClickable>
        }
        step={1}
        value={s}
      />
      <GradientSlider
        aria-label="Lightness"
        endContent={
          <NumericInput
            max={100}
            min={0}
            onChange={v => update({ h, s, l: v })}
            suffix="%"
            value={`${Math.round(l)}`}
          />
        }
        gradient={lightnessGradient}
        maxValue={100}
        onValueChange={v => update({ h, s, l: v })}
        startContent="L"
        step={1}
        value={l}
      />
    </>
  );
}
