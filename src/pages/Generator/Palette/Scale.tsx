import { useMemo } from 'react';
import { scale } from 'colorizr';

import ColorCircle from '~/components/ColorCircle';
import ExportScale from '~/components/ExportScale';

import type { ColorEntry, ScaleOptions } from '~/types';

import Swatch from './Swatch';

interface ScaleProps {
  colorEntry: ColorEntry;
  options: ScaleOptions;
}

export default function Scale(props: ScaleProps) {
  const { colorEntry, options } = props;

  const steps = useMemo(() => scale(colorEntry.value, options), [colorEntry.value, options]);

  return (
    <div className="w-full flex flex-col gap-2" data-uid="Scale">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ColorCircle color={colorEntry.value} />
          <h3 className="font-semibold text-lg">{colorEntry.name}</h3>
        </div>
        <ExportScale name={colorEntry.name} steps={steps} />
      </div>
      <div className="w-full flex flex-col lg:flex-row flex-wrap gap-1 overflow-x-auto">
        {Object.entries(steps).map(([step, color]) => (
          <Swatch key={step} color={color} lock={options.lock} step={step} />
        ))}
      </div>
    </div>
  );
}
