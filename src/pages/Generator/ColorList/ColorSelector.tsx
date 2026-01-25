import { type ChangeEvent, type KeyboardEvent, useEffect } from 'react';
import { useBreakpoint, useMemoDeepCompare, useSetState } from '@gilbarbara/hooks';
import {
  Button,
  cn,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useDisclosure,
} from '@heroui/react';
import { CaretUpDownIcon, GearIcon, TrashIcon } from '@phosphor-icons/react';
import { convert, getColorType, parseCSS, readableColorAPCA } from 'colorizr';

import { trackEvent } from '~/utils/analytics';
import { getChromaAsPercentage } from '~/utils/color';

import ConfirmTooltip from '~/components/ConfirmTooltip';
import ScaleColorOptions from '~/components/ScaleColorOptions';
import Tooltip from '~/components/Tooltip';

import type { ColorEntry, GlobalScaleOptions } from '~/types';

import OKLCH from './OKLCH';
import SRGB from './SRGB';

interface ColorSelectorProps {
  baseSaturation: number;
  colorEntry: ColorEntry;
  globalOptions: GlobalScaleOptions;
  index: number;
  isOnlyColor: boolean;
  onRemoveColor: (index: number) => void;
  onResetColor: (index: number) => void;
  onUpdateColor: (index: number, updates: Partial<ColorEntry>) => void;
  onUpdateGlobalOptions: (updates: Partial<GlobalScaleOptions>) => void;
}

interface ColorSelectorState {
  hex: string;
  mode: 'srgb' | 'oklch';
  name: string;
}

export default function ColorSelector(props: ColorSelectorProps) {
  const {
    baseSaturation,
    colorEntry,
    globalOptions,
    index,
    isOnlyColor,
    onRemoveColor,
    onResetColor,
    onUpdateColor,
    onUpdateGlobalOptions,
  } = props;
  const [{ hex, mode, name }, setState] = useSetState<ColorSelectorState>({
    hex: convert(colorEntry.value, 'hex'),
    mode: getColorType(colorEntry.value) === 'oklch' ? 'oklch' : 'srgb',
    name: colorEntry.name,
  });
  const { isOpen, onOpenChange } = useDisclosure();
  const { max, min } = useBreakpoint();

  const color = colorEntry.value;
  const oklch = parseCSS(color, 'oklch');

  // Sync when colorValue changes externally (URL navigation, reset)
  useEffect(() => {
    setState({
      hex: convert(color, 'hex'),
      mode: getColorType(color) === 'oklch' ? 'oklch' : 'srgb',
    });
  }, [color, setState]);

  const useLightTheme = useMemoDeepCompare(() => {
    return readableColorAPCA(color) !== '#ffffff';
  }, [color, globalOptions, colorEntry.overrides]);

  const handleBlurName = () => {
    if (colorEntry.name !== name) {
      setState({
        name: colorEntry.name,
      });
    }
  };

  const handleChangeColor = (value: string) => {
    onUpdateColor(index, { value });

    if (index === 0) {
      onUpdateGlobalOptions({
        saturation: getChromaAsPercentage(value),
      });
    }

    if (mode === 'oklch') {
      setState({ hex: convert(value, 'hex') });
    }
  };

  const handleChangeHex = (value: string) => {
    setState({ hex: value });
  };

  const handleChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    setState({ name: value });
  };

  const handleKeyDownName = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onUpdateColor(index, { name });
      trackEvent('edit-color-name', { name });
    }
  };

  const handleClickMode = () => {
    const next = mode === 'srgb' ? 'oklch' : 'srgb';

    trackEvent('color-mode', { value: next });
    setState({ mode: next });
  };

  const handleClickOptions = () => {
    trackEvent('open-color-options-overrides');
  };

  const handleResetOptions = () => {
    onResetColor(index);
    trackEvent('reset-color-options-overrides');
  };

  const handleUpdateOptions = (updates: Partial<GlobalScaleOptions>) => {
    onUpdateColor(index, { overrides: { ...colorEntry.overrides, ...updates } });
  };

  return (
    <div
      className="flex flex-col gap-3 bg-default-100 p-4 rounded-xl scroll-mt-20"
      data-uid="ColorSelector"
      id={`${index}-${color}`}
    >
      <style>
        {`
      .popover-content-${index} { background-color: ${color}; }
      .popover-base-${index} {
        &:before {
          background-color: ${color};
          ${max('lg') ? 'right: calc(var(--spacing) * 8);' : ''}
        }
       }
      `}
      </style>
      <div className="flex items-center justify-between">
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
        <div className="flex items-center ml-2">
          <Tooltip content="Switch between HEX and OKLCH" delay={250}>
            <Button
              endContent={<CaretUpDownIcon />}
              onPress={handleClickMode}
              size="sm"
              variant="bordered"
            >
              {mode.toUpperCase()}
            </Button>
          </Tooltip>
          <Popover
            classNames={{
              base: cn(`popover-base-${index}`, {
                light: useLightTheme,
                dark: !useLightTheme,
              }),
              content: cn(`p-4 min-w-xs text-foreground popover-content-${index}`),
            }}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement={min('lg') ? 'right-start' : 'bottom-end'}
            shouldBlockScroll
            showArrow
            size="lg"
          >
            <PopoverTrigger>
              <Button
                aria-label="Change color options"
                isIconOnly
                onPress={handleClickOptions}
                size="sm"
                variant="light"
              >
                <Tooltip content="Color options" delay={250} placement="bottom-end">
                  <span className="size-8 inline-flex items-center justify-center">
                    <GearIcon className="text-base" />
                  </span>
                </Tooltip>
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <ScaleColorOptions
                defaultOptions={globalOptions}
                onReset={handleResetOptions}
                onUpdate={handleUpdateOptions}
                options={{ ...globalOptions, ...colorEntry.overrides }}
                title={`Options for ${colorEntry.name}`}
              />
            </PopoverContent>
          </Popover>
          <ConfirmTooltip
            confirmMessage="Click again to remove"
            isDisabled={isOnlyColor}
            message="Remove color"
            onConfirm={() => {
              trackEvent('remove-color');
              onRemoveColor(index);
            }}
          >
            <Button
              aria-label="Remove color"
              isDisabled={isOnlyColor}
              isIconOnly
              size="sm"
              variant="light"
            >
              <TrashIcon className="text-base" />
            </Button>
          </ConfirmTooltip>
        </div>
      </div>

      {mode === 'srgb' ? (
        <SRGB
          baseSaturation={baseSaturation}
          disableSaturation={globalOptions.saturationOverride}
          hex={hex}
          onChangeColor={handleChangeColor}
          onChangeHex={handleChangeHex}
        />
      ) : (
        <OKLCH
          baseSaturation={baseSaturation}
          disableChroma={globalOptions.saturationOverride}
          oklch={oklch}
          onChangeColor={handleChangeColor}
          value={color}
        />
      )}
    </div>
  );
}
