import { useMemo } from 'react';
import { formatCSS, getOkLCHMaxChroma, type LCH, parseCSS } from 'colorizr';

import GradientSlider from '~/components/GradientSlider';
import SliderInput from '~/components/SliderInput';
import TooltipClickable from '~/components/TooltipClickable';

import { oklchHueGradient, saturationTooltip } from './constants';

interface OKLCHSlidersProps {
  color: string;
  disableChroma: boolean;
  onChangeColor: (value: string) => void;
}

export default function OKLCHSliders(props: OKLCHSlidersProps) {
  const { color, disableChroma, onChangeColor } = props;

  const oklch = useMemo(() => parseCSS(color, 'oklch'), [color]);
  const { c, h, l } = oklch;

  const maxChroma = useMemo(() => getOkLCHMaxChroma({ l, c: 0, h }), [l, h]);

  const lightnessGradient = useMemo(
    () =>
      `linear-gradient(to right, oklch(0 ${c} ${h}), oklch(${l} ${c} ${h}), oklch(1 ${c} ${h}))`,
    [c, h, l],
  );

  const chromaGradient = useMemo(
    () => `linear-gradient(to right, oklch(${l} 0 ${h}), oklch(${l} ${maxChroma} ${h}))`,
    [l, h, maxChroma],
  );

  const update = (okLCH: LCH) => {
    onChangeColor(formatCSS(okLCH, { format: 'oklch' }));
  };

  const handleChangeLightness = (lightness: number) => {
    const relativeChroma = maxChroma > 0 ? c / maxChroma : 0;
    const newMaxChroma = getOkLCHMaxChroma({ l: lightness, c: 0, h });

    update({ l: lightness, c: relativeChroma * newMaxChroma, h });
  };

  const handleChangeChroma = (chroma: number) => {
    update({ l, c: Number.isNaN(chroma) ? 0 : chroma, h });
  };

  const handleChangeHue = (hue: number) => {
    const relativeChroma = maxChroma > 0 ? c / maxChroma : 0;
    const newMaxChroma = getOkLCHMaxChroma({ l, c: 0, h: hue });

    update({ l, c: relativeChroma * newMaxChroma, h: hue });
  };

  return (
    <>
      <GradientSlider
        aria-label="Lightness"
        endContent={
          <SliderInput
            max={100}
            min={0}
            onChange={v => handleChangeLightness(v / 100)}
            step={0.1}
            suffix="%"
            value={(l * 100).toFixed(1)}
          />
        }
        gradient={lightnessGradient}
        maxValue={1}
        onValueChange={handleChangeLightness}
        startContent="L"
        step={0.001}
        value={l}
      />
      <GradientSlider
        aria-label="Chroma"
        endContent={
          <SliderInput
            max={maxChroma}
            min={0}
            onChange={handleChangeChroma}
            step={0.001}
            suffix=" "
            value={c.toFixed(3)}
          />
        }
        gradient={chromaGradient}
        isDisabled={disableChroma}
        maxValue={maxChroma}
        onValueChange={handleChangeChroma}
        startContent={
          <TooltipClickable
            classNames={{ base: '-ml-3' }}
            content={saturationTooltip}
            isDisabled={!disableChroma}
          >
            C
          </TooltipClickable>
        }
        step={0.001}
        value={c}
      />
      <GradientSlider
        aria-label="Hue"
        endContent={
          <SliderInput
            max={360}
            min={0}
            onChange={handleChangeHue}
            step={0.1}
            suffix="°"
            value={h.toFixed(1)}
          />
        }
        gradient={oklchHueGradient}
        maxValue={360}
        onValueChange={handleChangeHue}
        startContent="H"
        step={0.001}
        value={h}
      />
    </>
  );
}
