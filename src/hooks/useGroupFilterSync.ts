import { useEffect } from 'react';

import { useGeneratorStoreApi } from '~/hooks/useGeneratorStore';
import { useAppStore } from '~/stores/appStore';
import { getUsedGroups } from '~/utils/generator';

import type { ColorEntry } from '~/types';

/**
 * Keeps the group filter tied to the palette it was applied to.
 *
 * On mount it drops the filter entirely. appStore is a module singleton, but the generator
 * store is per-palette (created in a ref by GeneratorStoreProvider), so a new store instance
 * means a newly loaded palette — a filter carried over from the previous one would silently
 * hide colors in a palette the user never filtered.
 *
 * Then, for the rest of the session, it retires filters whose group no longer exists in the
 * palette. `useGroupFilteredColors` only *masks* a vanished group so the view never strands
 * empty — the filter itself survives in appStore. Without this, re-assigning that group to any
 * color would silently re-apply a filter the user believes they already cleared, making half
 * the palette disappear on an unrelated edit.
 *
 * Subscribes to the store rather than selecting from it: Generator must not re-render on
 * every color edit.
 */
export default function useGroupFilterSync() {
  const generatorStoreApi = useGeneratorStoreApi();

  useEffect(() => {
    const prune = (colors: ColorEntry[]) => {
      const { groupFilter, pruneGroupFilter } = useAppStore.getState();

      if (!groupFilter.length) {
        return;
      }

      pruneGroupFilter(getUsedGroups(colors));
    };

    useAppStore.getState().resetGroupFilter();

    return generatorStoreApi.subscribe((state, previousState) => {
      if (state.colors !== previousState.colors) {
        prune(state.colors);
      }
    });
  }, [generatorStoreApi]);
}
