import { useToggle } from '@gilbarbara/hooks';
import {
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from '@heroui/react';
import { ArrowsClockwiseIcon, CaretDownIcon, SlidersHorizontalIcon } from '@phosphor-icons/react';
import { type ColorMode } from '@transience/color-picker';

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
  mode: ColorMode;
  onClickMode: (value: ColorMode) => void;
  onClickRandom: () => void;
}

export default function ColorActions(props: ColorActionsProps) {
  const { colorEntry, mode, onClickMode, onClickRandom } = props;
  const { clearColorOverrides, globalOptions, setColorOverride } = useGenerator(
    'clearColorOverrides',
    'globalOptions',
    'setColorOverride',
  );
  const { toggleBottomBar } = useApp('toggleBottomBar');
  const [showColorOptions, { toggle }] = useToggle(false);

  const handleClickOptions = () => {
    toggle();
    trackEvent('color:options');
  };

  const handleResetOptions = () => {
    clearColorOverrides(colorEntry.id);
    trackEvent('color:reset');
  };

  const handleUpdateOptions = (updates: Partial<GlobalScaleOptions>) => {
    setColorOverride(colorEntry.id, updates);
  };

  const handleAction = (key: string | number) => {
    onClickMode(key as ColorMode);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Tooltip content="Color options">
            <Button
              aria-expanded={showColorOptions}
              aria-label={`Change color options for ${colorEntry.name}`}
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
          <PreviewButton
            colorEntry={colorEntry}
            onPreview={() => toggleBottomBar(false)}
            placement="bottom-start"
            source="color"
            variant="light"
          />
          <Tooltip content="Random color" placement="bottom">
            <Button
              aria-label={`Random color for ${colorEntry.name}`}
              isIconOnly
              onPress={onClickRandom}
              size="sm"
              variant="light"
            >
              <ArrowsClockwiseIcon className="text-base" />
            </Button>
          </Tooltip>
        </div>
        <Dropdown>
          <Tooltip content="Color mode" placement="bottom">
            <div className="max-w-fit">
              <DropdownTrigger>
                <Button
                  aria-label={`Color mode for ${colorEntry.name}: ${mode.toUpperCase()}`}
                  endContent={<CaretDownIcon />}
                  size="menu"
                  variant="flat"
                >
                  {mode.toUpperCase()}
                </Button>
              </DropdownTrigger>
            </div>
          </Tooltip>
          <DropdownMenu
            aria-label="Color modes"
            onAction={handleAction}
            selectedKeys={[mode]}
            selectionMode="single"
            variant="flat"
          >
            <DropdownSection classNames={{ base: 'mb-0' }} title="COLOR MODE">
              <DropdownItem key="oklch">OKLCH</DropdownItem>
              <DropdownItem key="hsl">HSL</DropdownItem>
              <DropdownItem key="rgb">RGB</DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
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
          source="color"
        />
      </Collapse>
    </div>
  );
}
