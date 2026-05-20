import { cn, Divider } from '@heroui/react';
import { CaretUpIcon, SlidersHorizontalIcon } from '@phosphor-icons/react';

import { useAppStore } from '~/stores/appStore';
import { trackEvent } from '~/utils/analytics';

import Button from '~/components/Button';
import Collapse from '~/components/Collapse';
import ScaleColorOptions from '~/components/ScaleColorOptions';

import type { GlobalScaleOptions } from '~/types';

interface ColorOptionsProps {
  defaultOptions: GlobalScaleOptions;
  globalOptions: GlobalScaleOptions;
  updateGlobalOptions: (updates: Partial<GlobalScaleOptions>) => void;
}

export default function ColorOptions(props: ColorOptionsProps) {
  const { defaultOptions, globalOptions, updateGlobalOptions } = props;
  const { showColorOptionsPanel, toggleColorOptionsPanel } = useAppStore();

  const handleClickReset = () => {
    updateGlobalOptions({
      minLightness: defaultOptions.minLightness,
      maxLightness: defaultOptions.maxLightness,
      lightnessCurve: defaultOptions.lightnessCurve,
      chromaCurve: defaultOptions.chromaCurve,
    });

    trackEvent('reset-color-options');
  };

  return (
    <div>
      <div className="px-4 py-2 text-sm/3">
        <Button
          className="text-foreground-600"
          endContent={
            <CaretUpIcon
              className={cn('transition-transform text-xs', {
                'rotate-180': showColorOptionsPanel,
              })}
            />
          }
          onClick={toggleColorOptionsPanel}
          size="menu"
          startContent={<SlidersHorizontalIcon className="text-lg" />}
          variant="light"
        >
          Advanced Options
        </Button>
      </div>
      <Collapse isOpen={showColorOptionsPanel}>
        <div className="p-4">
          <ScaleColorOptions
            defaultOptions={defaultOptions}
            onReset={handleClickReset}
            onUpdate={updateGlobalOptions}
            options={globalOptions}
          />
        </div>
      </Collapse>

      <Divider />
    </div>
  );
}
