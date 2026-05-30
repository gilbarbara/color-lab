import { Badge, Divider } from '@heroui/react';
import { SlidersHorizontalIcon } from '@phosphor-icons/react';

import useApp from '~/hooks/useApp';
import usePalette from '~/hooks/usePalette';
import { trackEvent } from '~/utils/analytics';
import { CURVE_OPTION_KEYS } from '~/utils/palette';

import Button from '~/components/Button';
import CollapsePanel from '~/components/CollapsePanel';
import ScaleColorOptions from '~/components/ScaleColorOptions';

import type { GlobalScaleOptions } from '~/types';

interface ColorOptionsProps {
  defaultOptions: GlobalScaleOptions;
  globalOptions: GlobalScaleOptions;
  updateGlobalOptions: (updates: Partial<GlobalScaleOptions>) => void;
}

export default function ColorOptions(props: ColorOptionsProps) {
  const { defaultOptions, globalOptions, updateGlobalOptions } = props;
  const { showColorOptionsPanel, toggleColorOptionsPanel } = useApp(
    'showColorOptionsPanel',
    'toggleColorOptionsPanel',
  );
  const { hasCustomCurves } = usePalette('hasCustomCurves');

  const handleClickReset = () => {
    updateGlobalOptions(
      Object.fromEntries(CURVE_OPTION_KEYS.map(key => [key, defaultOptions[key]])),
    );

    trackEvent('reset-color-options');
  };

  return (
    <div>
      <div className="px-4 py-2 text-sm/3">
        <Button
          className="text-foreground-600"
          onClick={toggleColorOptionsPanel}
          size="menu"
          startContent={
            <Badge color="warning" content="" isDot isInvisible={!hasCustomCurves} size="sm">
              <SlidersHorizontalIcon className="text-lg" />
            </Badge>
          }
          variant={showColorOptionsPanel ? 'solid' : 'light'}
        >
          Advanced Options
        </Button>
      </div>
      <CollapsePanel
        data-testid="ColorOptions"
        isOpen={showColorOptionsPanel}
        openClassName="color-options-open:grid-rows-[1fr] color-options-open:opacity-100"
      >
        <div className="p-4">
          <ScaleColorOptions
            defaultOptions={defaultOptions}
            onReset={handleClickReset}
            onUpdate={updateGlobalOptions}
            options={globalOptions}
          />
        </div>
      </CollapsePanel>

      <Divider />
    </div>
  );
}
