import { useId } from 'react';
import { round } from '@gilbarbara/helpers';
import { Slider, Tab, Tabs } from '@heroui/react';

import { LIGHTNESS_CURVE_MAX, LIGHTNESS_CURVE_MIN, LIGHTNESS_CURVE_STEP } from '~/config/scale';
import { trackEvent } from '~/utils/analytics';
import {
  getLightnessCurveMode,
  isSameOptionValue,
  lightnessAt,
  normalizeLightnessCurve,
} from '~/utils/scale-options';

import SliderLabel from '~/components/SliderLabel';
import SliderValue from '~/components/SliderValue';

import type { GlobalScaleOptions } from '~/types';

import CurveHeading from './CurveHeading';
import CurvePreview from './CurvePreview';
import type { ScaleColorSharedProps } from './types';

interface LightnessCurveProps extends ScaleColorSharedProps {
  defaultLightnessCurve: GlobalScaleOptions['lightnessCurve'];
  lightnessCurve: GlobalScaleOptions['lightnessCurve'];
  maxLightness: number;
  minLightness: number;
}

export default function LightnessCurve(props: LightnessCurveProps) {
  const {
    defaultLightnessCurve,
    end,
    headingSize = 'lg',
    lightnessCurve,
    maxLightness,
    minLightness,
    onUpdate,
    scheduleUpdate,
    source,
    start,
  } = props;

  const headingId = useId();
  const mode = getLightnessCurveMode(lightnessCurve);
  const range = normalizeLightnessCurve(lightnessCurve);
  // Normalize so each slider compares against the default's matching endpoint even when
  // the default is a range (per-color panel).
  const defaultRange = normalizeLightnessCurve(defaultLightnessCurve);

  const preview = (t: number) => 1 - lightnessAt(t, range, minLightness, maxLightness);

  const handleModeChange = (key: string) => {
    if (key === mode) {
      return;
    }

    if (key === 'range') {
      const seed = range.low;

      onUpdate({ lightnessCurve: { low: seed, high: seed } });
    } else {
      const seed =
        typeof lightnessCurve === 'number'
          ? lightnessCurve
          : round((range.low + range.high) / 2, 1);

      onUpdate({ lightnessCurve: seed });
    }

    trackEvent(`${source}:lightness_curve_mode`, { mode: key });
  };

  const handleChange = (value: number | number[]) => {
    start();

    if (!Array.isArray(value)) {
      scheduleUpdate({ lightnessCurve: value });
    }
  };

  const handleChangeHalf = (half: 'low' | 'high') => (value: number | number[]) => {
    start();

    if (!Array.isArray(value)) {
      scheduleUpdate({ lightnessCurve: { ...range, [half]: value } });
    }
  };

  const handleChangeEnd = (value: number | number[]) => {
    end();
    trackEvent(`${source}:lightness_curve`, { value: value as number });
  };

  return (
    <div aria-labelledby={headingId} className="flex flex-col gap-2" role="group">
      <div className="flex items-center justify-between gap-2">
        <CurveHeading
          description={
            <div>
              <p className="mb-1">Controls how lightness is distributed across the scale.</p>
              <p className="mb-1">
                <b>Simple</b> applies one easing curve (Amount) to the whole scale.
              </p>
              <p>
                <b>Split</b> sets the easing at each end (Low/High), interpolated across the scale.
              </p>
            </div>
          }
          disableReset={isSameOptionValue('lightnessCurve', lightnessCurve, defaultLightnessCurve)}
          id={headingId}
          onReset={() => {
            onUpdate({ lightnessCurve: defaultLightnessCurve });
            trackEvent(`${source}:lightness_curve_reset`);
          }}
          size={headingSize}
        >
          Lightness Curve
        </CurveHeading>
        <Tabs
          aria-label="Lightness curve mode"
          classNames={{
            cursor: 'bg-default',
            tab: 'h-5',
            tabList: 'p-0 overflow-visible',
          }}
          onSelectionChange={key => handleModeChange(String(key))}
          radius="full"
          selectedKey={mode}
          size="sm"
        >
          <Tab key="scalar" title="Simple" />
          <Tab key="range" title="Split" />
        </Tabs>
      </div>

      {mode === 'scalar' ? (
        <Slider
          aria-label="Lightness Curve"
          color="foreground"
          label="Amount"
          maxValue={LIGHTNESS_CURVE_MAX}
          minValue={LIGHTNESS_CURVE_MIN}
          name="lightnessCurve"
          onChange={handleChange}
          onChangeEnd={handleChangeEnd}
          renderLabel={renderProps => <SliderLabel {...renderProps} />}
          renderValue={renderProps => (
            <SliderValue {...renderProps} defaultValues={[defaultRange.low]} />
          )}
          size="sm"
          startContent={<CurvePreview compute={preview} />}
          step={LIGHTNESS_CURVE_STEP}
          value={range.low}
        />
      ) : (
        <div className="flex items-center gap-3">
          <Slider
            color="foreground"
            label="Low"
            maxValue={LIGHTNESS_CURVE_MAX}
            minValue={LIGHTNESS_CURVE_MIN}
            name="lightnessCurveLow"
            onChange={handleChangeHalf('low')}
            onChangeEnd={handleChangeEnd}
            renderLabel={renderProps => <SliderLabel {...renderProps} />}
            renderValue={renderProps => (
              <SliderValue {...renderProps} defaultValues={[defaultRange.low]} />
            )}
            size="sm"
            step={LIGHTNESS_CURVE_STEP}
            value={range.low}
          />
          <Slider
            color="foreground"
            label="High"
            maxValue={LIGHTNESS_CURVE_MAX}
            minValue={LIGHTNESS_CURVE_MIN}
            name="lightnessCurveHigh"
            onChange={handleChangeHalf('high')}
            onChangeEnd={handleChangeEnd}
            renderLabel={renderProps => <SliderLabel {...renderProps} />}
            renderValue={renderProps => (
              <SliderValue {...renderProps} defaultValues={[defaultRange.high]} />
            )}
            size="sm"
            step={LIGHTNESS_CURVE_STEP}
            value={range.high}
          />
        </div>
      )}
    </div>
  );
}
