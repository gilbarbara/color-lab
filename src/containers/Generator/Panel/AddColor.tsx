import { objectEntries } from '@gilbarbara/helpers';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  type SharedSelection,
} from '@heroui/react';
import { CaretDownIcon, PlusIcon } from '@phosphor-icons/react';

import { COLOR_SPACING, MAX_COLORS } from '~/config/globals';
import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import { useGeneratorStoreApi } from '~/hooks/useGeneratorStore';
import { trackEvent } from '~/utils/analytics';
import { generateOklchColor, getRandomColor } from '~/utils/color';

import Button from '~/components/Button';

import type { ColorSpacing } from '~/types';

export default function PanelAddColor() {
  const { colorSpacing, requestColorScroll, resetGroupFilter, setColorSpacing } = useApp(
    'colorSpacing',
    'requestColorScroll',
    'resetGroupFilter',
    'setColorSpacing',
  );
  // Only the count is rendered. The colors themselves are needed solely when the button is
  // pressed, so they are read from the store at click time — selecting them (or `baseSaturation`,
  // which derives from `colors[0].value`) would re-render this on every edit of the first color.
  const { addColor, colorCount } = useGenerator('addColor', 'colorCount');
  const storeApi = useGeneratorStoreApi();

  const handleSelectionChange = (keys: SharedSelection) => {
    if (keys === 'all') return;

    const next = (keys.currentKey ?? 'tight') as ColorSpacing;

    setColorSpacing(next);
    trackEvent('palette:color_spacing', { value: next });
  };

  const handleClickAddColor = () => {
    // No last color means an empty palette, where `baseSaturation` was `undefined` anyway.
    const lastColor = storeApi.getState().colors.at(-1);
    const nextColor = lastColor
      ? generateOklchColor(lastColor.value, COLOR_SPACING[colorSpacing].angle)
      : getRandomColor();

    const newId = addColor(nextColor);

    trackEvent('color:add');

    // A new color is ungrouped, so an active filter would hide it from the palette view.
    resetGroupFilter();

    if (newId) requestColorScroll(newId);
  };

  const isDisabled = colorCount >= MAX_COLORS;

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
