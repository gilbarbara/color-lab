import { create } from 'zustand';

import type { SavedPalette } from '~/types';

interface PalettesActions {
  addPalette: (palette: SavedPalette) => void;
  removePalette: (id: string) => void;
  reset: () => void;
  setError: (error: string | null) => void;
  setPalettes: (palettes: SavedPalette[], userId: string) => void;
  setStatus: (status: PalettesState['status']) => void;
  updatePalette: (id: string, updates: Partial<SavedPalette>) => void;
}

interface PalettesState {
  error: string | null;
  loadedUserId: string | null;
  palettes: SavedPalette[];
  status: 'idle' | 'loading' | 'saving' | 'error';
}

const initialState: PalettesState = {
  error: null,
  loadedUserId: null,
  palettes: [],
  status: 'idle',
};

export const usePalettesStore = create<PalettesActions & PalettesState>(set => ({
  ...initialState,

  addPalette: palette =>
    set(state => ({
      palettes: [palette, ...state.palettes],
    })),

  removePalette: id =>
    set(state => ({
      palettes: state.palettes.filter(p => p.id !== id),
    })),

  reset: () => set(initialState),

  setError: error => set({ error, status: error ? 'error' : 'idle' }),

  setPalettes: (palettes, userId) => set({ palettes, loadedUserId: userId, status: 'idle' }),

  setStatus: status => set({ status }),

  updatePalette: (id, updates) =>
    set(state => ({
      palettes: state.palettes.map(p => (p.id === id ? { ...p, ...updates } : p)),
    })),
}));
