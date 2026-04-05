import { useMemo } from 'react';
import { Button, Popover, PopoverContent, PopoverTrigger, useDisclosure } from '@heroui/react';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import Chrome, { ChromeInputType } from '@uiw/react-color-chrome';
import { hex2hsl, type HSL, hsl2hex, isHex } from 'colorizr';

import { trackEvent } from '~/utils/analytics';
import { getRandomColor } from '~/utils/color';

import ColorCircle from '~/components/ColorCircle';
import { Input } from '~/components/Field';
import GradientSlider from '~/components/GradientSlider';
import TooltipClickable from '~/components/TooltipClickable';

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
  const { isOpen, onOpenChange } = useDisclosure();

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

  const handleChangeHex = (value: string) => {
    const stripped = value.replace(/[^\da-f]/gi, '').slice(0, 6);
    const prefixed = stripped ? `#${stripped}` : '';

    onChangeHex(prefixed);

    if ((prefixed.length === 4 || prefixed.length === 7) && isHex(prefixed)) {
      onChangeColor(prefixed);
    }
  };

  const handleClickRandomHex = () => {
    trackEvent('random-color');
    const newHex = getRandomColor('hex', baseSaturation);

    onChangeHex(newHex);
    onChangeColor(newHex);
  };

  return (
    <div className="space-y-3" data-uid="SRGB">
      <div className="flex items-center relative">
        <Input
          aria-label="Hex color"
          classNames={{
            inputWrapper: 'rounded-e-none',
          }}
          onValueChange={handleChangeHex}
          size="lg"
          startContent={
            <Popover
              backdrop="transparent"
              classNames={{
                base: '-ml-1.5',
                trigger: 'aria-expanded:opacity-100 aria-expanded:scale-[1]',
              }}
              isOpen={isOpen}
              onOpenChange={onOpenChange}
              placement="bottom-start"
              showArrow
            >
              <PopoverTrigger>
                <ColorCircle
                  aria-label="Color picker"
                  color={hex}
                  onClick={() => trackEvent('color-picker')}
                />
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Chrome
                  color={hex}
                  inputType={ChromeInputType.HEXA}
                  onChange={color => {
                    handleChangeHex(color.hex);
                  }}
                  showAlpha={false}
                  showTriangle={false}
                />
              </PopoverContent>
            </Popover>
          }
          type="text"
          value={hex}
        />
        <Button
          aria-label="Random color"
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
          <TooltipClickable
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
            S
          </TooltipClickable>
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
