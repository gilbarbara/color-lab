import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  type SharedSelection,
} from '@heroui/react';
import { ExclamationMarkIcon, MonitorIcon, WarningIcon } from '@phosphor-icons/react';

import useApp from '~/hooks/useApp';
import { trackEvent } from '~/utils/analytics';

import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';
import TooltipClickable from '~/components/TooltipClickable';

import type { Gamut } from '~/types';

export default function PaletteGamutToggle() {
  const { gamut, setGamut } = useApp('gamut', 'setGamut');

  const handleSelectionChange = (keys: SharedSelection) => {
    if (keys === 'all') return;

    const next = (keys.values().next().value ?? 'p3') as Gamut;

    if (next === gamut) return;

    setGamut(next);
    trackEvent('gamut', { value: next });
  };

  // Both branches are mounted; CSS picks one based on [data-p3-supported] on <html>
  // (set pre-paint by the gamutBootstrap script in app/layout.tsx). Server has no
  // attr → dropdown shows by default. Warning state inside the dropdown (text-warning
  // + exclamation icon) is driven by [data-gamut='srgb'] via the gamut-srgb variant.
  return (
    <>
      <div className="hidden p3-unsupported:block">
        <TooltipClickable
          className="whitespace-nowrap"
          content="Your display only supports the SRGB gamut"
          placement="bottom"
        >
          <span className="inline-flex items-center gap-2 text-warning">
            <WarningIcon weight="bold" />
            <span className="hidden xl:inline">SRGB gamut</span>
          </span>
        </TooltipClickable>
      </div>

      <div className="p3-unsupported:hidden">
        <Dropdown>
          <DropdownTrigger>
            <Button
              aria-label="Color gamut"
              className="gamut-srgb:text-warning max-xl:button-menu-square"
              size="menu"
              variant="light"
            >
              <Tooltip content="Color Gamut (P3 / SRGB)" placement="bottom">
                <span className="relative inline-flex items-center gap-2">
                  <MonitorIcon className="text-xl" weight="bold" />
                  <ExclamationMarkIcon
                    className="hidden gamut-srgb:block absolute text-[10px] top-1 left-1.25"
                    weight="bold"
                  />
                  <span className="hidden xl:inline">Gamut</span>
                </span>
              </Tooltip>
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Color gamut options"
            onSelectionChange={handleSelectionChange}
            selectedKeys={new Set([gamut])}
            selectionMode="single"
            variant="flat"
          >
            <DropdownItem key="p3" description="Wide gamut. Vivid colors.">
              P3
            </DropdownItem>
            <DropdownItem key="srgb" description="Standard gamut. Universal compatibility.">
              SRGB
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  );
}
