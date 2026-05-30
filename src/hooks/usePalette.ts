import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import usePaletteStore from '~/hooks/usePaletteStore';
import { type PaletteStore } from '~/stores/paletteStore';
import { getChromaAsPercentage } from '~/utils/color';
import { CURVE_OPTION_KEYS, getDefaultGlobalOptions, PALETTE_OPTION_KEYS } from '~/utils/palette';
import { serializePaletteToUrl } from '~/utils/url';

import type { GlobalScaleOptions } from '~/types';

type ComputedKey = keyof ComputedPaletteValues;

type PaletteAggregate = ComputedPaletteValues & PaletteStore;
type StoreKey = keyof PaletteStore;
type UsePaletteKey = keyof PaletteAggregate;
interface ComputedPaletteValues {
  baseSaturation: number;
  defaultOptions: GlobalScaleOptions;
  generatorUrl: string;
  hasCustomCurves: boolean;
  hasCustomPaletteOptions: boolean;
}

const COMPUTED_DEPS = {
  baseSaturation: ['colors'],
  defaultOptions: ['colors'],
  generatorUrl: ['colors', 'globalOptions'],
  hasCustomCurves: ['colors', 'globalOptions'],
  hasCustomPaletteOptions: ['colors', 'globalOptions'],
} as const satisfies Record<ComputedKey, readonly StoreKey[]>;

const COMPUTED_KEYS = new Set(Object.keys(COMPUTED_DEPS) as ComputedKey[]);

function isComputedKey(key: UsePaletteKey): key is ComputedKey {
  return COMPUTED_KEYS.has(key as ComputedKey);
}

/**
 * Keyed selector hook for the palette store.
 *
 * Pass the keys you need (store fields, actions, or computed values).
 * The hook subscribes only to the underlying store slice required to satisfy
 * those keys, so unrelated state changes do not trigger re-renders.
 */
export default function usePalette<K extends UsePaletteKey>(
  ...keys: K[]
): Pick<PaletteAggregate, K> {
  const storeKeys = new Set<StoreKey>();

  for (const key of keys) {
    if (isComputedKey(key)) {
      for (const dep of COMPUTED_DEPS[key]) {
        storeKeys.add(dep);
      }
    } else {
      storeKeys.add(key);
    }
  }

  const slice = usePaletteStore(
    useShallow(state => {
      const out = {} as Partial<PaletteStore>;

      storeKeys.forEach(k => {
        (out as Record<string, unknown>)[k] = state[k];
      });

      return out;
    }),
  );

  const { colors, globalOptions } = slice;

  const defaultOptions = useMemo(
    () => (colors ? getDefaultGlobalOptions(colors[0].value) : (undefined as never)),
    [colors],
  );

  const baseSaturation = useMemo(
    () => (colors ? getChromaAsPercentage(colors[0].value) : (undefined as never)),
    [colors],
  );

  const generatorUrl = useMemo(
    () =>
      colors && globalOptions
        ? serializePaletteToUrl({ colors, globalOptions })
        : (undefined as never),
    [colors, globalOptions],
  );

  const hasCustomCurves = useMemo(
    () =>
      globalOptions && defaultOptions
        ? CURVE_OPTION_KEYS.some(key => globalOptions[key] !== defaultOptions[key])
        : (undefined as never),
    [globalOptions, defaultOptions],
  );

  const hasCustomPaletteOptions = useMemo(
    () =>
      globalOptions && defaultOptions
        ? PALETTE_OPTION_KEYS.some(key => globalOptions[key] !== defaultOptions[key])
        : (undefined as never),
    [globalOptions, defaultOptions],
  );

  const computed: ComputedPaletteValues = {
    baseSaturation,
    defaultOptions,
    generatorUrl,
    hasCustomCurves,
    hasCustomPaletteOptions,
  };

  const result = {} as Pick<PaletteAggregate, K>;

  for (const key of keys) {
    (result as Record<string, unknown>)[key] = isComputedKey(key)
      ? computed[key]
      : slice[key as StoreKey];
  }

  return result;
}
