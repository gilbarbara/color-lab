import { Slider } from '@heroui/react';

import { LIGHTNESS_RANGE_MAX, LIGHTNESS_RANGE_STEP } from '~/config/scale';
import { trackEvent } from '~/utils/analytics';

import SliderLabel from '~/components/SliderLabel';
import SliderValue from '~/components/SliderValue';

import CurvePreview from './CurvePreview';
import type { ScaleColorSharedProps } from './types';

interface LightnessRangeProps extends ScaleColorSharedProps {
  defaultMaxLightness: number;
  defaultMinLightness: number;
  maxLightness: number;
  minLightness: number;
}

export default function LightnessRange(props: LightnessRangeProps) {
  const {
    defaultMaxLightness,
    defaultMinLightness,
    end,
    headingSize = 'lg',
    maxLightness,
    minLightness,
    onUpdate,
    scheduleUpdate,
    source,
    start,
  } = props;

  const handleChange = (value: number | number[]) => {
    start();

    if (!Array.isArray(value)) {
      return;
    }

    const [min, max] = value;

    if (min < max) {
      scheduleUpdate({ minLightness: min, maxLightness: max });
    }
  };

  const handleChangeEnd = (value: number | number[]) => {
    end();

    if (Array.isArray(value)) {
      trackEvent(`${source}:lightness_range`, { min: value[0], max: value[1] });
    }
  };

  return (
    <Slider
      color="foreground"
      label="Lightness Range"
      maxValue={LIGHTNESS_RANGE_MAX}
      name="lightness"
      onChange={handleChange}
      onChangeEnd={handleChangeEnd}
      renderLabel={renderProps => (
        <SliderLabel
          {...renderProps}
          description={
            <div>
              <p className="mb-1">Sets the lightest and darkest limits of the scale.</p>
              <p>Use this to avoid washed-out highlights or crushed shadows.</p>
            </div>
          }
          disableReset={
            minLightness === defaultMinLightness && maxLightness === defaultMaxLightness
          }
          onReset={() => {
            onUpdate({ minLightness: defaultMinLightness, maxLightness: defaultMaxLightness });
            trackEvent(`${source}:lightness_range_reset`);
          }}
          size={headingSize}
        />
      )}
      renderValue={renderProps => (
        <SliderValue {...renderProps} defaultValues={[defaultMinLightness, defaultMaxLightness]} />
      )}
      size="sm"
      startContent={
        <CurvePreview compute={t => minLightness + (maxLightness - minLightness) * t} />
      }
      step={LIGHTNESS_RANGE_STEP}
      value={[minLightness, maxLightness]}
    />
  );
}
