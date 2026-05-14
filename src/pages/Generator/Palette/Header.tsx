import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo } from 'react';
import { useBreakpoint, useSetState } from '@gilbarbara/hooks';
import {
  addToast,
  Button,
  cn,
  Input,
  Select,
  SelectItem,
  type SharedSelection,
  Slider,
} from '@heroui/react';
import { EraserIcon, HeartIcon, PaletteIcon, PencilSimpleLineIcon } from '@phosphor-icons/react';
import { getScaleStepKeys } from 'colorizr';

import { BREAKPOINTS } from '~/config/globals';
import useAuth from '~/hooks/useAuth';
import usePalette from '~/hooks/usePalette';
import useRafCallback from '~/hooks/useRafCallback';
import useSavedPalettes from '~/hooks/useSavedPalettes';
import useSliderInteraction from '~/hooks/useSliderInteraction';
import { useAppStore } from '~/stores/appStore';
import { trackEvent } from '~/utils/analytics';

import Collapse from '~/components/Collapse';
import ExportPalette from '~/components/ExportPalette';
import SavePaletteModal from '~/components/SavePaletteModal';
import SliderLabel from '~/components/SliderLabel';
import SliderValue from '~/components/SliderValue';
import Switch from '~/components/Switch';
import Tooltip from '~/components/Tooltip';
import TooltipClickable from '~/components/TooltipClickable';

import type { ScaleOptions } from '~/types';

interface PaletteHeaderState {
  isSaveModalOpen: boolean;
  isSaving: boolean;
  name: string;
}

export default function PaletteHeader() {
  const { isAuthenticated } = useAuth();
  const { defaultOptions, globalOptions, updateGlobalOptions } = usePalette();
  const { openLoginModal, showPaletteOptionsPanel, togglePaletteOptionsPanel } = useAppStore();
  const {
    hasUnsavedChanges,
    loadedPaletteId,
    loadedPaletteName,
    renamePalette,
    savePalette,
    updateCurrentPalette,
  } = useSavedPalettes();
  const { min } = useBreakpoint(BREAKPOINTS);
  const { end, ref: interactionRef, start } = useSliderInteraction();
  const scheduleUpdateGlobalOptions = useRafCallback(updateGlobalOptions);

  const [{ isSaveModalOpen, isSaving, name }, setState] = useSetState<PaletteHeaderState>({
    isSaveModalOpen: false,
    isSaving: false,
    name: loadedPaletteName,
  });

  const { lock, mode, saturation, saturationOverride, steps, variant } = globalOptions;

  // Sync local name state when loadedPaletteName changes (e.g., new palette or palette loaded)
  useEffect(() => {
    setState({ name: loadedPaletteName });
  }, [loadedPaletteName, setState]);

  const handleBlurName = () => {
    if (loadedPaletteName && loadedPaletteName !== name) {
      setState({
        name: loadedPaletteName,
      });
    }
  };

  const handleChangeLock = ({ currentKey }: SharedSelection) => {
    if (!currentKey || currentKey === 'None') {
      trackEvent('lock', { value: 'none' });
      updateGlobalOptions({ lock: undefined });

      return;
    }

    trackEvent('lock', { value: currentKey });
    updateGlobalOptions({ lock: parseInt(currentKey, 10) });
  };

  const handleChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    setState({ name: value });
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

  const handleClickSave = async () => {
    if (!isAuthenticated) {
      openLoginModal();

      return;
    }

    if (loadedPaletteId) {
      // Update existing palette
      setState({ isSaving: true });

      const success = await updateCurrentPalette();

      setState({ isSaving: false });

      if (success) {
        trackEvent('update-palette');
        addToast({ title: 'Palette updated', color: 'success' });
      }
    } else {
      // Open modal to save new palette
      setState({ isSaveModalOpen: true });
    }
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

  const handleKeyDownName = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (!isAuthenticated) {
        openLoginModal();

        return;
      }

      if (loadedPaletteId) {
        renamePalette(loadedPaletteId, name);

        return;
      }

      savePalette(name);
    }
  };

  const handleSaveNewPalette = async (value: string) => {
    setState({ isSaving: true });

    const palette = await savePalette(value);

    setState({ isSaving: false });

    if (palette) {
      trackEvent('save-palette');
      setState({ isSaveModalOpen: false, name: palette.name });
      addToast({ title: 'Palette saved', color: 'success' });
    }
  };

  const handleToggleMode = (value: boolean) => {
    trackEvent('scale-mode', { value: value ? 'dark' : 'light' });
    updateGlobalOptions({ mode: value ? 'dark' : 'light' });
  };

  const handleToggleSaturationOverride = (value: boolean) => {
    trackEvent('saturation-override', { enabled: value });
    updateGlobalOptions({ saturationOverride: value });
  };

  const isLarge = min('md');

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
    <div data-testid="PaletteHeader">
      <div className="flex items-center justify-between">
        <Input
          classNames={{
            base: 'opacity-100',
            innerWrapper: 'pb-0',
            input: 'text-2xl font-semibold text-foreground-800',
          }}
          color={loadedPaletteName !== name ? 'warning' : undefined}
          isDisabled={!isAuthenticated}
          name="palette-name"
          onBlur={handleBlurName}
          onChange={handleChangeName}
          onKeyDown={handleKeyDownName}
          size="sm"
          value={name}
          variant="underlined"
        />

        <div className="flex items-center gap-1 md:gap-2">
          <Tooltip content="Palette Options" delay={250} placement="bottom">
            <Button
              aria-label="Palette Options"
              className={cn('h-8 min-w-8 px-2', {
                'w-8': !isLarge,
              })}
              isIconOnly={!isLarge}
              onPress={togglePaletteOptionsPanel}
              startContent={<PaletteIcon className="text-xl" />}
              variant={showPaletteOptionsPanel ? 'solid' : 'light'}
            >
              {isLarge && 'Options'}
            </Button>
          </Tooltip>
          <ExportPalette />
          <Button
            className={cn('h-8 min-w-8 px-2', {
              'w-8': !isLarge,
            })}
            color={hasUnsavedChanges ? 'warning' : 'primary'}
            isDisabled={!!loadedPaletteId && !hasUnsavedChanges}
            isIconOnly={!isLarge}
            isLoading={isSaving}
            onPress={handleClickSave}
            startContent={
              loadedPaletteId ? (
                <PencilSimpleLineIcon className="text-xl" />
              ) : (
                <HeartIcon className="text-xl" />
              )
            }
            variant="faded"
          >
            {isLarge && (loadedPaletteId ? 'Update' : 'Save')}
          </Button>
        </div>
      </div>

      <Collapse isOpen={showPaletteOptionsPanel}>
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
                      <p className="mb-1">
                        Sets a uniform saturation level for all palette colors.
                      </p>
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
                      Light scales are optimized for light themes, while dark scales work best on
                      dark backgrounds.
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
      </Collapse>
      <SavePaletteModal
        isOpen={isSaveModalOpen}
        isSaving={isSaving}
        onClose={() => setState({ isSaveModalOpen: false })}
        onSave={handleSaveNewPalette}
      />
    </div>
  );
}
