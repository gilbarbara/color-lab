import { useBreakpoint, useMemoDeepCompare } from '@gilbarbara/hooks';
import { cn, Popover, PopoverContent, PopoverTrigger, useDisclosure } from '@heroui/react';
import { ArrowsClockwiseIcon, SlidersHorizontalIcon } from '@phosphor-icons/react';
import { type ColorMode, ModeSelector } from '@transience/color-picker';
import { readableColor } from 'colorizr';

import { BREAKPOINTS } from '~/config/globals';
import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';

import Badge from '~/components/Badge';
import Button from '~/components/Button';
import ScaleColorOptions from '~/components/ScaleColorOptions';
import Tooltip from '~/components/Tooltip';
import PreviewButton from '~/containers/Preview/Button';

import type { ColorEntry, GlobalScaleOptions } from '~/types';

interface ColorActionsProps {
  colorEntry: ColorEntry;
  index: number;
  mode: ColorMode;
  onClickMode: (value: ColorMode) => void;
  onClickRandom: () => void;
}

export default function ColorActions(props: ColorActionsProps) {
  const { colorEntry, index, mode, onClickMode, onClickRandom } = props;
  const { clearColorOverrides, globalOptions, setColorOverride } = useGenerator(
    'clearColorOverrides',
    'globalOptions',
    'setColorOverride',
  );
  const { toggleBottomBar } = useApp('toggleBottomBar');
  const { isOpen, onOpenChange } = useDisclosure();
  const { min } = useBreakpoint(BREAKPOINTS);

  const color = colorEntry.value;

  const useLightTheme = useMemoDeepCompare(() => {
    return readableColor(color, 'apca') !== '#ffffff';
  }, [color, globalOptions, colorEntry.overrides]);

  const handleClickOptions = () => {
    trackEvent('open-color-options-overrides');
  };

  const handleResetOptions = () => {
    clearColorOverrides(index);
    trackEvent('reset-color-options-overrides');
  };

  const handleUpdateOptions = (updates: Partial<GlobalScaleOptions>) => {
    setColorOverride(index, updates);
  };

  return (
    <>
      <style>
        {`
      .popover-content-${index} { background-color: ${color}; }
      .popover-base-${index} {
        &:before {
          background-color: ${color};
        }
       }
      `}
      </style>
      <div className="flex items-center justify-between">
        <ModeSelector mode={mode} onClick={onClickMode} />

        <div className="flex items-center gap-1">
          <PreviewButton
            id={colorEntry.id}
            onPreview={() => toggleBottomBar(false)}
            variant="light"
          />
          <Button
            aria-label="Random color"
            isIconOnly
            onPress={onClickRandom}
            size="sm"
            variant="light"
          >
            <ArrowsClockwiseIcon className="text-base" />
          </Button>
          <Popover
            classNames={{
              base: cn(`popover-base-${index} lg:before:top-2.5!`, {
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
                    <Badge content="" isInvisible={!colorEntry.overrides}>
                      <SlidersHorizontalIcon className="text-base" />
                    </Badge>
                  </span>
                </Tooltip>
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <ScaleColorOptions
                defaultOptions={globalOptions}
                isChromatic
                onReset={handleResetOptions}
                onUpdate={handleUpdateOptions}
                options={{ ...globalOptions, ...colorEntry.overrides }}
                title={`Options for ${colorEntry.name}`}
                useLightTheme={useLightTheme}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  );
}
