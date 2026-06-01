import { useContext } from 'react';
import { useStore } from 'zustand';

import { GeneratorStoreContext } from '~/providers/GeneratorStoreProvider';
import type { GeneratorStore, GeneratorStoreApi } from '~/stores/generatorStore';

export default function useGeneratorStore<T>(selector: (state: GeneratorStore) => T): T {
  const api = useGeneratorStoreApi();

  return useStore(api, selector);
}

export function useGeneratorStoreApi(): GeneratorStoreApi {
  const context = useContext(GeneratorStoreContext);

  if (context === null) {
    throw new Error('useGeneratorStoreApi must be used within a GeneratorStoreProvider');
  }

  return context;
}
