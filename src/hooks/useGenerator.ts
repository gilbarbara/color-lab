import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { CURVE_OPTION_KEYS, PALETTE_OPTION_KEYS } from '~/config/scale';
import useGeneratorStore from '~/hooks/useGeneratorStore';
import { type GeneratorStore } from '~/stores/generatorStore';
import { getChromaAsPercentage } from '~/utils/color';
import { getDefaultGlobalOptions } from '~/utils/generator';
import { isSameOptionValue } from '~/utils/scale-options';
import { serializePaletteToUrl } from '~/utils/url';

import type { DefaultScaleOptions, OklchString } from '~/types';

type ComputedKey = keyof ComputedPaletteValues;

type PaletteAggregate = ComputedPaletteValues & GeneratorStore;
type StoreKey = keyof GeneratorStore;
type UsePaletteKey = keyof PaletteAggregate;
interface ComputedPaletteValues {
  baseSaturation: number;
  defaultOptions: DefaultScaleOptions;
  generatorUrl: string;
  hasCustomCurves: boolean;
  hasCustomPaletteOptions: boolean;
  seedColor: OklchString;
}

// Synthetic slice dependency: the palette seed is `colors[0].value`, a string.
// Computeds derived from the seed subscribe to THIS (value-compared by useShallow)
// instead of the whole `colors` array, so adding/removing/editing a non-first color —
// which leaves colors[0] untouched — doesn't re-render their consumers. `generatorUrl`
// is the exception: it serializes every color, so it genuinely depends on `colors`.
const SEED = '__seedColor';

type SliceDep = StoreKey | typeof SEED;

const COMPUTED_DEPS = {
  baseSaturation: [SEED],
  defaultOptions: [SEED],
  generatorUrl: ['colors', 'globalOptions'],
  hasCustomCurves: [SEED, 'globalOptions'],
  hasCustomPaletteOptions: [SEED, 'globalOptions'],
  seedColor: [SEED],
} as const satisfies Record<ComputedKey, readonly SliceDep[]>;

const COMPUTED_KEYS = new Set(Object.keys(COMPUTED_DEPS) as ComputedKey[]);

function isComputedKey(key: UsePaletteKey): key is ComputedKey {
  return COMPUTED_KEYS.has(key as ComputedKey);
}

/**
 * Keyed selector hook for the generator store.
 *
 * Pass the keys you need (store fields, actions, or computed values).
 * The hook subscribes only to the underlying store slice required to satisfy
 * those keys, so unrelated state changes do not trigger re-renders.
 */
export default function useGenerator<K extends UsePaletteKey>(
  ...keys: K[]
): Pick<PaletteAggregate, K> {
  const sliceDeps = new Set<SliceDep>();

  for (const key of keys) {
    if (isComputedKey(key)) {
      for (const dep of COMPUTED_DEPS[key]) {
        sliceDeps.add(dep);
      }
    } else {
      sliceDeps.add(key);
    }
  }

  const slice = useGeneratorStore(
    useShallow(state => {
      const out = {} as Partial<GeneratorStore> & { [SEED]?: OklchString };

      sliceDeps.forEach(k => {
        if (k === SEED) {
          out[SEED] = state.colors[0]?.value;
        } else {
          (out as Record<string, unknown>)[k] = state[k];
        }
      });

      return out;
    }),
  );

  const { colors, globalOptions } = slice;
  const seed = slice[SEED];

  const defaultOptions = useMemo(
    () => (seed ? getDefaultGlobalOptions(seed) : (undefined as never)),
    [seed],
  );

  const baseSaturation = useMemo(
    () => (seed ? getChromaAsPercentage(seed) : (undefined as never)),
    [seed],
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
        ? CURVE_OPTION_KEYS.some(
            key => !isSameOptionValue(key, globalOptions[key], defaultOptions[key]),
          )
        : (undefined as never),
    [globalOptions, defaultOptions],
  );

  const hasCustomPaletteOptions = useMemo(
    () =>
      globalOptions && defaultOptions
        ? PALETTE_OPTION_KEYS.some(
            key => !isSameOptionValue(key, globalOptions[key], defaultOptions[key]),
          )
        : (undefined as never),
    [globalOptions, defaultOptions],
  );

  const computed: ComputedPaletteValues = {
    baseSaturation,
    defaultOptions,
    generatorUrl,
    hasCustomCurves,
    hasCustomPaletteOptions,
    seedColor: seed ?? (undefined as never),
  };

  const result = {} as Pick<PaletteAggregate, K>;

  for (const key of keys) {
    (result as Record<string, unknown>)[key] = isComputedKey(key)
      ? computed[key]
      : slice[key as StoreKey];
  }

  return result;
}
