import { act, renderHook } from '@testing-library/react';

import useGroupFilterSync from '~/hooks/useGroupFilterSync';
import { initialState, useAppStore } from '~/stores/appStore';
import { BLUE, createColorEntry, CRIMSON, GRAY } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';

import type { ColorGroup } from '~/types';

const BRAND = createColorEntry('Brand', CRIMSON, undefined, 'brand');
const NEUTRAL = createColorEntry('Neutral', GRAY, undefined, 'neutral');
const UNGROUPED = createColorEntry('Accent', BLUE);

function setColors(colors: (typeof BRAND)[]) {
  act(() => {
    getGeneratorStore().setState({ colors });
  });
}

// The mount reset clears any filter, so the subscription tests have to apply theirs *after*
// mounting — exactly as a user does, by pressing a chip on the palette they are looking at.
function setGroupFilter(groupFilter: ColorGroup[]) {
  act(() => {
    useAppStore.setState({ groupFilter });
  });
}

describe('hooks/useGroupFilterSync', () => {
  beforeEach(() => {
    useAppStore.setState(initialState);
    getGeneratorStore().setState({ colors: [BRAND, NEUTRAL, UNGROUPED] });
  });

  // A new generator store means a newly loaded palette: a filter left over from the previous
  // one would silently hide colors in a palette the user never filtered.
  it('clears the filter on mount', () => {
    useAppStore.setState({ groupFilter: ['brand'] });

    renderHook(() => useGroupFilterSync());

    expect(useAppStore.getState().groupFilter).toEqual([]);
  });

  it('leaves a filter alone while its group is still used', () => {
    renderHook(() => useGroupFilterSync());
    setGroupFilter(['brand']);

    setColors([BRAND, NEUTRAL, { ...UNGROUPED, group: 'neutral' }]);

    expect(useAppStore.getState().groupFilter).toEqual(['brand']);
  });

  it('prunes when the last color of a filtered group is unassigned', () => {
    renderHook(() => useGroupFilterSync());
    setGroupFilter(['brand']);

    setColors([{ ...BRAND, group: undefined }, NEUTRAL, UNGROUPED]);

    expect(useAppStore.getState().groupFilter).toEqual([]);
  });

  it('keeps the groups that are still used when pruning', () => {
    renderHook(() => useGroupFilterSync());
    setGroupFilter(['brand', 'neutral']);

    setColors([{ ...BRAND, group: undefined }, NEUTRAL, UNGROUPED]);

    expect(useAppStore.getState().groupFilter).toEqual(['neutral']);
  });

  // The bug this hook exists for: useGroupFilteredColors only masks a vanished group, so
  // without pruning, re-assigning it later would silently re-apply a filter the user
  // believes they cleared — and half the palette would disappear on an unrelated edit.
  it('does not let a vanished filter resurrect when the group is used again', () => {
    renderHook(() => useGroupFilterSync());
    setGroupFilter(['brand']);

    setColors([{ ...BRAND, group: undefined }, NEUTRAL, UNGROUPED]);
    setColors([{ ...BRAND, group: undefined }, NEUTRAL, { ...UNGROUPED, group: 'brand' }]);

    expect(useAppStore.getState().groupFilter).toEqual([]);
  });

  it('stops pruning once unmounted', () => {
    const { unmount } = renderHook(() => useGroupFilterSync());

    setGroupFilter(['brand']);
    unmount();

    setColors([{ ...BRAND, group: undefined }, NEUTRAL, UNGROUPED]);

    expect(useAppStore.getState().groupFilter).toEqual(['brand']);
  });
});
