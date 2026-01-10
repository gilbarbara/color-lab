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

interface PaletteStore extends PaletteActions, PaletteState {}

const initialPalette = createPalette();

export const usePaletteStore = create<PaletteStore>(set => ({
  ...initialPalette,

  addColor: (value, name) =>
    set(state =>
      addColorFn({ colors: state.colors, globalOptions: state.globalOptions }, value, name),
    ),

  clearColorOverrides: index =>
    set(state =>
      clearColorOverridesFn({ colors: state.colors, globalOptions: state.globalOptions }, index),
    ),

  removeColor: index =>
    set(state =>
      removeColorFn({ colors: state.colors, globalOptions: state.globalOptions }, index),
    ),

  resetGlobalOptions: () =>
    set(state =>
      resetGlobalOptionsFn({ colors: state.colors, globalOptions: state.globalOptions }),
    ),

  resetPalette: () => set(resetPaletteFn()),

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
