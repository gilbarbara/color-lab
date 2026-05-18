import { useMemo } from 'react';
import { cn, Select, SelectItem, type SharedSelection, Slider } from '@heroui/react';
import { EraserIcon } from '@phosphor-icons/react';
import { getScaleStepKeys } from 'colorizr';

import usePalette from '~/hooks/usePalette';
import useRafCallback from '~/hooks/useRafCallback';
import useSliderInteraction from '~/hooks/useSliderInteraction';
import { trackEvent } from '~/utils/analytics';

import Button from '~/components/Button';
import SliderLabel from '~/components/SliderLabel';
import SliderValue from '~/components/SliderValue';
import Switch from '~/components/Switch';
import TooltipClickable from '~/components/TooltipClickable';

import type { ScaleOptions } from '~/types';

export default function PaletteOptions() {
  const { defaultOptions, globalOptions, updateGlobalOptions } = usePalette();
  const { end, ref: interactionRef, start } = useSliderInteraction();
  const scheduleUpdateGlobalOptions = useRafCallback(updateGlobalOptions);

  const { lock, mode, saturation, saturationOverride, steps, variant } = globalOptions;

  const handleChangeLock = ({ currentKey }: SharedSelection) => {
    if (!currentKey || currentKey === 'None') {
      trackEvent('lock', { value: 'none' });
      updateGlobalOptions({ lock: undefined });

      return;
    }

    trackEvent('lock', { value: currentKey });
    updateGlobalOptions({ lock: parseInt(currentKey, 10) });
  };

  const handleChangeSaturation = (value: number | number[]) => {
    start();

    if (!Array.isArray(value)) {
      scheduleUpdateGlobalOptions({ saturation: value });
    }
  };

  const handleChangeSteps = (value: number | number[]) => {
    start();

    if (!Array.isArray(value)) {
      scheduleUpdateGlobalOptions({ steps: value });
    }
  };

  const handleChangeVariant = ({ currentKey }: SharedSelection) => {
    if (!currentKey) {
      trackEvent('variant', { value: 'none' });
      updateGlobalOptions({ variant: undefined });

      return;
    }

    trackEvent('variant', { value: currentKey });
    updateGlobalOptions({ variant: currentKey as ScaleOptions['variant'] });
  };

  const handleClickReset = () => {
    updateGlobalOptions({
      lock: defaultOptions.lock,
      mode: defaultOptions.mode,
      saturation: defaultOptions.saturation,
      saturationOverride: defaultOptions.saturationOverride,
      steps: defaultOptions.steps,
      variant: defaultOptions.variant,
    });

    trackEvent('reset-palette-options');
  };

  const handleToggleMode = (value: boolean) => {
    trackEvent('scale-mode', { value: value ? 'dark' : 'light' });
    updateGlobalOptions({ mode: value ? 'dark' : 'light' });
  };

  const handleToggleSaturationOverride = (value: boolean) => {
    trackEvent('saturation-override', { enabled: value });
    updateGlobalOptions({ saturationOverride: value });
  };

  const variants = useMemo(
    () => [
      { label: 'None', key: '' },
      { label: 'Deep', key: 'deep' },
      { label: 'Neutral', key: 'neutral' },
      { label: 'Subtle', key: 'subtle' },
      { label: 'Vibrant', key: 'vibrant' },
    ],
    [],
  );

  const locks = useMemo(() => ['None', ...getScaleStepKeys(steps).map(d => `${d}`)], [steps]);

  return (
    <div className="border border-default p-4 mt-4 rounded-xl">
      <div className="w-full flex flex-col md:flex-row items-center gap-4 md:gap-8">
        <div className="w-full flex items-center gap-2">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="text-base shrink-0" htmlFor="variant-select">
            Variant
          </label>
          <TooltipClickable
            aria-label="Variant options"
            classNames={{
              base: '-ml-2',
            }}
            content={
              <>
                <p className="mb-1">Applies a preset style to the palette.</p>
                <p>Each variant balances lightness and color intensity differently.</p>
              </>
            }
          />

          <Select
            classNames={{
              trigger: cn({
                'bg-default-200 data-[hover=true]:bg-default-400': !!variant,
              }),
            }}
            id="variant-select"
            isDisabled={saturationOverride}
            name="variant"
            onSelectionChange={handleChangeVariant}
            placeholder="Select variant"
            selectedKeys={variants.filter(({ key }) => key === variant).map(d => d.key)}
            size="sm"
          >
            {variants.map(({ key, label }) => (
              <SelectItem key={key}>{label}</SelectItem>
            ))}
          </Select>
        </div>
        <div className="w-full flex items-center gap-2">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="text-base shrink-0" htmlFor="lock-select">
            Lock
          </label>
          <TooltipClickable
            aria-label="Lock options"
            classNames={{
              base: '-ml-2',
            }}
            content={
              <>
                <p className="mb-1">Pins the base color to a specific step.</p>
                <p>Other shades are generated around it.</p>
              </>
            }
          />
          <Select
            classNames={{
              trigger: cn({
                'bg-default-200 data-[hover=true]:bg-default-400': !!lock,
              }),
            }}
            id="lock-select"
            name="lock"
            onSelectionChange={handleChangeLock}
            placeholder="Select lock"
            selectedKeys={lock ? [lock.toString()] : []}
            size="sm"
          >
            {locks.map(v => (
              <SelectItem key={v}>{v}</SelectItem>
            ))}
          </Select>
        </div>
      </div>
      <div
        ref={interactionRef}
        className="w-full flex flex-col md:flex-row items-start gap-4 md:gap-8 mt-4"
      >
        <div className="w-full">
          <Slider
            aria-label="Steps"
            color="foreground"
            label="Steps"
            maxValue={20}
            minValue={3}
            name="steps"
            onChange={handleChangeSteps}
            onChangeEnd={value => {
              end();
              trackEvent('steps', { value: value as number });
            }}
            renderLabel={renderProps => (
              <SliderLabel
                {...renderProps}
                description={
                  <>
                    <p className="mb-1">Number of swatches generated in the palette.</p>
                    <p>More steps add nuance; fewer steps keep it compact.</p>
                  </>
                }
                disableReset={steps === defaultOptions.steps}
                onReset={() => updateGlobalOptions({ steps: defaultOptions.steps })}
              />
            )}
            renderValue={renderProps => (
              <SliderValue {...renderProps} defaultValues={[defaultOptions.steps]} />
            )}
            size="sm"
            step={1}
            value={steps}
          />
        </div>

        <div className="w-full">
          <Slider
            aria-label="Saturation"
            color="foreground"
            isDisabled={!saturationOverride}
            label="Saturation"
            maxValue={100}
            name="saturation"
            onChange={handleChangeSaturation}
            onChangeEnd={value => {
              end();
              trackEvent('saturation', { value: value as number });
            }}
            renderLabel={renderProps => (
              <SliderLabel
                {...renderProps}
                disableReset={!saturationOverride || saturation === defaultOptions.saturation}
                isDisabled={!saturationOverride}
                onReset={() =>
                  updateGlobalOptions({
                    saturation: defaultOptions.saturation,
                  })
                }
              />
            )}
            renderValue={renderProps => (
              <SliderValue {...renderProps} defaultValues={[defaultOptions.saturation]} />
            )}
            size="sm"
            step={0.1}
            value={saturation}
          />
          <div className="flex items-center gap-2 mt-1">
            <Switch
              isSelected={saturationOverride}
              name="saturationOverride"
              onValueChange={handleToggleSaturationOverride}
              size="xs"
            >
              <span>Apply saturation to all colors</span>
            </Switch>
            <TooltipClickable
              aria-label="Saturation override options"
              classNames={{
                base: '-mr-2',
              }}
              content={
                <>
                  <p className="mb-1">Sets a uniform saturation level for all palette colors.</p>
                  <p>Enable this to adjust saturation globally.</p>
                </>
              }
              placement="bottom-end"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-start md:justify-between gap-4 mt-4 md:mt-2">
        <div className="flex items-center gap-2 shrink-0">
          <Switch isSelected={mode === 'dark'} name="mode" onValueChange={handleToggleMode}>
            {mode === 'light' ? 'Light scale' : 'Dark scale'}
          </Switch>
          <TooltipClickable
            aria-label="Dark scale"
            content={
              <>
                <p className="mb-1">Toggles between light and dark color scales.</p>
                <p>
                  Light scales are optimized for light themes, while dark scales work best on dark
                  backgrounds.
                </p>
              </>
            }
            placement="bottom"
          />
        </div>
        <div>
          <Button
            onPress={handleClickReset}
            size="sm"
            startContent={<EraserIcon className="text-base" />}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
