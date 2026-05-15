import { useMemo } from 'react';
import { scale } from 'colorizr';

import ColorBox from '~/components/ColorBox';
import ColorInfo from '~/components/ColorInfo';
import ContrastGrid from '~/components/ContrastGrid';
import ExportScale from '~/components/ExportScale';
import PreviewButton from '~/components/Preview/Button';

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
    <div className="w-full flex flex-col gap-4" data-testid="Scale">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ColorBox as="span" color={colorEntry.value} size="sm" />
          <h3 className="font-semibold text-lg leading-none">{colorEntry.name}</h3>
          <p className="hidden lg:block text-foreground-500 font-mono text-sm">
            {colorEntry.value}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PreviewButton id={colorEntry.id} />
          <ColorInfo colorEntry={colorEntry} options={options} steps={steps} />
          <ContrastGrid colorEntry={colorEntry} steps={steps} />
          <ExportScale name={colorEntry.name} steps={steps} />
        </div>
      </div>
      <div className="w-full flex flex-col lg:flex-row flex-wrap gap-1 overflow-x-auto">
        {Object.entries(steps).map(([step, color]) => (
          <Swatch key={step} color={color} lock={options.lock} step={step} />
        ))}
      </div>
    </div>
  );
}
