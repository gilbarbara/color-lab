import { useMemo } from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  type Selection,
} from '@heroui/react';
import { CaretDownIcon, EraserIcon, PaintBrushIcon } from '@phosphor-icons/react';

import { DESIGN_SYSTEM_PRESETS, type PresetKey } from '~/config/presets';
import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';
import { getActivePreset } from '~/utils/generator';

import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';

const presetLabels: Record<PresetKey, string> = {
  tailwind: 'Tailwind',
  material: 'Material',
  bootstrap: 'Bootstrap',
  opencolor: 'Open Color',
};

export default function ColorPresets() {
  const { globalOptions, resetAdvancedOptions, updateGlobalOptions } = useGenerator(
    'globalOptions',
    'resetAdvancedOptions',
    'updateGlobalOptions',
  );

  // The active preset is derived, not stored: the URL/options stay the single
  // source of truth, so editing any curve key drops the match automatically.
  const activeKey = useMemo(() => getActivePreset(globalOptions), [globalOptions]);

  const handleAction = (key: string | number) => {
    const preset = DESIGN_SYSTEM_PRESETS[key as PresetKey];

    if (!preset) {
      return;
    }

    updateGlobalOptions(preset);
    trackEvent('preset:apply', { value: key });
  };

  const handleReset = () => {
    resetAdvancedOptions();
    trackEvent('preset:reset');
  };

  const selectedKeys: Selection = activeKey ? new Set([activeKey]) : new Set();

  return (
    <div className="flex items-center gap-2" data-testid="ColorPresets">
      <Dropdown>
        <DropdownTrigger>
          <Button
            endContent={<CaretDownIcon />}
            size="menu"
            startContent={<PaintBrushIcon className="text-lg" />}
            variant={activeKey ? 'solid' : 'flat'}
          >
            {activeKey ? presetLabels[activeKey] : 'Apply a preset'}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Color presets"
          onAction={handleAction}
          selectedKeys={selectedKeys}
          selectionMode="single"
          variant="flat"
        >
          {(Object.keys(DESIGN_SYSTEM_PRESETS) as PresetKey[]).map(key => (
            <DropdownItem key={key}>{presetLabels[key]}</DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
      {activeKey && (
        <Tooltip content="Reset preset">
          <Button
            aria-label="Reset preset"
            isIconOnly
            onPress={handleReset}
            size="menu"
            variant="flat"
          >
            <EraserIcon className="text-lg" />
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
