import { useMemo } from 'react';
import { TagIcon, XCircleIcon } from '@phosphor-icons/react';

import { COLOR_GROUPS } from '~/config/globals';
import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';
import { getUsedGroups } from '~/utils/generator';

import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';

import type { ColorGroup } from '~/types';

export default function PaletteGroupToolbar() {
  const { groupFilter, setGroupFilter, toggleGroupFilter } = useApp(
    'groupFilter',
    'setGroupFilter',
    'toggleGroupFilter',
  );
  const { colors } = useGenerator('colors');

  const handleClickToggle = (group: ColorGroup) => {
    toggleGroupFilter(group);
    trackEvent('palette:group', { enabled: !groupFilter.includes(group), value: group });
  };

  const handleClickClear = () => {
    setGroupFilter([]);
    trackEvent('palette:group_clear');
  };

  const colorGroups = useMemo(() => getUsedGroups(colors), [colors]);

  if (!colorGroups.length) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 mt-4">
      <TagIcon className="text-foreground-500 text-2xl shrink-0" />

      <div
        aria-label="Filter by color group"
        className="flex flex-1 flex-wrap items-center gap-2"
        role="group"
      >
        {colorGroups.map(group => (
          <Tooltip key={group} content={`Filter by ${COLOR_GROUPS[group].label}`}>
            <Button
              aria-label={`Filter by ${COLOR_GROUPS[group].label}`}
              aria-pressed={groupFilter.includes(group)}
              className="text-sm"
              color="primary"
              onPress={() => handleClickToggle(group)}
              size="sm"
              variant={groupFilter.includes(group) ? 'solid' : 'flat'}
            >
              {COLOR_GROUPS[group].label}
            </Button>
          </Tooltip>
        ))}
        {groupFilter.length > 0 && (
          <Tooltip content="Clear filters">
            <Button
              aria-label="Clear group filters"
              className="text-foreground-500"
              isIconOnly
              onPress={handleClickClear}
              size="xs"
              variant="light"
            >
              <XCircleIcon className="text-lg" />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
