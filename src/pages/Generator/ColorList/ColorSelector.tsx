import { type ChangeEvent, type KeyboardEvent, useEffect, useRef } from 'react';
import { useSetState } from '@gilbarbara/hooks';
import {
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  type PressEvent,
  useDisclosure,
} from '@heroui/react';
import Chrome, { ChromeInputType } from '@uiw/react-color-chrome';
import { convertCSS, formatCSS, isValidColor, parseCSS } from 'colorizr';

import usePalette from '~/hooks/usePalette';
import useRafCallback from '~/hooks/useRafCallback';
import { trackEvent } from '~/utils/analytics';
import { getChromaAsPercentage, getRandomColor } from '~/utils/color';

import ChannelSliders, { type ColorMode } from '~/components/ChannelSliders';
import ColorBox from '~/components/ColorBox';

import type { ColorEntry, GlobalScaleOptions } from '~/types';

import ColorActions from './ColorActions';

interface ColorSelectorProps {
  colorEntry: ColorEntry;
  globalOptions: GlobalScaleOptions;
  index: number;
  isOnlyColor: boolean;
}

interface ColorSelectorState {
  input: string;
  mode: ColorMode;
  name: string;
}

export default function ColorSelector(props: ColorSelectorProps) {
  const { colorEntry, globalOptions, index, isOnlyColor } = props;
  const { baseSaturation, updateColor, updateGlobalOptions } = usePalette();
  const [{ input, mode, name }, setState] = useSetState<ColorSelectorState>({
    input: colorEntry.value,
    mode: 'oklch',
    name: colorEntry.name,
  });
  const { isOpen, onOpenChange } = useDisclosure();
  const isLocalChange = useRef(false);

  const color = colorEntry.value;
  const pickerHex = convertCSS(color, 'hex');

  // Sync when colorValue changes externally (URL navigation, reset)
  useEffect(() => {
    if (isLocalChange.current) {
      isLocalChange.current = false;

      return;
    }

    setState({ input: color });
  }, [color, setState]);

  const handleBlurName = () => {
    if (colorEntry.name !== name) {
      setState({
        name: colorEntry.name,
      });
    }
  };

  const handleChangeColor = useRafCallback((value: string) => {
    updateColor(index, { value });

    if (index === 0) {
      updateGlobalOptions({
        saturation: getChromaAsPercentage(value),
      });
    }
  });

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

  const handleClickMode = (event: PressEvent) => {
    const next = event.target.textContent?.toLowerCase() as ColorMode;

    if (next === mode) {
      return;
    }

    trackEvent('color-mode', { value: next });
    setState({ mode: next });
  };

  const handleClickRandom = () => {
    trackEvent('random-color');
    const randomColor = getRandomColor(baseSaturation);

    handleChangeColor(randomColor);
  };

  const handleChangeInput = (value: string) => {
    const trimmed = value.trim();
    const bareHexPattern = /^(?:[\da-f]{3}){1,2}$/i;

    if (bareHexPattern.test(trimmed)) {
      const prefixed = `#${trimmed}`;

      setState({ input: prefixed });
      isLocalChange.current = true;

      const oklch = formatCSS(parseCSS(prefixed, 'oklch'), { format: 'oklch' });

      handleChangeColor(oklch);

      return;
    }

    setState({ input: value });

    // Only accept 3/6-char hex (no RGBA) to avoid transparent colors
    if (/^#[\da-f]+$/i.test(trimmed) && trimmed.length !== 4 && trimmed.length !== 7) {
      return;
    }

    if (isValidColor(trimmed)) {
      isLocalChange.current = true;

      const oklch = formatCSS(parseCSS(trimmed, 'oklch'), { format: 'oklch' });

      handleChangeColor(oklch);
    }
  };

  const handleChangePicker = (hex: string) => {
    const oklch = formatCSS(parseCSS(hex, 'oklch'), { format: 'oklch' });

    handleChangeColor(oklch);
  };

  return (
    <div
      className="flex flex-col gap-3 bg-default-100 p-4 rounded-xl scroll-mt-20"
      data-testid="ColorSelector"
      id={`${index}-${color}`}
    >
      <div className="flex items-start gap-2">
        <Popover
          backdrop="transparent"
          classNames={{
            trigger: 'aria-expanded:opacity-100 aria-expanded:scale-[1]',
          }}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          placement="bottom-start"
          showArrow
        >
          <PopoverTrigger>
            <ColorBox
              aria-label="Color picker"
              color={color}
              onClick={() => trackEvent('color-picker')}
              size="lg"
            />
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <Chrome
              color={pickerHex}
              inputType={ChromeInputType.HEXA}
              onChange={result => {
                handleChangePicker(result.hex);
              }}
              showAlpha={false}
              showTriangle={false}
            />
          </PopoverContent>
        </Popover>
        <div className="w-full space-y-2">
          <Input
            classNames={{
              innerWrapper: 'pb-0',
              inputWrapper: ' h-6 min-h-6',
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

          <Input
            aria-label="Color value"
            classNames={{
              inputWrapper: 'h-8 min-h-8 px-2',
            }}
            onValueChange={handleChangeInput}
            type="text"
            value={input}
            variant="bordered"
          />
        </div>
      </div>

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
        mode={mode}
        onClickMode={handleClickMode}
        onClickRandom={handleClickRandom}
      />
    </div>
  );
}
