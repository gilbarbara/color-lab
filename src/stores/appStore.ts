import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_PALETTE_NAME } from '~/config/globals';
import { detectInitialGamut } from '~/utils/gamut';

import type { ExportColorFormat, ExportFormatType, Gamut } from '~/types';

interface AppState {
  collapseAnimationCount: number;
  colorScrollRequest: { id: string; nonce: number } | null;
  exportColorFormat: ExportColorFormat;
  exportFormatType: ExportFormatType;
  gamut: Gamut;
  lastSavedUrl: string | null;
  paletteId: string | null;
  paletteName: string;
  previewScrollNonce: number;
  showBottomBar: boolean;
  showColorOptionsPanel: boolean;
  showLoginModal: boolean;
  showPaletteOptionsPanel: boolean;
  showPreview: boolean;
  showSidebar: boolean;
}

export interface AppStateWithActions extends AppState {
  clearPalette: () => void;
  closeLoginModal: () => void;
  decrementCollapseAnimation: () => void;
  incrementCollapseAnimation: () => void;
  openLoginModal: () => void;
  requestColorScroll: (id: string) => void;
  requestPreviewScroll: () => void;
  setExportColorFormat: (format: ExportColorFormat) => void;
  setExportFormatType: (format: ExportFormatType) => void;
  setGamut: (gamut: Gamut) => void;
  setPalette: (id: string | null, name: string | null, url: string | null) => void;
  toggleBottomBar: (toggle?: boolean) => void;
  toggleColorOptionsPanel: () => void;
  togglePaletteOptionsPanel: () => void;
  togglePreview: (toggle?: boolean) => void;
  toggleSidebar: (toggle?: boolean) => void;
}

export const initialState: AppState = {
  collapseAnimationCount: 0,
  colorScrollRequest: null,
  exportColorFormat: 'oklch',
  exportFormatType: 'tailwind4',
  gamut: detectInitialGamut(),
  lastSavedUrl: null,
  paletteId: null,
  paletteName: DEFAULT_PALETTE_NAME,
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

      clearPalette: () => {
        set({
          lastSavedUrl: null,
          paletteId: null,
          paletteName: DEFAULT_PALETTE_NAME,
        });
      },

      closeLoginModal: () => {
        set({ showLoginModal: false });
      },

      decrementCollapseAnimation: () => {
        set(state => ({
          collapseAnimationCount: Math.max(0, state.collapseAnimationCount - 1),
        }));
      },

      incrementCollapseAnimation: () => {
        set(state => ({
          collapseAnimationCount: state.collapseAnimationCount + 1,
        }));
      },

      openLoginModal: () => {
        set({ showLoginModal: true });
      },

      requestColorScroll: id => {
        set(state => ({
          colorScrollRequest: {
            id,
            nonce: (state.colorScrollRequest?.nonce ?? 0) + 1,
          },
        }));
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

      setPalette: (id, name, url) => {
        set({
          lastSavedUrl: url,
          paletteId: id,
          paletteName: name || DEFAULT_PALETTE_NAME,
        });
      },

      toggleBottomBar: force => {
        set(state => ({
          showBottomBar: typeof force === 'boolean' ? force : !state.showBottomBar,
        }));
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

      toggleSidebar: force => {
        set(state => ({
          showSidebar: typeof force === 'boolean' ? force : !state.showSidebar,
        }));
      },
    }),
    {
      name: 'color-lab',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: state => state,
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
