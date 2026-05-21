import { useMemoDeepCompare } from '@gilbarbara/hooks';

import { usePaletteStore } from '~/stores/paletteStore';
import { getChromaAsPercentage } from '~/utils/color';
import { CURVE_OPTION_KEYS, getDefaultGlobalOptions, PALETTE_OPTION_KEYS } from '~/utils/palette';
import { serializePaletteToUrl } from '~/utils/url';

import type { GlobalScaleOptions, PaletteActions, PaletteState } from '~/types';

interface UsePaletteResult extends PaletteState, PaletteActions {
  activeColorId: string | null;
  baseSaturation: number;
  defaultOptions: GlobalScaleOptions;
  generatorUrl: string;
  hasCustomCurves: boolean;
  hasCustomPaletteOptions: boolean;
  previewColorId: string | null;
}

/**
 * Hook to access the palette store.
 */
export default function usePalette(): UsePaletteResult {
  const store = usePaletteStore();

  const baseSaturation = useMemoDeepCompare(
    () => getChromaAsPercentage(store.colors[0].value),
    [store.colors],
  );

  const defaultOptions = useMemoDeepCompare(
    () => getDefaultGlobalOptions(store.colors[0].value),
    [store.colors],
  );

  const generatorUrl = useMemoDeepCompare(
    () => serializePaletteToUrl({ colors: store.colors, globalOptions: store.globalOptions }),
    [store.colors, store.globalOptions],
  );

  const hasCustomCurves = useMemoDeepCompare(
    () => CURVE_OPTION_KEYS.some(key => store.globalOptions[key] !== defaultOptions[key]),
    [store.globalOptions, defaultOptions],
  );

  const hasCustomPaletteOptions = useMemoDeepCompare(
    () => PALETTE_OPTION_KEYS.some(key => store.globalOptions[key] !== defaultOptions[key]),
    [store.globalOptions, defaultOptions],
  );

  return {
    baseSaturation,
    defaultOptions,
    generatorUrl,
    hasCustomCurves,
    hasCustomPaletteOptions,
    ...store,
  };
}
