import { useId } from 'react';
import { Slider, Tab, Tabs } from '@heroui/react';

import {
  CHROMA_CURVE_MAX,
  CHROMA_CURVE_STEP,
  CHROMA_PEAK_DEFAULT,
  CHROMA_PEAK_MAX,
  CHROMA_PEAK_MIN,
  CHROMA_PEAK_STEP,
} from '~/config/scale';
import { trackEvent } from '~/utils/analytics';
import {
  getChromaCurveMode,
  isSameOptionValue,
  lightnessAt,
  normalizeChromaCurve,
  normalizeLightnessCurve,
  parabolicScale,
} from '~/utils/scale-options';

import SliderLabel from '~/components/SliderLabel';
import SliderValue from '~/components/SliderValue';

import type { GlobalScaleOptions } from '~/types';

import CurveHeading from './CurveHeading';
import CurvePreview from './CurvePreview';
import type { ScaleColorSharedProps } from './types';

interface ChromaCurveProps extends ScaleColorSharedProps {
  chromaCurve: GlobalScaleOptions['chromaCurve'];
  defaultChromaCurve: GlobalScaleOptions['chromaCurve'];
  lightnessCurve: GlobalScaleOptions['lightnessCurve'];
  maxLightness: number;
  minLightness: number;
  /** seedColor's chroma as a 0→1 gamut fraction — the Split mode's seed. */
  seedFraction: number;
}

