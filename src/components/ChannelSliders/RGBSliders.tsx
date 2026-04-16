import { useEffect, useRef, useState } from 'react';
import { formatCSS, parseCSS, type RGB } from 'colorizr';

import GradientSlider from './GradientSlider';
import NumericInput from './NumericInput';

interface RGBSlidersProps {
  color: string;
  onChangeColor: (value: string) => void;
}

export default function RGBSliders(props: RGBSlidersProps) {
  const { color, onChangeColor } = props;

  const lastEmittedRef = useRef<string>('');
  const [rgb, setRgb] = useState<RGB>(() => parseCSS(color, 'rgb'));

  // Re-derive RGB only from external changes (not our own round-trip)
  useEffect(() => {
    if (color !== lastEmittedRef.current) {
      setRgb(parseCSS(color, 'rgb'));
    }
  }, [color]);

  const { b, g, r } = rgb;

  const update = (newRgb: RGB) => {
    setRgb(newRgb);

    const oklch = formatCSS(newRgb, { format: 'oklch' });

    lastEmittedRef.current = oklch;
    onChangeColor(oklch);
  };

  return (
    <>
      <GradientSlider
        aria-label="Red"
        endContent={
          <NumericInput
            max={255}
            min={0}
            onChange={v => update({ r: v, g, b })}
            suffix=" "
            value={`${Math.round(r)}`}
          />
        }
        gradient="linear-gradient(to right, rgb(0 0 0), rgb(255 0 0))"
        maxValue={255}
        onValueChange={v => update({ r: v, g, b })}
        startContent="R"
        step={1}
        value={r}
      />
      <GradientSlider
        aria-label="Green"
        endContent={
          <NumericInput
            max={255}
            min={0}
            onChange={v => update({ r, g: v, b })}
            suffix=" "
            value={`${Math.round(g)}`}
          />
        }
        gradient="linear-gradient(to right, rgb(0 0 0), rgb(0 255 0))"
        maxValue={255}
        onValueChange={v => update({ r, g: v, b })}
        startContent="G"
        step={1}
        value={g}
      />
      <GradientSlider
        aria-label="Blue"
        endContent={
          <NumericInput
            max={255}
            min={0}
            onChange={v => update({ r, g, b: v })}
            suffix=" "
            value={`${Math.round(b)}`}
          />
        }
        gradient="linear-gradient(to right, rgb(0 0 0), rgb(0 0 255))"
        maxValue={255}
        onValueChange={v => update({ r, g, b: v })}
        startContent="B"
        step={1}
        value={b}
      />
    </>
  );
}
