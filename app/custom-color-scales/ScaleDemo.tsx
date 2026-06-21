'use client';

import { useMemo, useState } from 'react';
import { objectEntries, round } from '@gilbarbara/helpers';
import { parseCSS, scale } from 'colorizr';

import { getDefaultGlobalOptions } from '~/utils/generator';

import Button from '~/components/Button';
import ChromaChart from '~/containers/ColorCharts/ChromaChart';
import HueChart from '~/containers/ColorCharts/HueChart';
import LightnessChart from '~/containers/ColorCharts/LightnessChart';
import Swatch from '~/containers/Palette/Swatch';

import type { ColorEntry, EffectiveScaleOptions } from '~/types';

import { baseColor, type Variant } from './utils';

const CHARTS = {
  chroma: ChromaChart,
  hue: HueChart,
  lightness: LightnessChart,
} as const;

interface ScaleDemoProps {
  /** Render this chart instead of the swatch scale. Omit to render swatches. */
  chart?: keyof typeof CHARTS;
  /** Swatch step label. Defaults to the step number; `lightness` shows the OKLCH L%. */
  stepLabel?: 'lightness';
  swatchClassName?: string;
  /** One variant → static; multiple → a button per variant. First is the initial state. */
  variants: Variant[];
}

export default function ScaleDemo(props: ScaleDemoProps) {
  const {
    chart,
    stepLabel,
    swatchClassName = 'w-full py-2 transition-colors duration-500',
    variants,
  } = props;
  const [activeKey, setActiveKey] = useState(variants[0].key);

  const variant = variants.find(item => item.key === activeKey) ?? variants[0];

  const options = useMemo<EffectiveScaleOptions>(
    () => ({ ...getDefaultGlobalOptions(baseColor), ...variant.options }),
    [variant],
  );

  const steps = useMemo(() => scale(baseColor, options), [options]);

  const colorEntry = useMemo<ColorEntry>(
    () => ({ id: 'demo', name: variant.key, value: baseColor }),
    [variant.key],
  );

  const Chart = chart ? CHARTS[chart] : null;
  const showButtons = variants.length > 1;

  return (
    <div>
      {Chart ? (
        <Chart colorEntry={colorEntry} options={options} steps={steps} />
      ) : (
        <div className="w-full flex flex-col md:flex-row flex-wrap items-center gap-1 mb-4">
          {objectEntries(steps).map(([step, color]) => (
            <Swatch
              key={step}
              className={swatchClassName}
              color={color}
              interactive={false}
              step={
                stepLabel === 'lightness'
                  ? `${round(parseCSS(color, 'oklch').l * 100, 1)}%`
                  : `${step}`
              }
              stepClassName={stepLabel === 'lightness' ? 'max-lg:text-sm/4' : 'max-md:text-sm/4'}
            />
          ))}
        </div>
      )}
      {showButtons && (
        <div className="flex items-center gap-2 mt-2">
          {variants.map(item => (
            <Button
              key={item.key}
              className="rounded-full px-4"
              onPress={() => setActiveKey(item.key)}
              size="sm"
              variant={item.key === activeKey ? 'solid' : 'flat'}
            >
              {item.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
