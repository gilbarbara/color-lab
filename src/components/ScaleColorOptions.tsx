import { type ReactNode } from 'react';
import { cn, Slider } from '@heroui/react';
import { EraserIcon } from '@phosphor-icons/react';

import useRafCallback from '~/hooks/useRafCallback';
import useSliderInteraction from '~/hooks/useSliderInteraction';
import { trackEvent } from '~/utils/analytics';

import Button from '~/components/Button';
import CurvePreview from '~/components/CurvePreview';
import SliderLabel from '~/components/SliderLabel';
import SliderValue from '~/components/SliderValue';

import type { GlobalScaleOptions } from '~/types';

interface ScaleColorOptionsProps {
  className?: string;
  defaultOptions: GlobalScaleOptions;
  description?: ReactNode;
  isChromatic?: boolean;
  onReset: () => void;
  onUpdate: (updates: Partial<GlobalScaleOptions>) => void;
  options: GlobalScaleOptions;
  title?: ReactNode;
  useLightTheme?: boolean;
}

export default function ScaleColorOptions(props: ScaleColorOptionsProps) {
  const {
    className,
    defaultOptions,
    description,
    isChromatic,
    onReset,
    onUpdate,
    options,
    title,
    useLightTheme,
  } = props;
  const { chromaCurve, lightnessCurve, maxLightness, minLightness } = options;
  const { end, ref: interactionRef, start } = useSliderInteraction();
  const scheduleUpdate = useRafCallback(onUpdate);

  const handleChangeChromaCurve = (value: number | number[]) => {
    start();

    if (!Array.isArray(value)) {
      scheduleUpdate({ chromaCurve: value });
    }
  };

  const handleChangeEndChromaCurve = (value: number | number[]) => {
    end();
    trackEvent('chroma-curve', { value: value as number });
  };

  const handleChangeLightnessCurve = (value: number | number[]) => {
    start();

    if (!Array.isArray(value)) {
      scheduleUpdate({ lightnessCurve: value });
    }
  };

  const handleChangeEndLightnessCurve = (value: number | number[]) => {
    end();

    trackEvent('lightness-curve', { value: value as number });
  };

  const handleChangeLightness = (value: number | number[]) => {
    start();

    if (!Array.isArray(value)) {
      return;
    }

    const [min, max] = value;

    if (min < max) {
      scheduleUpdate({ minLightness: min, maxLightness: max });
    }
  };

  const handleChangeEndLightness = (value: number | number[]) => {
    end();

    if (Array.isArray(value)) {
      trackEvent('lightness-range', { min: value[0], max: value[1] });
    }
  };

  return (
    <div
      ref={interactionRef}
      className={cn('w-full flex flex-col gap-3', className)}
      data-testid="ScaleColorOptions"
    >
      {title && <h3 className="font-semibold text-lg">{title}</h3>}
      {description && <div className="text-sm">{description}</div>}

      <Slider
        color="foreground"
        label="Lightness Range"
        maxValue={1}
        name="lightness"
        onChange={handleChangeLightness}
        onChangeEnd={handleChangeEndLightness}
        renderLabel={renderProps => (
          <SliderLabel
            {...renderProps}
            description={
              <>
                <p className="mb-1">Sets the lightest and darkest limits of the scale.</p>
                <p>Use this to avoid washed-out highlights or crushed shadows.</p>
              </>
            }
            disableReset={
              minLightness === defaultOptions.minLightness &&
              maxLightness === defaultOptions.maxLightness
            }
            isHeading
            onReset={() =>
              onUpdate({
                minLightness: defaultOptions.minLightness,
                maxLightness: defaultOptions.maxLightness,
              })
            }
          />
        )}
        renderValue={renderProps => (
          <SliderValue
            {...renderProps}
            defaultValues={[defaultOptions.minLightness, defaultOptions.maxLightness]}
          />
        )}
        size="sm"
        startContent={
          <CurvePreview compute={t => minLightness + (maxLightness - minLightness) * t} />
        }
        step={0.01}
        value={[minLightness, maxLightness]}
      />

      <Slider
        color="foreground"
        label="Lightness Curve"
        maxValue={5}
        minValue={0.1}
        name="lightnessCurve"
        onChange={handleChangeLightnessCurve}
        onChangeEnd={handleChangeEndLightnessCurve}
        renderLabel={renderProps => (
          <SliderLabel
            {...renderProps}
            description={
              <>
                <p className="mb-1">Controls how lightness is distributed across the scale.</p>
                <p>Shift detail toward highlights or toward darker tones.</p>
              </>
            }
            disableReset={lightnessCurve === defaultOptions.lightnessCurve}
            isHeading
            onReset={() =>
              onUpdate({
                lightnessCurve: defaultOptions.lightnessCurve,
              })
            }
          />
        )}
        renderValue={renderProps => (
          <SliderValue {...renderProps} defaultValues={[defaultOptions.lightnessCurve]} />
        )}
        size="sm"
        startContent={<CurvePreview compute={t => t ** lightnessCurve} />}
        step={0.1}
        value={lightnessCurve}
      />

      <Slider
        color="foreground"
        label="Chroma Curve"
        maxValue={1}
        name="chromaCurve"
        onChange={handleChangeChromaCurve}
        onChangeEnd={handleChangeEndChromaCurve}
        renderLabel={renderProps => (
          <SliderLabel
            {...renderProps}
            description={
              <>
                <p className="mb-2">
                  Controls how color intensity changes across light and dark shades.
                </p>
                <p className="mb-1">
                  At 0, chroma follows a perceptual curve, preserving the original color appearance.
                </p>
                <p>
                  Increasing this value pushes chroma in the extremes, creating more stylized
                  results.
                </p>
              </>
            }
            disableReset={chromaCurve === defaultOptions.chromaCurve}
            isHeading
            onReset={() =>
              onUpdate({
                chromaCurve: defaultOptions.chromaCurve,
              })
            }
          />
        )}
        renderValue={renderProps => (
          <SliderValue {...renderProps} defaultValues={[defaultOptions.chromaCurve]} />
        )}
        size="sm"
        startContent={<CurvePreview compute={t => 1 - chromaCurve * (1 - 4 * t * (1 - t))} />}
        step={0.1}
        value={chromaCurve}
      />

      <div>
        <Button
          className={cn({
            'bg-black/10 dark:bg-white/20': !isChromatic,
            'bg-black/10': isChromatic && useLightTheme,
            'bg-white/20': isChromatic && !useLightTheme,
          })}
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
