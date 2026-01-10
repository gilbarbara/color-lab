import { useMemo } from 'react';
import { Button, cn, Select, SelectItem, type SharedSelection, Slider } from '@heroui/react';
import { CaretUpIcon, EraserIcon, InfoIcon } from '@phosphor-icons/react';
import { getScaleStepKeys } from 'colorizr';

import usePalette from '~/hooks/usePalette';
import { useAppStore } from '~/stores/appStore';

import Collapse from '~/components/Collapse';
import ExportPalette from '~/components/ExportPalette';
import SliderLabel from '~/components/SliderLabel';
import SliderValue from '~/components/SliderValue';
import Switch from '~/components/Switch';
import Tooltip from '~/components/Tooltip';

import type { ScaleOptions } from '~/types';

export default function PaletteHeader() {
  const { defaultOptions, globalOptions, updateGlobalOptions } = usePalette();
  const { lock, mode, saturation, saturationOverride, steps, variant } = globalOptions;
  const { showPaletteOptionsPanel, togglePaletteOptionsPanel } = useAppStore();

  const handleChangeLock = ({ currentKey }: SharedSelection) => {
    if (!currentKey || currentKey === 'None') {
      updateGlobalOptions({ lock: undefined });

      return;
    }

    updateGlobalOptions({ lock: parseInt(currentKey, 10) });
  };

  const handleChangeSaturation = (value: number | number[]) => {
    if (!Array.isArray(value)) {
      updateGlobalOptions({ saturation: value });
    }
  };

  const handleToggleSaturationOverride = (value: boolean) => {
    updateGlobalOptions({ saturationOverride: value });
  };

  const handleChangeSteps = (value: number | number[]) => {
    if (!Array.isArray(value)) {
      updateGlobalOptions({ steps: value });
    }
  };

  const handleChangeVariant = ({ currentKey }: SharedSelection) => {
    if (!currentKey) {
      updateGlobalOptions({ variant: undefined });

      return;
    }

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
  };

  const handleToggleMode = (value: boolean) => {
    updateGlobalOptions({ mode: value ? 'dark' : 'light' });
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
    <div data-uid="PaletteHeader">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Color Palette</h2>
        <div className="flex items-center gap-2">
          <Button className="h-8 px-2 min-w-8" onPress={togglePaletteOptionsPanel} variant="light">
            <span>Options</span>
            <CaretUpIcon
              className={cn('transition-transform text-xs', {
                'rotate-180': showPaletteOptionsPanel,
              })}
            />
          </Button>
          <ExportPalette />
        </div>
      </div>

      <Collapse isOpen={showPaletteOptionsPanel}>
        <div className="border border-default p-4 rounded-xl">
          <div className="w-full flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <Select
              classNames={{
                trigger: cn({
                  'bg-white text-black data-[hover=true]:bg-default-600': !!variant,
                }),
                value: cn({
                  'group-data-[has-value=true]:text-black': !!variant,
                }),
              }}
              isDisabled={saturationOverride}
              label={
                <p className="flex items-center gap-2">
                  <span className="text-base">Variant</span>
                  <Tooltip
                    content={
                      <>
                        <p className="mb-1">Applies a preset style to the palette.</p>
                        <p>Each variant balances lightness and color intensity differently.</p>
                      </>
                    }
                    delay={250}
                  >
                    <InfoIcon className="text-lg" />
                  </Tooltip>
                </p>
              }
              labelPlacement="outside-left"
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

            <Select
              classNames={{
                trigger: cn({
                  'bg-white text-black data-[hover=true]:bg-default-600': !!lock,
                }),
                value: cn({
                  'group-data-[has-value=true]:text-black': !!lock,
                }),
              }}
              label={
                <p className="flex items-center gap-2">
                  <span className="text-base">Lock</span>
                  <Tooltip
                    content={
                      <>
                        <p className="mb-1">Pins the base color to a specific step.</p>
                        <p>Other shades are generated around it.</p>
                      </>
                    }
                    delay={250}
                  >
                    <InfoIcon className="text-base" />
                  </Tooltip>
                </p>
              }
              labelPlacement="outside-left"
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
          <div className="w-full flex flex-col md:flex-row items-start gap-4 md:gap-8 mt-4">
            <div className="w-full">
              <Slider
                aria-label="Steps"
                color="foreground"
                label="Steps"
                maxValue={20}
                minValue={3}
                name="steps"
                onChange={handleChangeSteps}
                renderLabel={renderProps => (
                  <SliderLabel
                    {...renderProps}
                    description={
                      <>
                        <p className="mb-1">Number of shades generated in the palette.</p>
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
                <Tooltip
                  content={
                    <>
                      <p className="mb-1">
                        Sets a uniform saturation level for all palette colors.
                      </p>
                      <p>Enable this to adjust saturation globally.</p>
                    </>
                  }
                  delay={250}
                >
                  <InfoIcon className="text-base shrink-0" />
                </Tooltip>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-start md:justify-between gap-4 mt-4 md:mt-2">
            <div className="flex items-center gap-2 shrink-0">
              <Switch isSelected={mode === 'dark'} name="mode" onValueChange={handleToggleMode}>
                {mode === 'light' ? 'Light scale' : 'Dark scale'}
              </Switch>
              <Tooltip
                content={
                  <>
                    <p className="mb-1">Toggles between light and dark color scales.</p>
                    <p>
                      Light scales are optimized for light themes, while dark scales work best on
                      dark backgrounds.
                    </p>
                  </>
                }
                delay={250}
              >
                <InfoIcon className="text-base shrink-0" />
              </Tooltip>
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
      </Collapse>
    </div>
  );
}
