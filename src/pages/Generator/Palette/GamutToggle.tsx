import { useMemo } from 'react';
import { useBreakpoint } from '@gilbarbara/hooks';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  type SharedSelection,
} from '@heroui/react';
import { ExclamationMarkIcon, MonitorIcon, WarningIcon } from '@phosphor-icons/react';

import { BREAKPOINTS } from '~/config/globals';
import { useAppStore } from '~/stores/appStore';
import { trackEvent } from '~/utils/analytics';
import { isP3Supported } from '~/utils/gamut';

import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';
import TooltipClickable from '~/components/TooltipClickable';

import type { Gamut } from '~/types';

export default function PaletteGamutToggle() {
  const { gamut, setGamut } = useAppStore();

  const p3Supported = useMemo(() => isP3Supported(), []);

  const { min } = useBreakpoint(BREAKPOINTS);

  const isLarge = min('xl');

  const handleSelectionChange = (keys: SharedSelection) => {
    if (keys === 'all') return;

    const next = (keys.values().next().value ?? 'p3') as Gamut;

    if (next === gamut) return;

    setGamut(next);
    trackEvent('gamut', { value: next });
  };

  if (!p3Supported) {
    return (
      <TooltipClickable content="Your display only supports the SRGB gamut" placement="bottom">
        <span className="inline-flex items-center gap-2 text-warning">
          <WarningIcon weight="bold" />
          {isLarge && 'SRGB gamut'}
        </span>
      </TooltipClickable>
    );
  }

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          aria-label="Color gamut"
          color={gamut === 'srgb' ? 'warning' : 'default'}
          isIconOnly={!isLarge}
          size="menu"
          variant="light"
        >
          <Tooltip content="Color Gamut (P3 / SRGB)" placement="bottom">
            <span className="relative inline-flex items-center gap-2">
              <MonitorIcon className="text-xl" weight="bold" />
              {gamut === 'srgb' && (
                <ExclamationMarkIcon
                  className="absolute text-[10px] top-1 left-1.25"
                  weight="bold"
                />
              )}
              {isLarge && 'Gamut'}
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
  );
}
