import { objectEntries } from '@gilbarbara/helpers';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  type SharedSelection,
} from '@heroui/react';
import { CaretDownIcon, PlusIcon } from '@phosphor-icons/react';

import { COLOR_SPACING } from '~/config/globals';
import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';
import { getRandomColor, rotateOklchHue } from '~/utils/color';
import { MAX_COLORS } from '~/utils/generator';

import Button from '~/components/Button';

import type { ColorSpacing } from '~/types';

export default function PanelAddColor() {
  const { colorSpacing, requestColorScroll, setColorSpacing } = useApp(
    'colorSpacing',
    'requestColorScroll',
    'setColorSpacing',
  );
  const { addColor, baseSaturation, colors } = useGenerator('addColor', 'baseSaturation', 'colors');

  const handleSelectionChange = (keys: SharedSelection) => {
    if (keys === 'all') return;

    const next = (keys.currentKey ?? 'tight') as ColorSpacing;

    setColorSpacing(next);
    trackEvent('palette:color_spacing', { value: next });
  };

  const handleClickAddColor = () => {
    const lastColor = colors.at(-1);
    const nextColor = lastColor
      ? rotateOklchHue(lastColor.value, COLOR_SPACING[colorSpacing].angle)
      : getRandomColor(baseSaturation);

    const newId = addColor(nextColor);

    trackEvent('color:add');

    if (newId) requestColorScroll(newId);
  };

  const isDisabled = colors.length >= MAX_COLORS;

  return (
    <div className="p-4">
      <Button
        color="primary"
        fullWidth
        isDisabled={isDisabled}
        onPress={handleClickAddColor}
        startContent={<PlusIcon />}
      >
        Add Color
      </Button>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-foreground-600" id="color-spacing-label">
          Color Spacing
        </span>
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button
              aria-labelledby="color-spacing-label color-spacing-value"
              className="text-foreground-600"
              endContent={<CaretDownIcon />}
              id="color-spacing-value"
              isDisabled={isDisabled}
              size="xs"
              variant="flat"
            >
              {COLOR_SPACING[colorSpacing].label} - {COLOR_SPACING[colorSpacing].angle}°
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Color spacing options"
            className="max-w-[288px]"
            disallowEmptySelection
            onSelectionChange={handleSelectionChange}
            selectedKeys={new Set([colorSpacing])}
            selectionMode="single"
          >
            {objectEntries(COLOR_SPACING).map(([key, value]) => (
              <DropdownItem key={key} description={value.description}>
                {value.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
}
