import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo } from 'react';
import { useSetState } from '@gilbarbara/hooks';
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useDisclosure,
} from '@heroui/react';
import { CaretUpDownIcon } from '@phosphor-icons/react';
import Chrome, { ChromeInputType } from '@uiw/react-color-chrome';
import { convert, formatCSS, isHex, isValidColor, parseCSS } from 'colorizr';

import usePalette from '~/hooks/usePalette';
import { trackEvent } from '~/utils/analytics';
import { getChromaAsPercentage, getRandomColor } from '~/utils/color';

import ChannelSliders, { type ColorMode } from '~/components/ChannelSliders';
import ColorCircle from '~/components/ColorCircle';
import Tooltip from '~/components/Tooltip';

import type { ColorEntry, GlobalScaleOptions } from '~/types';

import ColorActions from './ColorActions';

const modes: ColorMode[] = ['hsl', 'rgb', 'oklch'];

interface ColorSelectorProps {
  colorEntry: ColorEntry;
  globalOptions: GlobalScaleOptions;
  index: number;
  isOnlyColor: boolean;
}

interface ColorSelectorState {
  hex: string;
  mode: ColorMode;
  name: string;
}

export default function ColorSelector(props: ColorSelectorProps) {
  const { colorEntry, globalOptions, index, isOnlyColor } = props;
  const { baseSaturation, updateColor, updateGlobalOptions } = usePalette();
  const [{ hex, mode, name }, setState] = useSetState<ColorSelectorState>({
    hex: convert(colorEntry.value, 'hex'),
    mode: 'hsl',
    name: colorEntry.name,
  });
  const { isOpen, onOpenChange } = useDisclosure();

  const color = colorEntry.value;

  const inputValue = useMemo(() => (mode === 'oklch' ? color : hex), [color, hex, mode]);

  // Sync when colorValue changes externally (URL navigation, reset)
  useEffect(() => {
    setState({
      hex: convert(color, 'hex'),
    });
  }, [color, setState]);

  const handleBlurName = () => {
    if (colorEntry.name !== name) {
      setState({
        name: colorEntry.name,
      });
    }
  };

  const handleChangeColor = (value: string) => {
    updateColor(index, { value });

    if (index === 0) {
      updateGlobalOptions({
        saturation: getChromaAsPercentage(value),
      });
    }

    setState({ hex: convert(value, 'hex') });
  };

  const handleChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    setState({ name: value });
  };

  const handleKeyDownName = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      updateColor(index, { name });
      trackEvent('edit-color-name', { name });
    }
  };

  const handleClickMode = () => {
    const currentIndex = modes.indexOf(mode);
    const next = modes[(currentIndex + 1) % modes.length];

    trackEvent('color-mode', { value: next });
    setState({ mode: next });
  };

  const handleClickRandom = () => {
    trackEvent('random-color');
    const randomColor = getRandomColor(baseSaturation);

    handleChangeColor(randomColor);
  };

  const handleChangeInput = (value: string) => {
    if (mode === 'oklch') {
      if (isValidColor(value)) {
        handleChangeColor(value);
      }
    } else {
      const stripped = value.replace(/[^\da-f]/gi, '').slice(0, 6);
      const prefixed = stripped ? `#${stripped}` : '';

      setState({ hex: prefixed });

      if ((prefixed.length === 4 || prefixed.length === 7) && isHex(prefixed)) {
        const oklch = formatCSS(parseCSS(prefixed, 'oklch'), { format: 'oklch' });

        handleChangeColor(oklch);
      }
    }
  };

  const handleChangePicker = (pickerHex: string) => {
    const oklch = formatCSS(parseCSS(pickerHex, 'oklch'), { format: 'oklch' });

    handleChangeColor(oklch);
  };

  return (
    <div
      className="flex flex-col gap-3 bg-default-100 p-4 rounded-xl scroll-mt-20"
      data-uid="ColorSelector"
      id={`${index}-${color}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
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
                onChange={result => {
                  handleChangePicker(result.hex);
                }}
                showAlpha={false}
                showTriangle={false}
              />
            </PopoverContent>
          </Popover>
          <Input
            classNames={{
              innerWrapper: 'pb-0',
              input: 'text-base font-semibold text-foreground-800',
            }}
            color={colorEntry.name !== name ? 'warning' : undefined}
            disableAnimation
            name={`color-name-${index}`}
            onBlur={handleBlurName}
            onChange={handleChangeName}
            onKeyDown={handleKeyDownName}
            size="sm"
            value={name}
            variant="underlined"
          />
        </div>
        <div className="flex items-center ml-2">
          <Tooltip content="Switch color space (HSL / RGB / OKLCH)" delay={250}>
            <Button
              endContent={<CaretUpDownIcon />}
              onPress={handleClickMode}
              size="sm"
              variant="bordered"
            >
              {mode.toUpperCase()}
            </Button>
          </Tooltip>
        </div>
      </div>

      <Input
        aria-label="Color value"
        onValueChange={handleChangeInput}
        type="text"
        value={inputValue}
        variant="bordered"
      />

      <ChannelSliders
        color={color}
        disableSaturation={globalOptions.saturationOverride}
        mode={mode}
        onChangeColor={handleChangeColor}
      />
      <ColorActions
        colorEntry={colorEntry}
        index={index}
        isOnlyColor={isOnlyColor}
        onRandomColor={handleClickRandom}
      />
    </div>
  );
}
