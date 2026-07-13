import { useMemo } from 'react';

import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import { filterColorsByGroups, getUsedGroups } from '~/utils/generator';

import type { ColorEntry } from '~/types';

/**
 * Colors narrowed to the active group filter, for the main palette display.
 *
 * The filter self-heals: `groupFilter` can hold a group that no longer exists in
 * the palette (its last color was unassigned or removed). Intersecting with the
 * used groups makes an all-vanished filter collapse back to "show all" instead of
 * rendering an empty, unrecoverable view (the chip for that group is already gone).
 */
export default function useGroupFilteredColors(): ColorEntry[] {
  const { colors } = useGenerator('colors');
  const { groupFilter } = useApp('groupFilter');

  return useMemo(() => {
    const used = getUsedGroups(colors);
    const effective = groupFilter.filter(group => used.includes(group));

    return filterColorsByGroups(colors, effective);
  }, [colors, groupFilter]);
}
