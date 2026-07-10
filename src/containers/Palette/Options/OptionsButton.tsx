import { PaletteIcon } from '@phosphor-icons/react';

import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';

import Badge from '~/components/Badge';
import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';

export default function OptionsButton() {
  const { hasCustomPaletteOptions } = useGenerator('hasCustomPaletteOptions');
  const { showPaletteOptionsPanel, togglePaletteOptionsPanel } = useApp(
    'showPaletteOptionsPanel',
    'togglePaletteOptionsPanel',
  );

  return (
    <Tooltip content="Palette Options" placement="bottom">
      <Button
        aria-label="Palette Options"
        className="@max-lg:button-menu-square"
        onPress={togglePaletteOptionsPanel}
        size="menu"
        startContent={
          <Badge content="" isInvisible={!hasCustomPaletteOptions}>
            <PaletteIcon className="text-xl" weight="bold" />
          </Badge>
        }
        variant={showPaletteOptionsPanel ? 'solid' : 'light'}
      >
        <span className="hidden @lg:inline-flex">Options</span>
      </Button>
    </Tooltip>
  );
}
