import { type ReactNode, useCallback } from 'react';
import { Button, cn, Slider } from '@heroui/react';
import { EraserIcon } from '@phosphor-icons/react';

import type { GlobalScaleOptions } from '~/types';

import SliderLabel from './SliderLabel';
import SliderValue from './SliderValue';

interface ScaleColorOptionsProps {
  className?: string;
  defaultOptions: GlobalScaleOptions;
  description?: ReactNode;
  onReset: () => void;
  onUpdate: (updates: Partial<GlobalScaleOptions>) => void;
  options: GlobalScaleOptions;
  title?: ReactNode;
}

export default function ScaleColorOptions(props: ScaleColorOptionsProps) {
  const { className, defaultOptions, description, onReset, onUpdate, options, title } = props;
  const { chromaCurve, lightnessCurve, maxLightness, minLightness } = options;

  const handleChangeChromaCurve = (value: number | number[]) => {
    if (!Array.isArray(value)) {
      onUpdate({ chromaCurve: value });
    }
  };

  const handleChangeLightnessFactor = (value: number | number[]) => {
    if (!Array.isArray(value)) {
      onUpdate({ lightnessCurve: value });
    }
  };

  const handleChangeLightness = useCallback(
    (value: number | number[]) => {
      if (!Array.isArray(value)) {
        return;
      }

      const [min, max] = value;

      if (min < max) {
        onUpdate({ minLightness: min, maxLightness: max });
      }
    },
    [onUpdate],
  );

  return (
    <div className={cn('w-full flex flex-col gap-3', className)} data-uid="ScaleColorOptions">
      {title && <h3 className="font-semibold text-lg">{title}</h3>}
      {description && <div className="text-sm">{description}</div>}

      <Slider
        aria-label="Lightness Range"
        color="foreground"
        label="Lightness Range"
        maxValue={1}
        name="lightness"
        onChange={handleChangeLightness}
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
        step={0.01}
        value={[minLightness, maxLightness]}
      />

      <Slider
        aria-label="Lightness Curve"
        color="foreground"
        label="Lightness Curve"
        maxValue={5}
        name="lightnessCurve"
        onChange={handleChangeLightnessFactor}
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
        step={0.1}
        value={lightnessCurve}
      />

      <Slider
        aria-label="Chroma Curve"
        color="foreground"
        label="Chroma Curve"
        maxValue={1}
        name="chromaCurve"
        onChange={handleChangeChromaCurve}
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
        step={0.1}
        value={chromaCurve}
      />

      <div>
        <Button onPress={onReset} size="sm" startContent={<EraserIcon className="text-base" />}>
          Reset
        </Button>
      </div>
    </div>
  );
}
