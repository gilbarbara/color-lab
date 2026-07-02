import { memo, type SyntheticEvent, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useSetState } from '@gilbarbara/hooks';
import { cn, Popover, PopoverContent, PopoverTrigger, useDisclosure } from '@heroui/react';
import { TrashIcon } from '@phosphor-icons/react';
import * as Sentry from '@sentry/nextjs';
import { ChannelSliders, type ColorMode, ColorPicker } from '@transience/color-picker';

import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import useRafCallback from '~/hooks/useRafCallback';
import { trackEvent } from '~/utils/analytics';
import { getChromaAsPercentage, getRandomColor, toOklch } from '~/utils/color';

import Button from '~/components/Button';
import Collapse from '~/components/Collapse';
import ColorBox from '~/components/ColorBox';
import ColorInput from '~/components/ColorInput';
import ConfirmTooltip from '~/components/ConfirmTooltip';
import EditableInput from '~/components/EditableInput';
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

interface ColorItemProps {
  colorEntry: ColorEntry;
  globalOptions: GlobalScaleOptions;
  index: number;
  isOnlyColor: boolean;
}

interface ColorItemState {
  mode: ColorMode;
}

function ColorItem(props: ColorItemProps) {
  const { colorEntry, globalOptions, index, isOnlyColor } = props;
  const {
    activeColorId,
    baseSaturation,
    removeColor,
    setActiveColor,
    updateColor,
    updateGlobalOptions,
  } = useGenerator(
    'activeColorId',
    'baseSaturation',
    'removeColor',
    'setActiveColor',
    'updateColor',
    'updateGlobalOptions',
  );
  const { decrementCollapseAnimation, incrementCollapseAnimation, requestColorScroll } = useApp(
    'decrementCollapseAnimation',
    'incrementCollapseAnimation',
    'requestColorScroll',
  );
  const [{ mode }, setState] = useSetState<ColorItemState>({
    mode: 'oklch',
  });
  const { isOpen, onOpenChange } = useDisclosure();
  const isAnimatingRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(
    () => () => {
      if (isAnimatingRef.current) {
        isAnimatingRef.current = false;
        decrementCollapseAnimation();
      }
    },
    [decrementCollapseAnimation],
  );

  const handleCollapseStart = () => {
    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
      incrementCollapseAnimation();
    }
  };

  const handleCollapseComplete = () => {
    if (isAnimatingRef.current) {
      isAnimatingRef.current = false;
      decrementCollapseAnimation();
    }
  };

  const color = colorEntry.value;

  const handleChangeColor = useRafCallback((value: string) => {
    let branded;

    try {
      branded = toOklch(value);
    } catch (error_) {
      Sentry.captureException(error_, {
        tags: { source: 'ColorItem', call: 'handleChangeColor' },
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

  // Fires once per settled edit: onChangeEnd for the picker/sliders (their onChange
  // streams per-frame), and the validity-gated onChange for the text input. The random
  // button calls handleChangeColor directly, so it stays 'color:randomize' only.
  const trackColorEdit = (source: 'picker' | 'sliders' | 'input') =>
    trackEvent('color:edit', { source, mode });

  const handleInputChange = (value: string) => {
    trackColorEdit('input');
    handleChangeColor(value);
  };

  const handleCommitName = (value: string) => {
    updateColor(index, { name: value });
    trackEvent('color:rename', { name: value });
  };

  const handleClickMode = (value: ColorMode) => {
    if (value === mode) {
      return;
    }

    trackEvent('color:mode', { value });
    setState({ mode: value });
  };

  const handleClickRandom = () => {
    trackEvent('color:randomize');
    const randomColor = getRandomColor(baseSaturation);

    handleChangeColor(randomColor);
  };

  const handleCaptureInactive = (event: SyntheticEvent) => {
    if (isActive) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    setActiveColor(colorEntry.id);
  };

  const isActive = activeColorId === colorEntry.id;

  return (
    <div
      aria-current={isActive}
      className={cn('flex flex-col bg-default-50 p-4 rounded-xl', {
        'bg-default-100': isActive,
      })}
      data-testid="ColorItem"
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
          shouldCloseOnInteractOutside={element =>
            !element.closest('[data-color-picker-portal]') && !triggerRef.current?.contains(element)
          }
          showArrow
        >
          <PopoverTrigger>
            <ColorBox
              ref={triggerRef}
              aria-label="Color picker"
              color={color}
              onClick={() => trackEvent('color:picker')}
              size="lg"
            />
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <ColorPicker
              classNames={{ root: 'w-xs' }}
              color={color}
              defaultMode={mode}
              onChange={handleChangeColor}
              onChangeEnd={() => trackColorEdit('picker')}
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
            <EditableInput
              aria-label="Color name"
              classNames={{
                innerWrapper: 'pb-0',
                inputWrapper: ' h-6 min-h-6',
                input: 'text-base font-semibold text-foreground-800',
              }}
              disableAnimation
              name={`color-name-${index}`}
              onCommit={handleCommitName}
              size="sm"
              value={colorEntry.name}
              variant="underlined"
            />
            <ConfirmTooltip
              confirmMessage="Click again to remove"
              isDisabled={isOnlyColor || !isActive}
              message="Remove color"
              onConfirm={() => {
                trackEvent('color:remove');

                let nextActiveId: string | null = null;

                flushSync(() => {
                  nextActiveId = removeColor(index);
                });

                if (nextActiveId) requestColorScroll(nextActiveId);
              }}
            >
              <Button
                aria-label="Remove color"
                isDisabled={isOnlyColor || !isActive}
                isIconOnly
                size="xs"
                variant="light"
              >
                <TrashIcon className="text-base" />
              </Button>
            </ConfirmTooltip>
          </div>

          <ColorInput color={color} mode={mode} onChange={handleInputChange} />
        </div>
      </div>

      <Collapse
        duration={0.4}
        ease="circInOut"
        isOpen={isActive}
        onAnimationComplete={handleCollapseComplete}
        onAnimationStart={handleCollapseStart}
      >
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
            onChangeEnd={() => trackColorEdit('sliders')}
          />
          <ColorActions
            colorEntry={colorEntry}
            index={index}
            mode={mode}
            onClickMode={handleClickMode}
            onClickRandom={handleClickRandom}
          />
        </div>
      </Collapse>
    </div>
  );
}

export default memo(ColorItem);
