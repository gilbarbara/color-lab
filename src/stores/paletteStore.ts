import { create } from 'zustand';

import {
  addColor as addColorFn,
  clearColorOverrides as clearColorOverridesFn,
  createPalette,
  removeColor as removeColorFn,
  resetGlobalOptions as resetGlobalOptionsFn,
  resetPalette as resetPaletteFn,
  updateColor as updateColorFn,
  updateColorOverrides as updateColorOverridesFn,
  updateGlobalOptions as updateGlobalOptionsFn,
} from '~/utils/palette';

import type { PaletteActions, PaletteState } from '~/types';

interface PaletteStore extends PaletteActions, PaletteState {
  activeColorId: string | null;
}

const initialPalette = createPalette();

export const usePaletteStore = create<PaletteStore>(set => ({
  ...initialPalette,
  activeColorId: initialPalette.colors[0]?.id ?? null,

  addColor: (value, name) =>
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

      return { ...next, activeColorId: newColor?.id ?? state.activeColorId };
    }),

  clearColorOverrides: index =>
    set(state =>
      clearColorOverridesFn({ colors: state.colors, globalOptions: state.globalOptions }, index),
    ),

  removeColor: index =>
    set(state => {
      const removed = state.colors[index];
      const next = removeColorFn(
        { colors: state.colors, globalOptions: state.globalOptions },
        index,
      );

      if (next.colors === state.colors) {
        return state;
      }

      let { activeColorId } = state;

      if (removed && removed.id === activeColorId) {
        const neighbor = state.colors[index + 1] ?? state.colors[index - 1];

        activeColorId = neighbor?.id ?? null;
      }

      return { ...next, activeColorId };
    }),

  resetGlobalOptions: () =>
    set(state =>
      resetGlobalOptionsFn({ colors: state.colors, globalOptions: state.globalOptions }),
    ),

  resetPalette: () =>
    set(() => {
      const fresh = resetPaletteFn();

      return { ...fresh, activeColorId: fresh.colors[0]?.id ?? null };
    }),

  setActiveColor: id =>
    set(state => {
      if (id === state.activeColorId || !state.colors.some(c => c.id === id)) {
        return state;
      }

      return { activeColorId: id };
    }),

  updateColor: (index, updates) =>
    set(state =>
      updateColorFn({ colors: state.colors, globalOptions: state.globalOptions }, index, updates),
    ),

  updateColorOverrides: (index, overrides) =>
    set(state =>
      updateColorOverridesFn(
        { colors: state.colors, globalOptions: state.globalOptions },
        index,
        overrides,
      ),
    ),

  updateGlobalOptions: updates =>
    set(state =>
      updateGlobalOptionsFn({ colors: state.colors, globalOptions: state.globalOptions }, updates),
    ),
}));
