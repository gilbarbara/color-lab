import { createStore } from 'zustand/vanilla';

import { DEFAULT_PALETTE_NAME } from '~/config/globals';
import {
  addColor as addColorFn,
  clearColorOverrides as clearColorOverridesFn,
  createPalette,
  removeColor as removeColorFn,
  reorderColors as reorderColorsFn,
  resetAdvancedOptions as resetAdvancedOptionsFn,
  resetGlobalOptions as resetGlobalOptionsFn,
  resetPalette as resetPaletteFn,
  setColorOverride as setColorOverrideFn,
  updateColor as updateColorFn,
  updateGlobalOptions as updateGlobalOptionsFn,
} from '~/utils/generator';

import type { GeneratorActions, GeneratorState } from '~/types';

interface GeneratorInitialState {
  activeColorId?: string | null;
  colors: GeneratorState['colors'];
  globalOptions: GeneratorState['globalOptions'];
  name?: string;
  previewColorId?: string | null;
}

export type GeneratorStoreApi = ReturnType<typeof createGeneratorStore>;

export interface GeneratorStore extends GeneratorActions, GeneratorState {
  activeColorId: string | null;
  // Transient per-session view state: ids of colors whose scale charts are open.
  // Not part of GeneratorState — not serialized to the URL, resets on reload.
  chartColorIds: Set<string>;
  name: string;
  previewColorId: string | null;
}

function buildInitialState(
  input?: GeneratorInitialState,
): Pick<
  GeneratorStore,
  'activeColorId' | 'chartColorIds' | 'colors' | 'globalOptions' | 'name' | 'previewColorId'
> {
  if (input && input.colors.length > 0) {
    const firstId = input.colors[0].id;

    return {
      colors: input.colors,
      globalOptions: input.globalOptions,
      activeColorId: input.activeColorId ?? firstId,
      chartColorIds: new Set(),
      name: input.name ?? DEFAULT_PALETTE_NAME,
      previewColorId: input.previewColorId ?? firstId,
    };
  }

  const fallback = createPalette();
  const fallbackId = fallback.colors[0]?.id ?? null;

  return {
    colors: fallback.colors,
    globalOptions: fallback.globalOptions,
    activeColorId: fallbackId,
    chartColorIds: new Set(),
    name: fallback.name ?? DEFAULT_PALETTE_NAME,
    previewColorId: fallbackId,
  };
}

export function createGeneratorStore(initialState?: GeneratorInitialState) {
  return createStore<GeneratorStore>()(set => ({
    ...buildInitialState(initialState),

    addColor: (value, name) => {
      let newId: string | null = null;

      set(state => {
        const next = addColorFn(
          { colors: state.colors, globalOptions: state.globalOptions },
          value,
          name,
        );

        if (next.colors === state.colors) {
          return state;
        }

        const newColor = next.colors[next.colors.length - 1];

        newId = newColor?.id ?? null;

        return { ...next, activeColorId: newColor?.id ?? state.activeColorId };
      });

      return newId;
    },

    clearColorOverrides: id =>
      set(state =>
        clearColorOverridesFn({ colors: state.colors, globalOptions: state.globalOptions }, id),
      ),

    removeColor: id => {
      let nextActiveId: string | null = null;

      set(state => {
        // The neighbor that inherits the active/preview selection is positional,
        // so resolve the slot before the color is gone.
        const index = state.colors.findIndex(color => color.id === id);
        const removed = state.colors[index];
        const next = removeColorFn(
          { colors: state.colors, globalOptions: state.globalOptions },
          id,
        );

        if (next.colors === state.colors) {
          return state;
        }

        let { activeColorId, previewColorId } = state;

        if (removed && removed.id === activeColorId) {
          const neighbor = state.colors[index + 1] ?? state.colors[index - 1];

          activeColorId = neighbor?.id ?? null;
        }

        if (removed && removed.id === previewColorId) {
          const neighbor = state.colors[index + 1] ?? state.colors[index - 1];

          previewColorId = neighbor?.id ?? null;
        }

        nextActiveId = activeColorId;

        let { chartColorIds } = state;

        if (removed && chartColorIds.has(removed.id)) {
          chartColorIds = new Set(chartColorIds);
          chartColorIds.delete(removed.id);
        }

        return { ...next, activeColorId, chartColorIds, previewColorId };
      });

      return nextActiveId;
    },

    reorderColors: orderedIds =>
      set(state => {
        const next = reorderColorsFn(
          { colors: state.colors, globalOptions: state.globalOptions },
          orderedIds,
        );

        // No-op guard: reorderColorsFn is called with a fresh literal, so on a
        // no-op it returns a new object with the same colors ref. Return the
        // original state to keep the top-level reference stable and spare
        // whole-state subscribers a re-render.
        return next.colors === state.colors ? state : next;
      }),

    resetAdvancedOptions: () =>
      set(state =>
        resetAdvancedOptionsFn({ colors: state.colors, globalOptions: state.globalOptions }),
      ),

    resetGlobalOptions: () =>
      set(state =>
        resetGlobalOptionsFn({ colors: state.colors, globalOptions: state.globalOptions }),
      ),

    resetPalette: () =>
      set(() => {
        const fresh = resetPaletteFn();

        const nextId = fresh.colors[0]?.id ?? null;

        return {
          ...fresh,
          activeColorId: nextId,
          previewColorId: nextId,
        };
      }),

    setActiveColor: id =>
      set(state => {
        if (id === state.activeColorId || !state.colors.some(c => c.id === id)) {
          return state;
        }

        return { activeColorId: id };
      }),

    setAllCharts: open =>
      set(state => ({
        chartColorIds: open ? new Set(state.colors.map(c => c.id)) : new Set(),
      })),

    toggleChart: id =>
      set(state => {
        const chartColorIds = new Set(state.chartColorIds);

        if (chartColorIds.has(id)) {
          chartColorIds.delete(id);
        } else {
          chartColorIds.add(id);
        }

        return { chartColorIds };
      }),

    setName: name =>
      set(state => {
        const next = name || DEFAULT_PALETTE_NAME;

        return next === state.name ? state : { name: next };
      }),

    setPreviewColor: id =>
      set(state => {
        if (id === state.previewColorId || !state.colors.some(c => c.id === id)) {
          return state;
        }

        return { previewColorId: id };
      }),

    updateColor: (id, updates) =>
      set(state =>
        updateColorFn({ colors: state.colors, globalOptions: state.globalOptions }, id, updates),
      ),

    setColorOverride: (id, updates) =>
      set(state =>
        setColorOverrideFn(
          { colors: state.colors, globalOptions: state.globalOptions },
          id,
          updates,
        ),
      ),

    updateGlobalOptions: updates =>
      set(state =>
        updateGlobalOptionsFn(
          { colors: state.colors, globalOptions: state.globalOptions },
          updates,
        ),
      ),
  }));
}
