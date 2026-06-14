import { memo, useMemo } from 'react';
import { scale } from 'colorizr';

import useGenerator from '~/hooks/useGenerator';
import useScrollToColor from '~/hooks/useScrollToColor';
import { formatOklch } from '~/utils/color';

import Collapse from '~/components/Collapse';
import ColorBox from '~/components/ColorBox';
import ColorCharts from '~/containers/ColorCharts';
import ColorChartsButton from '~/containers/ColorCharts/Button';
import ColorInfo from '~/containers/ColorInfo';
import ContrastGrid from '~/containers/ContrastGrid';
import ExportScale from '~/containers/ExportScale';
import PreviewButton from '~/containers/Preview/Button';

import type { ColorEntry, EffectiveScaleOptions, ScaleOptions } from '~/types';

import Swatch from './Swatch';

interface ScaleProps {
  colorEntry: ColorEntry;
  options: EffectiveScaleOptions;
}

// `colorEntry` keeps its reference across store updates that don't touch it
// (see `updateColor`), so only the edited color re-renders. `options` is rebuilt
// every render from globalOptions, so compare it by value across its flat keys.
function arePropsEqual(previous: ScaleProps, next: ScaleProps): boolean {
  if (previous.colorEntry !== next.colorEntry) {
    return false;
  }

  const previousKeys = Object.keys(previous.options) as Array<keyof ScaleOptions>;

  return (
    previousKeys.length === Object.keys(next.options).length &&
    previousKeys.every(key => previous.options[key] === next.options[key])
  );
}

function Scale(props: ScaleProps) {
  const { colorEntry, options } = props;
  const scrollToColor = useScrollToColor();
  const { chartColorIds } = useGenerator('chartColorIds');
  const showGraphs = chartColorIds.has(colorEntry.id);

  const steps = useMemo(() => scale(colorEntry.value, options), [colorEntry.value, options]);

  return (
    <div className="w-full flex flex-col gap-4" data-testid="Scale">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ColorBox
            aria-label={`Select ${colorEntry.name}`}
            color={colorEntry.value}
            onClick={() => scrollToColor(colorEntry.id)}
            size="sm"
          />
          <h3 className="font-semibold text-lg leading-none">{colorEntry.name}</h3>
          <p className="hidden lg:block text-foreground-500 font-mono text-sm">
            {formatOklch(colorEntry.value)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PreviewButton id={colorEntry.id} />
          <ColorChartsButton id={colorEntry.id} />
          <ColorInfo colorEntry={colorEntry} options={options} steps={steps} />
          <ContrastGrid colorEntry={colorEntry} steps={steps} />
          <ExportScale name={colorEntry.name} steps={steps} />
        </div>
      </div>
      <div className="w-full flex flex-col @xl:flex-row flex-wrap gap-1 overflow-x-auto">
        {Object.entries(steps).map(([step, color]) => (
          <Swatch key={step} color={color} lock={options.lock} step={step} />
        ))}
      </div>
      <Collapse isOpen={showGraphs}>
        <ColorCharts colorEntry={colorEntry} options={options} steps={steps} />
      </Collapse>
    </div>
  );
}

export default memo(Scale, arePropsEqual);