export default function ChromaCurve(props: ChromaCurveProps) {
  const {
    chromaCurve,
    defaultChromaCurve,
    end,
    headingSize = 'lg',
    lightnessCurve,
    maxLightness,
    minLightness,
    onUpdate,
    scheduleUpdate,
    seedFraction,
    start,
  } = props;

  const headingId = useId();
  const mode = getChromaCurveMode(chromaCurve);
  const norm = normalizeChromaCurve(chromaCurve);
  const lightnessRange = normalizeLightnessCurve(lightnessCurve);
  const normalizedDefault = normalizeChromaCurve(defaultChromaCurve);
  const defaultScalar = normalizedDefault.type === 'parabola' ? normalizedDefault.amount : 0;
  // Split sliders compare against the default's own endpoints when it's already a range;
  // otherwise the modes carry different units, so fall back to the seed (gamut fraction).
  const rangeDefaults =
    normalizedDefault.type === 'range'
      ? normalizedDefault
      : { low: seedFraction, high: seedFraction };

  const preview = (t: number) => {
    if (norm.type === 'range') {
      return 1;
    }

    return parabolicScale(
      lightnessAt(t, lightnessRange, minLightness, maxLightness),
      norm.amount,
      norm.peak,
    );
  };

  const handleModeChange = (key: string) => {
    if (key === mode) {
      return;
    }

    // Unlike hue/lightness, the two chroma modes carry different units — Simple is
    // a parabola multiplier of base chroma, Split is a fraction of the gamut ceiling —
    // so the current value can't carry across. Reseed each from a sensible anchor:
    // Simple → the palette default, Split → the input color's own gamut fraction.
    onUpdate({
      chromaCurve: key === 'scalar' ? defaultScalar : { low: seedFraction, high: seedFraction },
    });

    trackEvent('chroma-curve-mode', { mode: key });
  };

  // Keep emitting the scalar form whenever the peak is centered, so the parabola
  // family round-trips through the URL as a plain number (no snapshot churn).
  const handleChangeAmount = (value: number | number[]) => {
    start();

    if (!Array.isArray(value) && norm.type === 'parabola') {
      scheduleUpdate({
        chromaCurve: norm.peak === CHROMA_PEAK_DEFAULT ? value : { amount: value, peak: norm.peak },
      });
    }
  };

  const handleChangePeak = (value: number | number[]) => {
    start();

    if (!Array.isArray(value) && norm.type === 'parabola') {
      scheduleUpdate({
        chromaCurve:
          value === CHROMA_PEAK_DEFAULT ? norm.amount : { amount: norm.amount, peak: value },
      });
    }
  };

  const handleChangeRange = (half: 'low' | 'high') => (value: number | number[]) => {
    start();

    if (!Array.isArray(value) && norm.type === 'range') {
      scheduleUpdate({ chromaCurve: { low: norm.low, high: norm.high, [half]: value } });
    }
  };

  const handleChangeEnd = (value: number | number[]) => {
    end();
    trackEvent('chroma-curve', { value: value as number });
  };

  return (
    <div aria-labelledby={headingId} className="flex flex-col gap-2" role="group">
      <div className="flex items-center justify-between gap-2">
        <CurveHeading
          description={
            <>
              <p className="mb-2">
                Controls how color intensity changes across light and dark shades.
              </p>
              <p className="mb-1">Peak bends chroma around a movable lightness.</p>
              <p>Split sets chroma as a fraction of the gamut ceiling at each end.</p>
            </>
          }
          disableReset={isSameOptionValue(chromaCurve, defaultChromaCurve)}
          id={headingId}
          onReset={() => onUpdate({ chromaCurve: defaultChromaCurve })}
          size={headingSize}
        >
          Chroma Curve
        </CurveHeading>
        <Tabs
          aria-label="Chroma curve mode"
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

      {mode === 'scalar' && norm.type === 'parabola' && (
        <div className="flex items-center gap-3">
          <Slider
            aria-label="Chroma Curve"
            color="foreground"
            label="Amount"
            maxValue={CHROMA_CURVE_MAX}
            name="chromaAmount"
            onChange={handleChangeAmount}
            onChangeEnd={handleChangeEnd}
            renderLabel={renderProps => <SliderLabel {...renderProps} />}
            renderValue={renderProps => (
              <SliderValue {...renderProps} defaultValues={[defaultScalar]} />
            )}
            size="sm"
            startContent={<CurvePreview compute={preview} />}
            step={CHROMA_CURVE_STEP}
            value={norm.amount}
          />
          <Slider
            color="foreground"
            isDisabled={norm.amount === 0}
            label="Peak"
            maxValue={CHROMA_PEAK_MAX}
            minValue={CHROMA_PEAK_MIN}
            name="chromaPeak"
            onChange={handleChangePeak}
            onChangeEnd={handleChangeEnd}
            renderLabel={renderProps => <SliderLabel {...renderProps} />}
            renderValue={renderProps => (
              <SliderValue {...renderProps} defaultValues={[CHROMA_PEAK_DEFAULT]} />
            )}
            size="sm"
            step={CHROMA_PEAK_STEP}
            value={norm.peak}
          />
        </div>
      )}

      {mode === 'range' && norm.type === 'range' && (
        <div className="flex items-center gap-3">
          <Slider
            color="foreground"
            label="Low"
            maxValue={CHROMA_CURVE_MAX}
            name="chromaLow"
            onChange={handleChangeRange('low')}
            onChangeEnd={handleChangeEnd}
            renderLabel={renderProps => <SliderLabel {...renderProps} />}
            renderValue={renderProps => (
              <SliderValue {...renderProps} defaultValues={[rangeDefaults.low]} />
            )}
            size="sm"
            step={CHROMA_CURVE_STEP}
            value={norm.low}
          />
          <Slider
            color="foreground"
            label="High"
            maxValue={CHROMA_CURVE_MAX}
            name="chromaHigh"
            onChange={handleChangeRange('high')}
            onChangeEnd={handleChangeEnd}
            renderLabel={renderProps => <SliderLabel {...renderProps} />}
            renderValue={renderProps => (
              <SliderValue {...renderProps} defaultValues={[rangeDefaults.high]} />
            )}
            size="sm"
            step={CHROMA_CURVE_STEP}
            value={norm.high}
          />
        </div>
      )}
    </div>
  );
}
