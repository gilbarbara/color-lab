import { useMemo } from 'react';
import { Button } from '@heroui/react';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { formatCSS, getOkLCHMaxChroma, type LCH } from 'colorizr';

import { getRandomColor } from '~/utils/color';

import ColorCircle from '~/components/ColorCircle';
import { Input } from '~/components/Field';
import GradientSlider from '~/components/GradientSlider';
import Tooltip from '~/components/Tooltip';

interface OKLCHProps {
  baseSaturation: number;
  disableChroma: boolean;
  oklch: LCH;
  onChangeColor: (value: string) => void;
  value: string;
}

const hueGradient = `linear-gradient(to right, oklch(0.7 0.2 0), oklch(0.7 0.2 60), oklch(0.7 0.2 120), oklch(0.7 0.2 180), oklch(0.7 0.2 240), oklch(0.7 0.2 300), oklch(0.7 0.2 360))`;

export default function OKLCH(props: OKLCHProps) {
  const { baseSaturation, disableChroma, oklch, onChangeColor, value } = props;

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

  const updateLCH = (okLCH: LCH) => {
    onChangeColor(formatCSS(okLCH, { format: 'oklch' }));
  };

  const handleChangeLightness = (lightness: number) => {
    const relativeChroma = maxChroma > 0 ? c / maxChroma : 0;
    const newMaxChroma = getOkLCHMaxChroma({ l: lightness, c: 0, h });

    updateLCH({ l: lightness, c: relativeChroma * newMaxChroma, h });
  };

  const handleChangeChroma = (chroma: number) => {
    updateLCH({ l, c: Number.isNaN(chroma) ? 0 : chroma, h });
  };

  const handleChangeHue = (hue: number) => {
    const relativeChroma = maxChroma > 0 ? c / maxChroma : 0;
    const newMaxChroma = getOkLCHMaxChroma({ l, c: 0, h: hue });

    updateLCH({ l, c: relativeChroma * newMaxChroma, h: hue });
  };

  const handleClickRandomOKLCH = () => {
    const newOklch = getRandomColor('oklch', baseSaturation);

    onChangeColor(newOklch);
  };

  return (
    <div className="space-y-3" data-uid="OKLCH">
      <div className="flex h-12 items-center gap-2 pl-3 rounded-large border border-default-200">
        <Tooltip content="Use the sliders below" delay={250} placement="bottom-start">
          <ColorCircle color={value} />
        </Tooltip>
        <div className="flex flex-1 items-center">
          <Input
            classNames={{
              input: 'data-[has-end-content=true]:pe-0.5 text-right',
              inputWrapper: 'rounded-none border-0 px-2',
            }}
            endContent={<span className="text-foreground-500">%</span>}
            readOnly
            size="lg"
            startContent={<span className="font-semibold text-foreground-500">L</span>}
            value={`${Math.round(l * 100)}`}
          />
          <Input
            classNames={{
              inputWrapper: 'rounded-none border-0 px-2',
            }}
            size="lg"
            startContent={<span className="font-semibold text-foreground-500">C</span>}
            value={c.toFixed(2)}
          />
          <Input
            classNames={{
              input: 'data-[has-end-content=true]:pe-0.5 text-right',
              inputWrapper: 'rounded-none border-0 px-2',
            }}
            endContent={<span className="text-foreground-500">°</span>}
            size="lg"
            startContent={<span className="font-semibold text-foreground-500">H</span>}
            value={`${Math.round(h)}`}
          />
        </div>
        <Button
          className="rounded-s-none"
          isIconOnly
          onPress={handleClickRandomOKLCH}
          size="lg"
          variant="bordered"
        >
          <ArrowsClockwiseIcon className="text-xl" />
        </Button>
      </div>

      <GradientSlider
        aria-label="Lightness"
        gradient={lightnessGradient}
        maxValue={1}
        onValueChange={handleChangeLightness}
        startContent="L"
        step={0.001}
        value={l}
      />

      <GradientSlider
        aria-label="Chroma"
        gradient={chromaGradient}
        isDisabled={disableChroma}
        maxValue={maxChroma}
        onValueChange={handleChangeChroma}
        startContent={
          <Tooltip
            classNames={{
              base: '-ml-3',
            }}
            content={
              <>
                <p className="mb1">Saturation is controlled globally.</p>
                <p>
                  Turn off <b>Apply saturation to all colors</b> to edit.
                </p>
              </>
            }
            isDisabled={!disableChroma}
          >
            <span>C</span>
          </Tooltip>
        }
        step={0.001}
        value={c}
      />

      <GradientSlider
        aria-label="Hue"
        gradient={hueGradient}
        maxValue={360}
        onValueChange={handleChangeHue}
        startContent="H"
        step={0.001}
        value={h}
      />
    </div>
  );
}
