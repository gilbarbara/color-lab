import type { ColorEntry, EffectiveScaleOptions, ScaleSteps } from '~/types';

export interface ColorChartsProps {
  colorEntry: ColorEntry;
  options: EffectiveScaleOptions;
  steps: ScaleSteps;
}

export interface ScaleChartComponentProps {
  className?: string;
  colorEntry: ColorEntry;
  options: EffectiveScaleOptions;
  steps: ScaleSteps;
}
