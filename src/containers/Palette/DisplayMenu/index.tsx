import { Popover, PopoverContent, PopoverTrigger, useDisclosure } from '@heroui/react';
import { MonitorIcon } from '@phosphor-icons/react';

import { trackEvent } from '~/utils/analytics';

import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';

import Gamut from './Gamut';
import View from './View';

export default function PaletteDisplayMenu() {
  const { isOpen, onClose, onOpen } = useDisclosure();

  const handleOpenChange = (open: boolean) => {
    if (open) {
      onOpen();
      trackEvent('app:display_menu');
    } else {
      onClose();
    }
  };

  return (
    <Popover
      backdrop="opaque"
      isNonModal={false}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      placement="bottom-start"
      showArrow
    >
      <Tooltip content="Display Options" placement="bottom">
        <div className="max-w-fit">
          <PopoverTrigger>
            <Button
              aria-label="Display Options"
              className="@max-4xl:button-menu-square"
              size="menu"
              startContent={<MonitorIcon className="text-xl" weight="bold" />}
              variant="light"
            >
              <span className="hidden @4xl:inline">Display</span>
            </Button>
          </PopoverTrigger>
        </div>
      </Tooltip>
      <PopoverContent className="p-4">
        <div className="w-64 text-md" data-testid="DisplayMenu">
          <View onChange={onClose} />
          <Gamut onChange={onClose} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
