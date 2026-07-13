import { memo } from 'react';
import { objectEntries } from '@gilbarbara/helpers';
import {
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from '@heroui/react';
import { TagIcon } from '@phosphor-icons/react';

import { COLOR_GROUPS } from '~/config/globals';
import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';

import Button, { type ButtonProps } from '~/components/Button';
import Tooltip from '~/components/Tooltip';

import type { ColorEntry, ColorGroup } from '~/types';

interface ColorGroupMenuProps {
  className?: string;
  colorEntry: ColorEntry;
  source: 'color' | 'scale';
  variant?: ButtonProps['variant'];
}

// The menu reads `id`, `name`, and `group` — never `colorEntry.value`. Comparing the whole
// entry by reference would re-render both mount points on every slider tick, since
// `updateColor` rebuilds the edited entry. Extend this if the menu ever reads another field.
function arePropsEqual(previous: ColorGroupMenuProps, next: ColorGroupMenuProps): boolean {
  return (
    previous.colorEntry.id === next.colorEntry.id &&
    previous.colorEntry.name === next.colorEntry.name &&
    previous.colorEntry.group === next.colorEntry.group &&
    previous.className === next.className &&
    previous.source === next.source &&
    previous.variant === next.variant
  );
}

function ColorGroupMenu(props: ColorGroupMenuProps) {
  const { className, colorEntry, source, variant = 'solid' } = props;
  const { updateColor } = useGenerator('updateColor');

  const handleGroupAction = (value: string | number) => {
    // Empty key (None) or re-picking the current group unassigns.
    const group = !value || value === colorEntry.group ? undefined : (value as ColorGroup);

    trackEvent(`${source}:group`, { value: group ?? 'none' });
    updateColor(colorEntry.id, { group });
  };

  return (
    <Dropdown>
      <Tooltip content="Color group" placement="bottom">
        <div className="max-w-fit">
          <DropdownTrigger>
            <Button
              aria-label={`Color group for ${colorEntry.name}${colorEntry.group ? `: ${COLOR_GROUPS[colorEntry.group].label}` : ''}`}
              className={cn('max-xs:button-menu-square', className)}
              isIconOnly={!colorEntry.group}
              size="menu"
              startContent={<TagIcon className="text-lg" />}
              variant={colorEntry.group ? variant : 'light'}
            >
              <span className="hidden xs:inline-flex">
                {colorEntry.group ? COLOR_GROUPS[colorEntry.group].label : null}
              </span>
            </Button>
          </DropdownTrigger>
        </div>
      </Tooltip>
      <DropdownMenu
        aria-label="Color group"
        onAction={handleGroupAction}
        selectedKeys={colorEntry.group ? [colorEntry.group] : []}
        selectionMode="single"
        variant="flat"
      >
        <DropdownSection classNames={{ base: 'mb-0' }} title="COLOR GROUP">
          <>
            {!!colorEntry.group && (
              <DropdownItem key="" className="text-foreground-500">
                None
              </DropdownItem>
            )}
            {objectEntries(COLOR_GROUPS).map(([key, data]) => (
              <DropdownItem key={key} description={data.description}>
                {data.label}
              </DropdownItem>
            ))}
          </>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}

export default memo(ColorGroupMenu, arePropsEqual);
