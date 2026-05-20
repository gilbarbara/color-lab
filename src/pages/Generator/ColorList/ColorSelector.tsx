import { type ChangeEvent, type KeyboardEvent, type SyntheticEvent } from 'react';
import { useSetState } from '@gilbarbara/hooks';
import { cn, Input, Popover, PopoverContent, PopoverTrigger, useDisclosure } from '@heroui/react';
import { TrashIcon } from '@phosphor-icons/react';
import * as Sentry from '@sentry/react';
import { ChannelSliders, type ColorMode, ColorPicker } from '@transience/color-picker';

import usePalette from '~/hooks/usePalette';
import useRafCallback from '~/hooks/useRafCallback';
import { trackEvent } from '~/utils/analytics';
import { getChromaAsPercentage, getRandomColor, toOklch } from '~/utils/color';

import Button from '~/components/Button';
import Collapse from '~/components/Collapse';
import ColorBox from '~/components/ColorBox';
import ColorInput from '~/components/ColorInput';
import ConfirmTooltip from '~/components/ConfirmTooltip';
import TooltipClickable from '~/components/TooltipClickable';

import type { ColorEntry, GlobalScaleOptions } from '~/types';

import ColorActions from './ColorActions';

const saturationTooltip = (
  <>
    <p className="mb-1">Saturation is controlled globally.</p>
    <p>
      Turn off <b>Apply saturation to all colors</b> to edit.
    </p>
  </>
);

interface ColorSelectorProps {
  colorEntry: ColorEntry;
  globalOptions: GlobalScaleOptions;
  index: number;
  isOnlyColor: boolean;
}

interface ColorSelectorState {
  localName: string | null;
  mode: ColorMode;
}

export default function ColorSelector(props: ColorSelectorProps) {
  const { colorEntry, globalOptions, index, isOnlyColor } = props;
  const {
    activeColorId,
    baseSaturation,
    removeColor,
    setActiveColor,
    updateColor,
    updateGlobalOptions,
  } = usePalette();
  const [{ localName, mode }, setState] = useSetState<ColorSelectorState>({
    mode: 'oklch',
    localName: null,
  });
  const { isOpen, onOpenChange } = useDisclosure();

  const color = colorEntry.value;

  const isEditingName = localName !== null;
  const displayName = localName ?? colorEntry.name;

  const handleFocusName = () => {
    setState({ localName: colorEntry.name });
  };

  const handleBlurName = () => {
    setState({ localName: null });
  };

  const handleChangeColor = useRafCallback((value: string) => {
    let branded;

    try {
      branded = toOklch(value);
    } catch (error_) {
      Sentry.captureException(error_, {
        tags: { source: 'ColorSelector', call: 'handleChangeColor' },
        extra: { value },
      });

      return;
    }

    updateColor(index, { value: branded });

    if (index === 0) {
      updateGlobalOptions({
        saturation: getChromaAsPercentage(branded),
      });
    }
  });

  const handleChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    setState({ localName: event.target.value });
  };

  const handleKeyDownName = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && localName !== null) {
      updateColor(index, { name: localName });
      trackEvent('edit-color-name', { name: localName });
      setState({ localName: null });
    }
  };

  const handleClickMode = (value: ColorMode) => {
    if (value === mode) {
      return;
    }

    trackEvent('color-mode', { value });
    setState({ mode: value });
  };

  const handleClickRandom = () => {
    trackEvent('random-color');
    const randomColor = getRandomColor(baseSaturation);

    handleChangeColor(randomColor);
  };

  const isActive = activeColorId === colorEntry.id;

  const handleCaptureInactive = (event: SyntheticEvent) => {
    if (isActive) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    setActiveColor(colorEntry.id);
  };

  return (
    <div
      className={cn('flex flex-col bg-default-50 p-4 rounded-xl', {
        'bg-default-100': isActive,
      })}
      data-testid="ColorSelector"
      id={colorEntry.id}
      onClickCapture={handleCaptureInactive}
      onPointerDownCapture={handleCaptureInactive}
      role="presentation"
    >
      <div className="flex items-start gap-2">
        <Popover
          backdrop="transparent"
          classNames={{
            content: 'bg-white dark:bg-black',
            trigger: 'aria-expanded:opacity-100 aria-expanded:scale-[1]',
          }}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          placement="bottom-start"
          shouldCloseOnInteractOutside={element => !element.closest('[data-color-picker-portal]')}
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
            <ColorPicker
              classNames={{ root: 'w-xs' }}
              color={color}
              defaultMode={mode}
              onChange={handleChangeColor}
              showColorInput={false}
              showGlobalHue
              showModeSelector={false}
              showSliders={false}
              showSwatch={false}
            />
          </PopoverContent>
        </Popover>
        <div className="w-full space-y-2">
          <div className="flex items-center gap-1">
            <Input
              classNames={{
                innerWrapper: 'pb-0',
                inputWrapper: ' h-6 min-h-6',
                input: 'text-base font-semibold text-foreground-800',
              }}
              color={isEditingName && localName !== colorEntry.name ? 'warning' : undefined}
              disableAnimation
              name={`color-name-${index}`}
              onBlur={handleBlurName}
              onChange={handleChangeName}
              onFocus={handleFocusName}
              onKeyDown={handleKeyDownName}
              size="sm"
              value={displayName}
              variant="underlined"
            />
            <ConfirmTooltip
              confirmMessage="Click again to remove"
              isDisabled={isOnlyColor}
              message="Remove color"
              onConfirm={() => {
                trackEvent('remove-color');
                removeColor(index);
              }}
            >
              <Button
                aria-label="Remove color"
                isDisabled={isOnlyColor}
                isIconOnly
                size="xs"
                variant="light"
              >
                <TrashIcon className="text-base" />
              </Button>
            </ConfirmTooltip>
          </div>

          <ColorInput color={color} mode={mode} onChange={handleChangeColor} />
        </div>
      </div>

      <Collapse duration={0.4} ease="circInOut" isOpen={isActive}>
        <div className="flex flex-col mt-3 gap-2">
          <ChannelSliders
            channels={{
              s: {
                disabled: globalOptions.saturationOverride,
              },
              c: {
                disabled: globalOptions.saturationOverride,
              },
            }}
            color={color}
            labels={{
              hslSliders: {
                s: {
                  label: (
                    <TooltipClickable
                      aria-label="Saturation Override"
                      classNames={{ base: '-ml-3' }}
                      content={saturationTooltip}
                      isDisabled={!globalOptions.saturationOverride}
                    >
                      S
                    </TooltipClickable>
                  ),
                },
              },
              oklchSliders: {
                c: {
                  label: (
                    <TooltipClickable
                      aria-label="Saturation Override"
                      classNames={{ base: '-ml-3' }}
                      content={saturationTooltip}
                      isDisabled={!globalOptions.saturationOverride}
                    >
                      C
                    </TooltipClickable>
                  ),
                },
              },
            }}
            mode={mode}
            onChange={handleChangeColor}
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
      </Collapse>
    </div>
  );
}
