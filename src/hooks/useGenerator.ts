import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { CURVE_OPTION_KEYS, PALETTE_OPTION_KEYS } from '~/config/scale';
import useGeneratorStore from '~/hooks/useGeneratorStore';
import { type GeneratorStore } from '~/stores/generatorStore';
import { getChromaAsPercentage } from '~/utils/color';
import { getDefaultGlobalOptions, getUsedGroups } from '~/utils/generator';
import { isSameOptionValue } from '~/utils/scale-options';
import { serializePaletteToUrl } from '~/utils/url';

import type { ColorEntry, ColorGroup, DefaultScaleOptions, OklchString } from '~/types';

type ComputedKey = keyof ComputedPaletteValues;

type PaletteAggregate = ComputedPaletteValues & GeneratorStore;
type StoreKey = keyof GeneratorStore;
type UsePaletteKey = keyof PaletteAggregate;
interface ComputedPaletteValues {
  baseSaturation: number;
  colorCount: number;
  defaultOptions: DefaultScaleOptions;
  generatorUrl: string;
  hasCustomCurves: boolean;
  hasCustomPaletteOptions: boolean;
  seedColor: OklchString;
  usedGroups: ColorGroup[];
}

// Synthetic slice dependencies: primitive projections of `colors`.
//
// `colors` gets a new array identity on every edit — including every frame of a slider drag —
// so any consumer selecting it re-renders constantly. Most don't need the colors at all, only a
// narrow fact about them: the seed, how many there are, which groups are in use.
//
// Each projection MUST return a primitive. `useShallow` compares the selected slice one level
// deep with `Object.is`, so a derived *array* (a fresh reference every call) never compares equal
// — the snapshot `useSyncExternalStore` reads is unstable and React loops until it throws
// "Maximum update depth exceeded". A primitive is what makes the narrowing stick, and it is
// load-bearing for correctness, not just for render count. Each computed value derives back from
// its projection with `useMemo`.
//
// `generatorUrl` is the exception: it serializes every color, so it genuinely depends on `colors`.
const SEED = '__seedColor';
const COLOR_COUNT = '__colorCount';
const USED_GROUPS = '__usedGroups';

const COLOR_PROJECTIONS = {
  [SEED]: (colors: ColorEntry[]) => colors[0]?.value,
  [COLOR_COUNT]: (colors: ColorEntry[]) => colors.length,
  // getUsedGroups returns COLOR_GROUPS order, deduped — so an unchanged set yields an
  // identical string, and a value-only edit never re-renders the consumer.
  [USED_GROUPS]: (colors: ColorEntry[]) => getUsedGroups(colors).join(','),
} as const;

type ProjectionKey = keyof typeof COLOR_PROJECTIONS;
type Projections = {
  [K in ProjectionKey]?: ReturnType<(typeof COLOR_PROJECTIONS)[K]>;
};

type SliceDep = StoreKey | ProjectionKey;

function isProjectionKey(key: SliceDep): key is ProjectionKey {
  return Object.hasOwn(COLOR_PROJECTIONS, key);
}

const COMPUTED_DEPS = {
  baseSaturation: [SEED],
  colorCount: [COLOR_COUNT],
  defaultOptions: [SEED],
  generatorUrl: ['colors', 'globalOptions'],
  hasCustomCurves: [SEED, 'globalOptions'],
  hasCustomPaletteOptions: [SEED, 'globalOptions'],
  seedColor: [SEED],
  usedGroups: [USED_GROUPS],
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
      const out = {} as Partial<GeneratorStore> & Projections;

      sliceDeps.forEach(k => {
        (out as Record<string, unknown>)[k] = isProjectionKey(k)
          ? COLOR_PROJECTIONS[k](state.colors)
          : state[k];
      });

      return out;
    }),
  );

  const { colors, globalOptions } = slice;
  const seed = slice[SEED];
  const usedGroupsKey = slice[USED_GROUPS];

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
            key =>
              // `saturation` is only live while overridden (see GlobalScaleOptions); a value left
              // behind by a since-removed first color is dead state, not a customization.
              (key !== 'saturation' || globalOptions.saturationOverride) &&
              !isSameOptionValue(key, globalOptions[key], defaultOptions[key]),
          )
        : (undefined as never),
    [globalOptions, defaultOptions],
  );

  // `''.split(',')` yields `['']`, not `[]` — an empty projection means no groups are in use.
  const usedGroups = useMemo(
    () => (usedGroupsKey ? (usedGroupsKey.split(',') as ColorGroup[]) : []),
    [usedGroupsKey],
  );

  const computed: ComputedPaletteValues = {
    baseSaturation,
    colorCount: slice[COLOR_COUNT] ?? (undefined as never),
    defaultOptions,
    generatorUrl,
    hasCustomCurves,
    hasCustomPaletteOptions,
    seedColor: seed ?? (undefined as never),
    usedGroups,
  };

  const result = {} as Pick<PaletteAggregate, K>;

  for (const key of keys) {
    (result as Record<string, unknown>)[key] = isComputedKey(key)
      ? computed[key]
      : slice[key as StoreKey];
  }

  return result;
}
