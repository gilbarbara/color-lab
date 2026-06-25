import { useMemo } from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  type Selection,
} from '@heroui/react';
import { CaretDownIcon, EraserIcon, IntersectThreeIcon } from '@phosphor-icons/react';

import { DESIGN_SYSTEM_PRESETS } from '~/config/presets';
import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';
import { CURVE_OPTION_KEYS } from '~/utils/generator';
import { isSameOptionValue } from '~/utils/scale-options';

import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';

type PresetKey = keyof typeof DESIGN_SYSTEM_PRESETS;

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
  const activeKey = useMemo(
    () =>
      (Object.keys(DESIGN_SYSTEM_PRESETS) as PresetKey[]).find(name =>
        CURVE_OPTION_KEYS.every(key =>
          isSameOptionValue(key, globalOptions[key], DESIGN_SYSTEM_PRESETS[name][key]),
        ),
      ) ?? null,
    [globalOptions],
  );

  const handleAction = (key: string | number) => {
    const preset = DESIGN_SYSTEM_PRESETS[key as PresetKey];

    if (!preset) {
      return;
    }

    updateGlobalOptions(preset);
    trackEvent('color-preset', { value: key });
  };

  const handleReset = () => {
    resetAdvancedOptions();
    trackEvent('reset-color-options');
  };

  const selectedKeys: Selection = activeKey ? new Set([activeKey]) : new Set();

  return (
    <div className="flex items-center gap-2" data-testid="ColorPresets">
      <Dropdown>
        <DropdownTrigger>
          <Button
            endContent={<CaretDownIcon />}
            size="menu"
            startContent={<IntersectThreeIcon className="text-lg" />}
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
