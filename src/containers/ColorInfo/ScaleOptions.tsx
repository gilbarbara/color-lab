import { Fragment, type ReactNode } from 'react';
import { round } from '@gilbarbara/helpers';
import { ArrowsOutLineHorizontalIcon, AtIcon, MinusIcon } from '@phosphor-icons/react';

import { CHROMA_PEAK_DEFAULT } from '~/config/scale';
import useGenerator from '~/hooks/useGenerator';
import { isCurvePeak, isSameOptionValue } from '~/utils/scale-options';

import type {
  ColorEntry,
  ColorOverrides,
  GlobalScaleOptions,
  ScaleOptions as ScaleOptionsType,
} from '~/types';

import { SECTION_LABEL } from './constants';

type OptionKey = keyof ScaleOptionsType;
/** The keys a color can actually override — `saturation` is palette-wide, so it is not one. */
type OverridableKey = keyof ColorOverrides;
type RowStatus = 'custom' | 'default' | 'override';

interface Row {
  label: string;
  parts: RowPart[];
  separator?: ReactNode;
}

interface RowPart {
  /** Per-color keys backing this value; they derive the status unless `status` is given. */
  keys: ReadonlyArray<OverridableKey>;
  status?: RowStatus;
  value: string;
}

interface ScaleOptionsProps {
  colorEntry: ColorEntry;
  options: ScaleOptionsType;
}

/**
 * Builds a row for a shape-varying option, resolving per-color `options` over `globalOptions`.
 * Scalar → one value; chroma peak → `amount @ position`; low/high → the two sides of the midpoint
 * anchor, joined by a dot (a split, not a range or a directional sweep).
 */
function optionRow<K extends 'chromaCurve' | 'hueShift' | 'lightnessCurve'>(
  label: string,
  key: K,
  options: ScaleOptionsType,
  globalOptions: GlobalScaleOptions,
  unit = '',
): Row {
  const value = (options[key] as GlobalScaleOptions[K] | undefined) ?? globalOptions[key];
  const part = (text: string): RowPart => ({ keys: [key], value: text });
  const format = (value_: number): string => `${round(value_, 2)}${unit}`;

  if (typeof value === 'number') {
    return { label, parts: [part(format(value))] };
  }

  if (isCurvePeak(value)) {
    return {
      label,
      parts: [
        part(format(value.amount)),
        part(round(value.peak ?? CHROMA_PEAK_DEFAULT, 2).toString()),
      ],
      separator: <AtIcon />,
    };
  }

  return {
    label,
    parts: [part(format(value.low)), part(format(value.high))],
    separator: <ArrowsOutLineHorizontalIcon />,
  };
}

function statusClass(status: RowStatus): string {
  if (status === 'override' || status === 'custom') {
    return 'text-secondary-600';
  }

  return 'text-foreground';
}

export default function ScaleOptions({ colorEntry, options }: ScaleOptionsProps) {
  const { defaultOptions, globalOptions } = useGenerator('defaultOptions', 'globalOptions');
  const overrides = colorEntry.overrides ?? {};

  const resolve = <K extends OptionKey>(key: K): GlobalScaleOptions[K] =>
    (options[key] as GlobalScaleOptions[K] | undefined) ?? globalOptions[key];

  const computeStatus = (keys: ReadonlyArray<OverridableKey>): RowStatus => {
    if (keys.some(k => overrides[k] !== undefined)) {
      return 'override';
    }

    if (keys.some(k => !isSameOptionValue(k, globalOptions[k], defaultOptions[k]))) {
      return 'custom';
    }

    return 'default';
  };

  // Saturation is palette-wide only (no per-color override), and dead state unless overridden.
  const showSaturation = globalOptions.saturationOverride;
  const mode = resolve('mode');
  const variant = resolve('variant');
  const lock = resolve('lock');

  const rows: Row[] = [
    {
      label: 'Steps',
      parts: [{ keys: ['steps'], value: String(resolve('steps')) }],
    },
    {
      label: 'Lightness range',
      parts: [
        { keys: ['minLightness'], value: round(resolve('minLightness'), 3).toString() },
        { keys: ['maxLightness'], value: round(resolve('maxLightness'), 3).toString() },
      ],
      separator: <MinusIcon />,
    },
    optionRow('Lightness curve', 'lightnessCurve', options, globalOptions),
    optionRow('Chroma curve', 'chromaCurve', options, globalOptions),
  ];

  const hueShift = resolve('hueShift');
  const hueShiftActive =
    typeof hueShift === 'number' ? hueShift !== 0 : hueShift.low !== 0 || hueShift.high !== 0;

  if (hueShiftActive || overrides.hueShift !== undefined) {
    rows.push(optionRow('Hue shift', 'hueShift', options, globalOptions, '°'));
  }

  if (showSaturation) {
    rows.push({
      label: 'Saturation',
      // No backing keys: `ColorOverrides` has no `saturation`, so there is nothing per-color to
      // compare. The row only shows when `saturationOverride` is on, which is itself a departure
      // from the default — hence a fixed 'custom' rather than a computed status.
      parts: [{ keys: [], status: 'custom', value: `${globalOptions.saturation}%` }],
    });
  }

  if (mode !== undefined) {
    rows.push({ label: 'Mode', parts: [{ keys: ['mode'], value: String(mode) }] });
  }

  if (variant !== undefined) {
    rows.push({ label: 'Variant', parts: [{ keys: ['variant'], value: String(variant) }] });
  }

  if (lock !== undefined) {
    rows.push({ label: 'Lock', parts: [{ keys: ['lock'], value: String(lock) }] });
  }

  return (
    <section data-testid="ColorInfo-ScaleOptions">
      <p className={`${SECTION_LABEL} mb-3`}>Scale options</p>
      <dl className="grid grid-cols-2 gap-x-6">
        {rows.map(row => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-1 py-2 border-t border-default-100"
          >
            <dt className="text-sm text-foreground-600 leading-tight">{row.label}</dt>
            <dd className="flex items-center text-sm text-right gap-1">
              {row.parts.map((part, index) => {
                const status = part.status ?? computeStatus(part.keys);

                return (
                  // Parts are a fixed, never-reordered positional list, so the index is a stable key.
                  // eslint-disable-next-line react/no-array-index-key
                  <Fragment key={`${part.keys.join('-')}-${index}`}>
                    {index > 0 && <span className="text-foreground">{row.separator}</span>}
                    <span className={statusClass(status)}>{part.value}</span>
                  </Fragment>
                );
              })}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
