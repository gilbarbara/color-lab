import { useContext } from 'react';
import { useStore } from 'zustand';

import { PaletteStoreContext } from '~/providers/PaletteStoreProvider';
import type { PaletteStore, PaletteStoreApi } from '~/stores/paletteStore';

export default function usePaletteStore<T>(selector: (state: PaletteStore) => T): T {
  const api = usePaletteStoreApi();

  return useStore(api, selector);
}

export function usePaletteStoreApi(): PaletteStoreApi {
  const context = useContext(PaletteStoreContext);

  if (context === null) {
    throw new Error('usePaletteStoreApi must be used within a PaletteStoreProvider');
  }

  return context;
}
