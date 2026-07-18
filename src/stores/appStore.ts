import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { COLOR_SPACING_DEFAULT, DEFAULT_PALETTE_NAME, STORAGE_KEY } from '~/config/globals';
import { detectInitialGamut } from '~/utils/gamut';

import type {
  ColorGroup,
  ColorSpacing,
  ExportColorFormat,
  ExportFormatType,
  Gamut,
  GeneratorView,
} from '~/types';

interface AppState {
  collapseAnimationCount: number;
  colorScrollRequest: { id: string; nonce: number } | null;
  colorSpacing: ColorSpacing;
  exportColorFormat: ExportColorFormat;
  exportFormatType: ExportFormatType;
  gamut: Gamut;
  // Which groups the palette view is filtered to. [] = All (no filter). In-memory
  // only (never persisted): a group filter is palette-relative, so it resets to All
  // on reload rather than carrying a stale selection into a different palette.
  groupFilter: ColorGroup[];
  lastSavedUrl: string | null;
  paletteId: string | null;
  paletteName: string;
  previewScrollNonce: number;
  // In-memory only (never persisted): the full URL of the palette being worked on,
  // so the Header logo can return to it during a session. Not a source of truth —
  // it defers to the path and is gone on reload (the back button restores history).
  sessionPalettePath: string | null;
  showBottomBar: boolean;
  showColorOptionsPanel: boolean;
  showLoginModal: boolean;
  showPaletteOptionsPanel: boolean;
  showPreview: boolean;
  showSidebar: boolean;
  view: GeneratorView;
}

export interface AppStateWithActions extends AppState {
  clearPalette: () => void;
  closeLoginModal: () => void;
  decrementCollapseAnimation: () => void;
  incrementCollapseAnimation: () => void;
  openLoginModal: () => void;
  pruneGroupFilter: (usedGroups: ColorGroup[]) => void;
  requestColorScroll: (id: string) => void;
  requestPreviewScroll: () => void;
  resetGroupFilter: () => void;
  setColorSpacing: (value: ColorSpacing) => void;
  setExportColorFormat: (format: ExportColorFormat) => void;
  setExportFormatType: (format: ExportFormatType) => void;
  setGamut: (gamut: Gamut) => void;
  setGroupFilter: (groups: ColorGroup[]) => void;
  setPalette: (id: string | null, name: string | null, url: string | null) => void;
  setSessionPalettePath: (url: string | null) => void;
  setView: (view: GeneratorView) => void;
  toggleBottomBar: (toggle?: boolean) => void;
  toggleColorOptionsPanel: () => void;
  toggleGroupFilter: (group: ColorGroup) => void;
  togglePaletteOptionsPanel: () => void;
  togglePreview: (toggle?: boolean) => void;
  toggleSidebar: (toggle?: boolean) => void;
}

export const initialState: AppState = {
  collapseAnimationCount: 0,
  colorScrollRequest: null,
  colorSpacing: COLOR_SPACING_DEFAULT,
  exportColorFormat: 'oklch',
  exportFormatType: 'tailwind4',
  gamut: detectInitialGamut(),
  groupFilter: [],
  lastSavedUrl: null,
  paletteId: null,
  paletteName: DEFAULT_PALETTE_NAME,
  previewScrollNonce: 0,
  sessionPalettePath: null,
  showBottomBar: false,
  showColorOptionsPanel: false,
  showLoginModal: false,
  showPaletteOptionsPanel: false,
  showPreview: true,
  showSidebar: true,
  view: 'list',
};

export const useAppStore = create<AppStateWithActions>()(
  persist(
    set => ({
      ...initialState,

      clearPalette: () => {
        set({
          groupFilter: [],
          lastSavedUrl: null,
          paletteId: null,
          paletteName: DEFAULT_PALETTE_NAME,
          sessionPalettePath: null,
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

      // Bookkeeping, not a user action: unlike setGroupFilter/toggleGroupFilter it must not
      // touch showPreview, or retiring a vanished group would collapse the live preview.
      pruneGroupFilter: usedGroups => {
        set(state => {
          const next = state.groupFilter.filter(group => usedGroups.includes(group));

          return next.length === state.groupFilter.length ? state : { groupFilter: next };
        });
      },

      requestPreviewScroll: () => {
        set(state => ({ previewScrollNonce: state.previewScrollNonce + 1 }));
      },

      // Bookkeeping, like pruneGroupFilter: the filter is a lens on the current palette, so
      // loading another one or adding a color drops it. Must not touch showPreview.
      resetGroupFilter: () => {
        set(state => (state.groupFilter.length ? { groupFilter: [] } : state));
      },

      setColorSpacing: value => {
        set({ colorSpacing: value });
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

      setGroupFilter: groups => {
        set({ groupFilter: groups, showPreview: false });
      },

      setPalette: (id, name, url) => {
        set({
          lastSavedUrl: url,
          paletteId: id,
          paletteName: name || DEFAULT_PALETTE_NAME,
        });
      },

      setSessionPalettePath: url => {
        set({ sessionPalettePath: url });
      },

      setView: value => {
        set({ showPreview: true, view: value });
      },

      toggleBottomBar: force => {
        set(state => ({
          showBottomBar: typeof force === 'boolean' ? force : !state.showBottomBar,
        }));
      },

      toggleColorOptionsPanel: () => {
        set(state => ({ showColorOptionsPanel: !state.showColorOptionsPanel }));
      },

      toggleGroupFilter: group => {
        set(state => ({
          groupFilter: state.groupFilter.includes(group)
            ? state.groupFilter.filter(current => current !== group)
            : [...state.groupFilter, group],
          showPreview: false,
        }));
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
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? (undefined as unknown as Storage) : localStorage,
      ),
      // Skip auto-hydration on both server and client. Manual rehydrate() runs
      // post-mount via <AppStoreSync /> so initial render matches between
      // server and client (universal defaults), then localStorage applies.
      skipHydration: true,
      migrate: state => state,
      partialize: state => ({
        exportColorFormat: state.exportColorFormat,
        exportFormatType: state.exportFormatType,
        gamut: state.gamut,
        colorSpacing: state.colorSpacing,
        showColorOptionsPanel: state.showColorOptionsPanel,
        showPaletteOptionsPanel: state.showPaletteOptionsPanel,
        showPreview: state.showPreview,
        showSidebar: state.showSidebar,
        view: state.view,
      }),
    },
  ),
);
