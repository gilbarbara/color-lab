import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_PALETTE_NAME } from '~/config/globals';
import { detectInitialGamut } from '~/utils/gamut';

import type { ExportColorFormat, ExportFormatType, Gamut } from '~/types';

interface AppState {
  exportColorFormat: ExportColorFormat;
  exportFormatType: ExportFormatType;
  gamut: Gamut;
  lastSavedUrl: string | null;
  loadedPaletteId: string | null;
  loadedPaletteName: string;
  previewScrollNonce: number;
  showBottomBar: boolean;
  showColorOptionsPanel: boolean;
  showLoginModal: boolean;
  showPaletteOptionsPanel: boolean;
  showPreview: boolean;
  showSidebar: boolean;
}

export interface AppStateWithActions extends AppState {
  clearLoadedPalette: () => void;
  closeLoginModal: () => void;
  openLoginModal: () => void;
  requestPreviewScroll: () => void;
  setExportColorFormat: (format: ExportColorFormat) => void;
  setExportFormatType: (format: ExportFormatType) => void;
  setGamut: (gamut: Gamut) => void;
  setLoadedPalette: (id: string | null, name: string | null, url: string | null) => void;
  toggleBottomBar: () => void;
  toggleColorOptionsPanel: () => void;
  togglePaletteOptionsPanel: () => void;
  togglePreview: (toggle?: boolean) => void;
  toggleSidebar: () => void;
}

export const initialState: AppState = {
  exportColorFormat: 'oklch',
  exportFormatType: 'tailwind4',
  gamut: detectInitialGamut(),
  lastSavedUrl: null,
  loadedPaletteId: null,
  loadedPaletteName: DEFAULT_PALETTE_NAME,
  previewScrollNonce: 0,
  showBottomBar: false,
  showColorOptionsPanel: false,
  showLoginModal: false,
  showPaletteOptionsPanel: false,
  showPreview: true,
  showSidebar: true,
};

export const useAppStore = create<AppStateWithActions>()(
  persist(
    set => ({
      ...initialState,

      clearLoadedPalette: () => {
        set({
          lastSavedUrl: null,
          loadedPaletteId: null,
          loadedPaletteName: DEFAULT_PALETTE_NAME,
        });
      },

      closeLoginModal: () => {
        set({ showLoginModal: false });
      },

      openLoginModal: () => {
        set({ showLoginModal: true });
      },

      requestPreviewScroll: () => {
        set(state => ({ previewScrollNonce: state.previewScrollNonce + 1 }));
      },

      setExportColorFormat: format => {
        set({ exportColorFormat: format });
      },

      setExportFormatType: format => {
        set({ exportFormatType: format });
      },

      setGamut: gamut => {
        set({ gamut });
      },

      setLoadedPalette: (id, name, url) => {
        set({
          lastSavedUrl: url,
          loadedPaletteId: id,
          loadedPaletteName: name || DEFAULT_PALETTE_NAME,
        });
      },

      toggleBottomBar: () => {
        set(state => ({ showBottomBar: !state.showBottomBar }));
      },

      toggleColorOptionsPanel: () => {
        set(state => ({ showColorOptionsPanel: !state.showColorOptionsPanel }));
      },

      togglePaletteOptionsPanel: () => {
        set(state => ({ showPaletteOptionsPanel: !state.showPaletteOptionsPanel }));
      },

      togglePreview: force => {
        set(state => ({
          showPreview: typeof force === 'boolean' ? force : !state.showPreview,
        }));
      },

      toggleSidebar: () => {
        set(state => ({ showSidebar: !state.showSidebar }));
      },
    }),
    {
      name: 'color-lab',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        exportColorFormat: state.exportColorFormat,
        exportFormatType: state.exportFormatType,
        gamut: state.gamut,
        showColorOptionsPanel: state.showColorOptionsPanel,
        showPaletteOptionsPanel: state.showPaletteOptionsPanel,
        showPreview: state.showPreview,
        showSidebar: state.showSidebar,
      }),
    },
  ),
);
