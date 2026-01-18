import { create } from 'zustand';

import { DEFAULT_PALETTE_NAME } from '~/config/globals';

import type { ExportColorFormat, ExportFormatType } from '~/types';

interface AppState {
  exportColorFormat: ExportColorFormat;
  exportFormatType: ExportFormatType;
  lastSavedUrl: string | null;
  loadedPaletteId: string | null;
  loadedPaletteName: string;
  showBottomBar: boolean;
  showColorOptionsPanel: boolean;
  showLoginModal: boolean;
  showPaletteOptionsPanel: boolean;
}

interface AppStateWithActions extends AppState {
  clearLoadedPalette: () => void;
  closeLoginModal: () => void;
  openLoginModal: () => void;
  setExportColorFormat: (format: ExportColorFormat) => void;
  setExportFormatType: (format: ExportFormatType) => void;
  setLoadedPalette: (id: string | null, name: string | null, url: string | null) => void;
  toggleBottomBar: () => void;
  toggleColorOptionsPanel: () => void;
  togglePaletteOptionsPanel: () => void;
}

const initialState: AppState = {
  exportColorFormat: 'oklch',
  exportFormatType: 'tailwind4',
  lastSavedUrl: null,
  loadedPaletteId: null,
  loadedPaletteName: DEFAULT_PALETTE_NAME,
  showBottomBar: false,
  showColorOptionsPanel: false,
  showLoginModal: false,
  showPaletteOptionsPanel: false,
};

export const useAppStore = create<AppStateWithActions>(set => ({
  ...initialState,

  clearLoadedPalette: (): void =>
    set({
      lastSavedUrl: null,
      loadedPaletteId: null,
      loadedPaletteName: DEFAULT_PALETTE_NAME,
    }),

  closeLoginModal: (): void => set({ showLoginModal: false }),

  openLoginModal: (): void => set({ showLoginModal: true }),

  setExportColorFormat: (format): void => set({ exportColorFormat: format }),

  setExportFormatType: (format): void => set({ exportFormatType: format }),

  setLoadedPalette: (id, name, url): void =>
    set({
      lastSavedUrl: url,
      loadedPaletteId: id,
      loadedPaletteName: name || DEFAULT_PALETTE_NAME,
    }),

  toggleBottomBar: (): void =>
    set(state => ({
      showBottomBar: !state.showBottomBar,
    })),

  toggleColorOptionsPanel: (): void =>
    set(state => ({
      showColorOptionsPanel: !state.showColorOptionsPanel,
    })),

  togglePaletteOptionsPanel: (): void =>
    set(state => ({
      showPaletteOptionsPanel: !state.showPaletteOptionsPanel,
    })),
}));
