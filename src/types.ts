import type { SwatchOptions } from 'colorizr';

export interface GeneratorState extends Omit<SwatchOptions, 'scale'> {
  color: string;
  lightnessFactor: number;
  maxLightness: number;
  minLightness: number;
  steps: number;
}
