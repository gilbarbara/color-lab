import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  type SharedSelection,
} from '@heroui/react';
import { ExclamationMarkIcon, MonitorIcon } from '@phosphor-icons/react';

import useApp from '~/hooks/useApp';
import { trackEvent } from '~/utils/analytics';

import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';

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

  // The dropdown always renders so P3 stays selectable even when the display gamut
  // can't be detected (e.g. Firefox always reports srgb via the color-gamut media
  // query). Warning states are CSS-driven off <html> attributes set pre-paint by the
  // gamutBootstrap script (app/layout.tsx) — both states are in the DOM so there's no
  // JS branch and no hydration mismatch:
  //   - [data-gamut='srgb'] (gamut-srgb): the *current* gamut is srgb.
  //   - [data-p3-supported='false'] (p3-unsupported): P3 couldn't be verified.
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          aria-label="Color gamut"
          className="gamut-srgb:text-warning p3-unsupported:text-warning @max-4xl:button-menu-square"
          size="menu"
          variant="light"
        >
          <Tooltip content="Color Gamut (P3 / SRGB)" placement="bottom">
            <span className="relative inline-flex items-center gap-2">
              <MonitorIcon className="text-xl" weight="bold" />
              <ExclamationMarkIcon
                className="hidden gamut-srgb:block p3-unsupported:block absolute text-[10px] top-1 left-1.25"
                weight="bold"
              />
              <span className="hidden @4xl:inline">Gamut</span>
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
        <DropdownItem
          key="p3"
          description={
            <>
              Wide gamut. Vivid colors.
              <span className="hidden p3-unsupported:block text-warning">
                We couldn&rsquo;t verify P3 support on your display.
              </span>
            </>
          }
        >
          P3
        </DropdownItem>
        <DropdownItem key="srgb" description="Standard gamut. Universal compatibility.">
          SRGB
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
