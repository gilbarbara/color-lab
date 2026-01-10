import { cn, Divider } from '@heroui/react';
import { CaretUpIcon } from '@phosphor-icons/react';

import { useAppStore } from '~/stores/appStore';

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
  };

  return (
    <div>
      <div className="p-4 text-sm/3">
        <button
          className="inline-flex items-center text-foreground-600 transition-colors duration-200 hover:text-foreground gap-2"
          onClick={toggleColorOptionsPanel}
          type="button"
        >
          <span>Advanced Options</span>
          <CaretUpIcon
            className={cn('transition-transform text-xs', {
              'rotate-180': showColorOptionsPanel,
            })}
          />
        </button>
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
