import { cn } from '@heroui/react';
import { EraserIcon } from '@phosphor-icons/react';

import useRafCallback from '~/hooks/useRafCallback';
import useSliderInteraction from '~/hooks/useSliderInteraction';
import { getChromaFraction } from '~/utils/scale-options';

import Button from '~/components/Button';
import ChromaCurve from '~/components/ScaleColorOptions/ChromaCurve';
import HueShift from '~/components/ScaleColorOptions/HueShift';
import LightnessCurve from '~/components/ScaleColorOptions/LightnessCurve';
import LightnessRange from '~/components/ScaleColorOptions/LightnessRange';

import type { GlobalScaleOptions, OklchString } from '~/types';

interface ScaleColorOptionsProps {
  className?: string;
  defaultOptions: GlobalScaleOptions;
  /** Disables the Reset button when there is nothing to reset. */
  disableReset?: boolean;
  headingSize?: 'md' | 'lg';
  onReset: () => void;
  onUpdate: (updates: Partial<GlobalScaleOptions>) => void;
  options: GlobalScaleOptions;
  /** Color whose chroma fraction seeds the endpoints (Range) chroma mode. */
  seedColor: OklchString;
}

/**
 * Presentational orchestrator for the scale curve editors. Owns the interaction
 * wrapper + raf updater and passes a slice of the options to each setting component.
 * Prop-driven (no store access) so it serves both the global panel and the per-color
 * override popover.
 */
export default function ScaleColorOptions(props: ScaleColorOptionsProps) {
  const {
    className,
    defaultOptions,
    disableReset = false,
    headingSize = 'lg',
    onReset,
    onUpdate,
    options,
    seedColor,
  } = props;
  const { chromaCurve, hueShift, lightnessCurve, maxLightness, minLightness } = options;
  const { end, ref: interactionRef, start } = useSliderInteraction();
  const scheduleUpdate = useRafCallback(onUpdate);
  const seedFraction = getChromaFraction(seedColor);

  const shared = { end, headingSize, onUpdate, scheduleUpdate, start };

  return (
    <div
      ref={interactionRef}
      className={cn('w-full flex flex-col gap-3', className)}
      data-testid="ScaleColorOptions"
    >
      <div className="flex flex-col gap-6">
        <LightnessRange
          {...shared}
          defaultMaxLightness={defaultOptions.maxLightness}
          defaultMinLightness={defaultOptions.minLightness}
          maxLightness={maxLightness}
          minLightness={minLightness}
        />

        <LightnessCurve
          {...shared}
          defaultLightnessCurve={defaultOptions.lightnessCurve}
          lightnessCurve={lightnessCurve}
          maxLightness={maxLightness}
          minLightness={minLightness}
        />

        <ChromaCurve
          {...shared}
          chromaCurve={chromaCurve}
          defaultChromaCurve={defaultOptions.chromaCurve}
          lightnessCurve={lightnessCurve}
          maxLightness={maxLightness}
          minLightness={minLightness}
          seedFraction={seedFraction}
        />

        <HueShift {...shared} defaultHueShift={defaultOptions.hueShift} hueShift={hueShift} />
      </div>

      <div className="flex justify-end">
        <Button
          isDisabled={disableReset}
          onPress={onReset}
          size="menu"
          startContent={<EraserIcon className="text-lg" />}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
