import { type ChangeEvent, useMemo, useRef } from 'react';
import { Button } from '@heroui/react';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { hex2hsl, type HSL, hsl2hex, isHex } from 'colorizr';

import { getRandomColor } from '~/utils/color';

import ColorCircle from '~/components/ColorCircle';
import { Input } from '~/components/Field';
import GradientSlider from '~/components/GradientSlider';
import Tooltip from '~/components/Tooltip';

interface SRGBProps {
  baseSaturation: number;
  disableSaturation: boolean;
  hex: string;
  onChangeColor: (value: string) => void;
  onChangeHex: (newHex: string) => void;
}

const hueGradient =
  'linear-gradient(to right, hsl(0 100% 70%), hsl(60 100% 70%), hsl(120 100% 70%), hsl(180 100% 70%), hsl(240 100% 70%), hsl(300 100% 70%), hsl(360 100% 70%))';

export default function SRGB(props: SRGBProps) {
  const { baseSaturation, disableSaturation, hex, onChangeColor, onChangeHex } = props;
  const colorInputRef = useRef<HTMLInputElement>(null);

  const hsl = useMemo(() => (isHex(hex) ? hex2hsl(hex) : { h: 0, s: 0, l: 50 }), [hex]);
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

  const updateFromHSL = (newHsl: HSL) => {
    const newHex = hsl2hex(newHsl);

    onChangeHex(newHex);
    onChangeColor(newHex);
  };

  const handleChangeHue = (hue: number) => updateFromHSL({ h: hue, s, l });
  const handleChangeSaturation = (sat: number) => updateFromHSL({ h, s: sat, l });
  const handleChangeLightness = (light: number) => updateFromHSL({ h, s, l: light });

  const handleChangeColorInput = (event: ChangeEvent<HTMLInputElement>) => {
    const newHex = event.target.value;

    onChangeHex(newHex);
    onChangeColor(newHex);
  };

  const handleChangeHex = (value: string) => {
    onChangeHex(value);

    if (isHex(value)) {
      onChangeColor(value);
    }
  };

  const handleClickRandomHex = () => {
    const newHex = getRandomColor('hex', baseSaturation);

    onChangeHex(newHex);
    onChangeColor(newHex);
  };

  return (
    <div className="space-y-3" data-uid="SRGB">
      <div className="flex items-center relative">
        <input
          ref={colorInputRef}
          aria-hidden="true"
          className="sr-only absolute top-0 left-10"
          onChange={handleChangeColorInput}
          tabIndex={-1}
          type="color"
          value={hex}
        />
        <Input
          aria-label="Hex color"
          classNames={{
            inputWrapper: 'rounded-e-none',
          }}
          onValueChange={handleChangeHex}
          size="lg"
          startContent={
            <Tooltip content="Open a color picker" delay={250} placement="bottom-start">
              <ColorCircle
                aria-label="Color picker"
                color={hex}
                onClick={() => colorInputRef.current?.click()}
              />
            </Tooltip>
          }
          type="text"
          value={hex}
        />
        <Button
          className="rounded-s-none border-l-0"
          isIconOnly
          onPress={handleClickRandomHex}
          size="lg"
          variant="bordered"
        >
          <ArrowsClockwiseIcon className="text-xl" />
        </Button>
      </div>

      <GradientSlider
        aria-label="Hue"
        gradient={hueGradient}
        maxValue={359.9}
        onValueChange={handleChangeHue}
        startContent="H"
        step={1}
        value={h}
      />

      <GradientSlider
        aria-label="Saturation"
        gradient={saturationGradient}
        isDisabled={disableSaturation}
        maxValue={100}
        onValueChange={handleChangeSaturation}
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
            isDisabled={!disableSaturation}
          >
            <span>S</span>
          </Tooltip>
        }
        step={1}
        value={s}
      />

      <GradientSlider
        aria-label="Lightness"
        gradient={lightnessGradient}
        maxValue={100}
        onValueChange={handleChangeLightness}
        startContent="L"
        step={1}
        value={l}
      />
    </div>
  );
}
