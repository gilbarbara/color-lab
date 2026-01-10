import { create } from 'zustand';

import type { ExportColorFormat, ExportFormatType } from '~/types';

interface AppState {
  exportColorFormat: ExportColorFormat;
  exportFormatType: ExportFormatType;
  showBottomBar: boolean;
  showColorOptionsPanel: boolean;
  showPaletteOptionsPanel: boolean;
}

interface AppStateWithActions extends AppState {
  setExportColorFormat: (format: ExportColorFormat) => void;
  setExportFormatType: (format: ExportFormatType) => void;
  toggleBottomBar: () => void;
  toggleColorOptionsPanel: () => void;
  togglePaletteOptionsPanel: () => void;
}

const initialState: AppState = {
  exportColorFormat: 'oklch',
  exportFormatType: 'tailwind4',
  showBottomBar: false,
  showColorOptionsPanel: false,
  showPaletteOptionsPanel: false,
};

export const useAppStore = create<AppStateWithActions>(set => ({
  ...initialState,

  setExportColorFormat: (format): void => set({ exportColorFormat: format }),

  setExportFormatType: (format): void => set({ exportFormatType: format }),

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
