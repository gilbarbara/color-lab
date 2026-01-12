import { useMemoDeepCompare } from '@gilbarbara/hooks';

import { usePaletteStore } from '~/stores/paletteStore';
import { getChromaAsPercentage } from '~/utils/color';
import { getDefaultGlobalOptions } from '~/utils/palette';

import type { GlobalScaleOptions, PaletteActions, PaletteState } from '~/types';

interface UsePaletteResult extends PaletteState, PaletteActions {
  baseSaturation: number;
  defaultOptions: GlobalScaleOptions;
}

/**
 * Hook to access the palette store.
 */
export default function usePalette(): UsePaletteResult {
  const store = usePaletteStore();

  const baseSaturation = useMemoDeepCompare(() => {
    if (!store.colors[0]?.value) {
      return 80;
    }

    return getChromaAsPercentage(store.colors[0].value);
  }, [store.colors]);

  const defaultOptions = useMemoDeepCompare(
    () => getDefaultGlobalOptions(store.colors[0]?.value ?? ''),
    [store.colors],
  );

  return { baseSaturation, defaultOptions, ...store };
}
