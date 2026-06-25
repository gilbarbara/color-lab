import { useId } from 'react';
import { Slider, Tab, Tabs } from '@heroui/react';

import { HUE_SHIFT_LIMIT, HUE_SHIFT_STEP } from '~/config/scale';
import { trackEvent } from '~/utils/analytics';
import { getHueShiftMode, isSameOptionValue, normalizeHueShift } from '~/utils/scale-options';

import SliderLabel from '~/components/SliderLabel';
import SliderValue from '~/components/SliderValue';

import type { GlobalScaleOptions } from '~/types';

import CurveHeading from './CurveHeading';
import type { ScaleColorSharedProps } from './types';

interface HueShiftProps extends ScaleColorSharedProps {
  defaultHueShift: GlobalScaleOptions['hueShift'];
  hueShift: GlobalScaleOptions['hueShift'];
}

export default function HueShift(props: HueShiftProps) {
  const {
    defaultHueShift,
    end,
    headingSize = 'lg',
    hueShift,
    onUpdate,
    scheduleUpdate,
    start,
  } = props;

  const headingId = useId();
  const mode = getHueShiftMode(hueShift);
  const range = normalizeHueShift(hueShift);
  const defaultRange = normalizeHueShift(defaultHueShift);

  const handleModeChange = (key: string) => {
    if (key === mode) {
      return;
    }

    // Simple→Split keeps the symmetric pair; Split→Simple collapses to the high end.
    onUpdate({ hueShift: key === 'range' ? { low: range.low, high: range.high } : range.high });
    trackEvent('hue-shift-mode', { mode: key });
  };

  const handleChangeScalar = (value: number | number[]) => {
    start();

    if (!Array.isArray(value)) {
      scheduleUpdate({ hueShift: value });
    }
  };

  const handleChangeHalf = (half: 'low' | 'high') => (value: number | number[]) => {
    start();

    if (!Array.isArray(value)) {
      scheduleUpdate({ hueShift: { ...range, [half]: value } });
    }
  };

  const handleChangeEnd = (value: number | number[]) => {
    end();
    trackEvent('hue-shift', { value: value as number });
  };

  return (
    <div aria-labelledby={headingId} className="flex flex-col gap-2" role="group">
      <div className="flex items-center justify-between gap-2">
        <CurveHeading
          description={
            <div>
              <p className="mb-1">
                Rotates hue toward the ends of the scale; the anchor step keeps the input hue.
              </p>
              <p className="mb-1">
                <b>Simple</b> shifts the two ends by equal and opposite amounts (Amount).
              </p>
              <p>
                <b>Split</b> shifts each end (Low/High) independently.
              </p>
            </div>
          }
          disableReset={isSameOptionValue('hueShift', hueShift, defaultHueShift)}
          id={headingId}
          onReset={() => onUpdate({ hueShift: defaultHueShift })}
          size={headingSize}
        >
          Hue Shift
        </CurveHeading>
        <Tabs
          aria-label="Hue shift mode"
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
          aria-label="Hue Shift"
          color="foreground"
          fillOffset={0}
          label="Amount"
          maxValue={HUE_SHIFT_LIMIT}
          minValue={-HUE_SHIFT_LIMIT}
          name="hueShift"
          onChange={handleChangeScalar}
          onChangeEnd={handleChangeEnd}
          renderLabel={renderProps => <SliderLabel {...renderProps} />}
          renderValue={renderProps => (
            <SliderValue {...renderProps} defaultValues={[defaultRange.high]} />
          )}
          size="sm"
          step={HUE_SHIFT_STEP}
          value={range.high}
        />
      ) : (
        <div className="flex items-center gap-3">
          <Slider
            color="foreground"
            fillOffset={0}
            label="Low"
            maxValue={HUE_SHIFT_LIMIT}
            minValue={-HUE_SHIFT_LIMIT}
            name="hueShiftLow"
            onChange={handleChangeHalf('low')}
            onChangeEnd={handleChangeEnd}
            renderLabel={renderProps => <SliderLabel {...renderProps} />}
            renderValue={renderProps => (
              <SliderValue {...renderProps} defaultValues={[defaultRange.low]} />
            )}
            size="sm"
            step={HUE_SHIFT_STEP}
            value={range.low}
          />
          <Slider
            color="foreground"
            fillOffset={0}
            label="High"
            maxValue={HUE_SHIFT_LIMIT}
            minValue={-HUE_SHIFT_LIMIT}
            name="hueShiftHigh"
            onChange={handleChangeHalf('high')}
            onChangeEnd={handleChangeEnd}
            renderLabel={renderProps => <SliderLabel {...renderProps} />}
            renderValue={renderProps => (
              <SliderValue {...renderProps} defaultValues={[defaultRange.high]} />
            )}
            size="sm"
            step={HUE_SHIFT_STEP}
            value={range.high}
          />
        </div>
      )}
    </div>
  );
}
