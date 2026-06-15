import { Divider } from '@heroui/react';
import { SlidersHorizontalIcon } from '@phosphor-icons/react';

import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';

import Badge from '~/components/Badge';
import Button from '~/components/Button';
import CollapsePanel from '~/components/CollapsePanel';
import ScaleColorOptions from '~/components/ScaleColorOptions';

import type { DefaultScaleOptions, GlobalScaleOptions } from '~/types';

interface AdvancedOptionsProps {
  defaultOptions: DefaultScaleOptions;
  globalOptions: GlobalScaleOptions;
  updateGlobalOptions: (updates: Partial<GlobalScaleOptions>) => void;
}

export default function AdvancedOptions(props: AdvancedOptionsProps) {
  const { defaultOptions, globalOptions, updateGlobalOptions } = props;
  const { showColorOptionsPanel, toggleColorOptionsPanel } = useApp(
    'showColorOptionsPanel',
    'toggleColorOptionsPanel',
  );
  const { colors, hasCustomCurves, resetAdvancedOptions } = useGenerator(
    'colors',
    'hasCustomCurves',
    'resetAdvancedOptions',
  );

  const handleClickReset = () => {
    resetAdvancedOptions();
    trackEvent('reset-color-options');
  };

  return (
    <div>
      <div className="px-4 py-2 text-sm/3">
        <Button
          className="text-foreground-600"
          onPress={toggleColorOptionsPanel}
          size="menu"
          startContent={
            <Badge content="" isInvisible={!hasCustomCurves}>
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
            disableReset={!hasCustomCurves}
            onReset={handleClickReset}
            onUpdate={updateGlobalOptions}
            options={globalOptions}
            seedColor={colors[0].value}
          />
        </div>
      </CollapsePanel>

      <Divider />
    </div>
  );
}
