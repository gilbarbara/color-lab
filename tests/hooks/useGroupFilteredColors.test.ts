import { renderHook } from '@testing-library/react';

import useGroupFilteredColors from '~/hooks/useGroupFilteredColors';
import { initialState, useAppStore } from '~/stores/appStore';
import { BLUE, createColorEntry, CRIMSON, GRAY } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';

const BRAND = createColorEntry('Brand', CRIMSON, undefined, 'brand');
const NEUTRAL = createColorEntry('Neutral', GRAY, undefined, 'neutral');
const UNGROUPED = createColorEntry('Accent', BLUE);

describe('hooks/useGroupFilteredColors', () => {
  beforeEach(() => {
    useAppStore.setState(initialState);
    getGeneratorStore().setState({ colors: [BRAND, NEUTRAL, UNGROUPED] });
  });

  it('returns all colors when the filter is empty', () => {
    const { result } = renderHook(() => useGroupFilteredColors());

    expect(result.current).toEqual([BRAND, NEUTRAL, UNGROUPED]);
  });

  it('returns only the selected group, excluding ungrouped', () => {
    useAppStore.setState({ groupFilter: ['brand'] });

    const { result } = renderHook(() => useGroupFilteredColors());

    expect(result.current).toEqual([BRAND]);
  });

  it('returns the union of multiple selected groups', () => {
    useAppStore.setState({ groupFilter: ['brand', 'neutral'] });

    const { result } = renderHook(() => useGroupFilteredColors());

    expect(result.current).toEqual([BRAND, NEUTRAL]);
  });

  it('ignores a stale group not present in the palette (keeps the used ones)', () => {
    useAppStore.setState({ groupFilter: ['brand', 'semantic'] });

    const { result } = renderHook(() => useGroupFilteredColors());

    expect(result.current).toEqual([BRAND]);
  });

  it('self-heals to all colors when every selected group has vanished', () => {
    useAppStore.setState({ groupFilter: ['semantic'] });

    const { result } = renderHook(() => useGroupFilteredColors());

    expect(result.current).toEqual([BRAND, NEUTRAL, UNGROUPED]);
  });
});
