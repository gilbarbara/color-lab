import { PaletteIcon } from '@phosphor-icons/react';

import Badge from '~/components/Badge';
import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';

interface OptionsToggleProps {
  hasCustomPaletteOptions: boolean;
  isVisible: boolean;
  onToggle: () => void;
}

export default function OptionsToggle(props: OptionsToggleProps) {
  const { hasCustomPaletteOptions, isVisible, onToggle } = props;

  return (
    <Tooltip content="Palette Options" placement="bottom">
      <Button
        aria-label="Palette Options"
        className="@max-2xl:button-menu-square"
        onPress={onToggle}
        size="menu"
        startContent={
          <Badge content="" isInvisible={!hasCustomPaletteOptions}>
            <PaletteIcon className="text-xl" weight="bold" />
          </Badge>
        }
        variant={isVisible ? 'solid' : 'light'}
      >
        <span className="hidden @2xl:inline-flex">Options</span>
      </Button>
    </Tooltip>
  );
}
