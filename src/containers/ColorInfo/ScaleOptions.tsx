import { round } from '@gilbarbara/helpers';

import useGenerator from '~/hooks/useGenerator';

import type { ColorEntry, GlobalScaleOptions, ScaleOptions as ScaleOptionsType } from '~/types';

import { SECTION_LABEL } from './constants';

type OptionKey = keyof ScaleOptionsType;
type RowStatus = 'custom' | 'default' | 'override';

interface Row {
  label: string;
  parts: RowPart[];
  separator?: string;
}

interface RowPart {
  keys: ReadonlyArray<OptionKey>;
  status?: RowStatus;
  value: string;
}

interface ScaleOptionsProps {
  colorEntry: ColorEntry;
  options: ScaleOptionsType;
}

function statusClass(status: RowStatus): string {
  if (status === 'override' || status === 'custom') {
    return 'text-warning font-bold';
  }

  return 'text-foreground-500';
}

export default function ScaleOptions({ colorEntry, options }: ScaleOptionsProps) {
  const { defaultOptions, globalOptions } = useGenerator('defaultOptions', 'globalOptions');
  const overrides = colorEntry.overrides ?? {};

  const resolve = <K extends OptionKey>(key: K): GlobalScaleOptions[K] =>
    (options[key] as GlobalScaleOptions[K] | undefined) ?? globalOptions[key];

  const computeStatus = (keys: ReadonlyArray<OptionKey>): RowStatus => {
    if (keys.some(k => overrides[k] !== undefined)) {
      return 'override';
    }

    if (keys.some(k => globalOptions[k] !== defaultOptions[k])) {
      return 'custom';
    }

    return 'default';
  };

  const showSaturation = globalOptions.saturationOverride || overrides.saturation !== undefined;
  const saturationValue = overrides.saturation ?? globalOptions.saturation;
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
      separator: ' ~ ',
    },
    {
      label: 'Lightness curve',
      parts: [{ keys: ['lightnessCurve'], value: round(resolve('lightnessCurve'), 2).toString() }],
    },
    {
      label: 'Chroma curve',
      parts: [{ keys: ['chromaCurve'], value: round(resolve('chromaCurve'), 2).toString() }],
    },
  ];

  if (showSaturation) {
    rows.push({
      label: 'Saturation',
      parts: [
        {
          keys: ['saturation'],
          status: overrides.saturation !== undefined ? 'override' : 'custom',
          value: `${saturationValue}%`,
        },
      ],
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
            className="flex items-center justify-between py-2 border-t border-default-100"
          >
            <dt className="text-sm flex items-center gap-2">
              <span>{row.label}</span>
            </dt>
            <dd className="text-sm text-right">
              {row.parts.map((part, index) => {
                const status = part.status ?? computeStatus(part.keys);

                return (
                  <span key={part.keys.join('-')}>
                    {index > 0 && (
                      <span className="text-foreground-500">{row.separator ?? ' '}</span>
                    )}
                    <span className={statusClass(status)}>{part.value}</span>
                  </span>
                );
              })}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
