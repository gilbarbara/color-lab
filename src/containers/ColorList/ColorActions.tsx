import { useToggle } from '@gilbarbara/hooks';
import { Divider } from '@heroui/react';
import { ArrowsClockwiseIcon, SlidersHorizontalIcon } from '@phosphor-icons/react';
import { type ColorMode, ModeSelector } from '@transience/color-picker';

import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';

import Badge from '~/components/Badge';
import Button from '~/components/Button';
import Collapse from '~/components/Collapse';
import ScaleColorOptions from '~/components/ScaleColorOptions';
import Tooltip from '~/components/Tooltip';
import PreviewButton from '~/containers/Preview/Button';

import type { ColorEntry, GlobalScaleOptions } from '~/types';

interface ColorActionsProps {
  colorEntry: ColorEntry;
  index: number;
  mode: ColorMode;
  onClickMode: (value: ColorMode) => void;
  onClickRandom: () => void;
}

export default function ColorActions(props: ColorActionsProps) {
  const { colorEntry, index, mode, onClickMode, onClickRandom } = props;
  const { clearColorOverrides, globalOptions, setColorOverride } = useGenerator(
    'clearColorOverrides',
    'globalOptions',
    'setColorOverride',
  );
  const { toggleBottomBar } = useApp('toggleBottomBar');
  const [showColorOptions, { toggle }] = useToggle(false);

  const handleClickOptions = () => {
    toggle();
    trackEvent('open-color-options-overrides');
  };

  const handleResetOptions = () => {
    clearColorOverrides(index);
    trackEvent('reset-color-options-overrides');
  };

  const handleUpdateOptions = (updates: Partial<GlobalScaleOptions>) => {
    setColorOverride(index, updates);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <ModeSelector mode={mode} onClick={onClickMode} />

        <div className="flex items-center gap-1">
          <PreviewButton
            id={colorEntry.id}
            onPreview={() => toggleBottomBar(false)}
            variant="light"
          />
          <Tooltip content="Random Color" delay={250} placement="bottom-end">
            <Button
              aria-label="Random color"
              isIconOnly
              onPress={onClickRandom}
              size="sm"
              variant="light"
            >
              <ArrowsClockwiseIcon className="text-base" />
            </Button>
          </Tooltip>
          <Tooltip content="Color options" delay={250} placement="bottom-end">
            <Button
              aria-label="Change color options"
              isIconOnly
              onPress={handleClickOptions}
              size="sm"
              variant={showColorOptions ? 'solid' : 'light'}
            >
              <Badge content="" isInvisible={!colorEntry.overrides}>
                <SlidersHorizontalIcon className="text-base" />
              </Badge>
            </Button>
          </Tooltip>
        </div>
      </div>
      <Collapse isOpen={showColorOptions}>
        <Divider className="my-4" />
        <ScaleColorOptions
          defaultOptions={globalOptions}
          disableReset={!colorEntry.overrides}
          headingSize="md"
          onReset={handleResetOptions}
          onUpdate={handleUpdateOptions}
          options={{ ...globalOptions, ...colorEntry.overrides }}
          seedColor={colorEntry.value}
          showLock
        />
      </Collapse>
    </div>
  );
}
