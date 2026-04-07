import { useBreakpoint, useMemoDeepCompare } from '@gilbarbara/hooks';
import { Button, cn, Popover, PopoverContent, PopoverTrigger, useDisclosure } from '@heroui/react';
import { ArrowsClockwiseIcon, SlidersHorizontalIcon, TrashIcon } from '@phosphor-icons/react';
import { readableColorAPCA } from 'colorizr';

import usePalette from '~/hooks/usePalette';
import { trackEvent } from '~/utils/analytics';

import ConfirmTooltip from '~/components/ConfirmTooltip';
import ScaleColorOptions from '~/components/ScaleColorOptions';
import Tooltip from '~/components/Tooltip';

import type { ColorEntry, GlobalScaleOptions } from '~/types';

interface ColorActionsProps {
  colorEntry: ColorEntry;
  index: number;
  isOnlyColor: boolean;
  onRandomColor: () => void;
}

export default function ColorActions(props: ColorActionsProps) {
  const { colorEntry, index, isOnlyColor, onRandomColor } = props;
  const { clearColorOverrides, globalOptions, removeColor, updateColor } = usePalette();
  const { isOpen, onOpenChange } = useDisclosure();
  const { max, min } = useBreakpoint();

  const color = colorEntry.value;

  const useLightTheme = useMemoDeepCompare(() => {
    return readableColorAPCA(color) !== '#ffffff';
  }, [color, globalOptions, colorEntry.overrides]);

  const handleClickOptions = () => {
    trackEvent('open-color-options-overrides');
  };

  const handleResetOptions = () => {
    clearColorOverrides(index);
    trackEvent('reset-color-options-overrides');
  };

  const handleUpdateOptions = (updates: Partial<GlobalScaleOptions>) => {
    updateColor(index, { overrides: { ...colorEntry.overrides, ...updates } });
  };

  return (
    <>
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
      <div className="flex items-center justify-end gap-1">
        <Button
          aria-label="Random color"
          className="rounded-s-none border-l-0"
          isIconOnly
          onPress={onRandomColor}
          size="sm"
          variant="light"
        >
          <ArrowsClockwiseIcon className="text-base" />
        </Button>
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
                  <SlidersHorizontalIcon className="text-base" />
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
            removeColor(index);
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
    </>
  );
}
