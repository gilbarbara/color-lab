import { memo } from 'react';
import { Divider } from '@heroui/react';
import { SlidersHorizontalIcon } from '@phosphor-icons/react';

import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';

import Badge from '~/components/Badge';
import Button from '~/components/Button';
import CollapsePanel from '~/components/CollapsePanel';
import ScaleColorOptions from '~/components/ScaleColorOptions';

function AdvancedOptions() {
  const { showColorOptionsPanel, toggleColorOptionsPanel } = useApp(
    'showColorOptionsPanel',
    'toggleColorOptionsPanel',
  );
  const {
    defaultOptions,
    globalOptions,
    hasCustomCurves,
    resetAdvancedOptions,
    seedColor,
    updateGlobalOptions,
  } = useGenerator(
    'defaultOptions',
    'globalOptions',
    'hasCustomCurves',
    'resetAdvancedOptions',
    'seedColor',
    'updateGlobalOptions',
  );

  const handleClickReset = () => {
    resetAdvancedOptions();
    trackEvent('options:reset_advanced');
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
            seedColor={seedColor}
          />
        </div>
      </CollapsePanel>

      <Divider />
    </div>
  );
}

export default memo(AdvancedOptions);
