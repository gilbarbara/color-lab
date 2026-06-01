import { scale } from 'colorizr';

import { DEFAULT_COLOR_NAMES } from '~/config/globals';
import { toOklch } from '~/utils/color';
import { createPalette } from '~/utils/generator';

import type { ColorEntry, GeneratorState, ScaleSteps } from '~/types';

// Storage invariant: ColorEntry.value is always an OKLCH CSS string.
// These constants are the literal formatCSS(parseCSS(<hex>, 'oklch'), { format: 'oklch' })
// outputs for the legacy hex values previously scattered across tests.
// toOklch() validates at module load — a typo here throws immediately.

export const RED = toOklch('oklch(70.2% 0.236 30)');
export const ORANGE = toOklch('oklch(70.2% 0.183 60)');
export const YELLOW = toOklch('oklch(70.2% 0.161 90)');
export const CHARTREUSE = toOklch('oklch(70.2% 0.189 120)');
export const GREEN = toOklch('oklch(70.2% 0.265 150)');
export const CYAN = toOklch('oklch(70.2% 0.168 180)');
export const AZURE = toOklch('oklch(70.2% 0.157 210)');
export const BLUE = toOklch('oklch(70.2% 0.183 240)');
export const VIOLET = toOklch('oklch(70.2% 0.163 270)');
export const PLUM = toOklch('oklch(70.2% 0.196 300)');

export const CRIMSON = toOklch('oklch(63.27% 0.254 19.9)');
export const CRIMSON_DARK = toOklch('oklch(8% 0.254 19.9)');
export const CRIMSON_LIGHT = toOklch('oklch(94% 0.254 19.9)');
export const DARK_BLUE = toOklch('oklch(45.2% 0.313 264.05)');

export const WHITE = toOklch('oklch(100% 0 none)'); // ex-#FFFFFF
export const BLACK = toOklch('oklch(0% 0 none)'); // ex-#000000
export const GRAY = toOklch('oklch(59.99% 0 none)'); // ex-#808080
export const SLATE = toOklch('oklch(31.92% 0.072 251.17)');

export const PALETTE = [RED, ORANGE, YELLOW, CHARTREUSE, GREEN, CYAN, AZURE, BLUE, VIOLET, PLUM];

export const CRIMSON_SCALE: ScaleSteps = scale(CRIMSON);
export const PLUM_SCALE: ScaleSteps = scale(PLUM);
export const BLUE_SCALE: ScaleSteps = scale(BLUE);

export function createColorEntry(
  name: string,
  value: string,
  overrides?: ColorEntry['overrides'],
): ColorEntry {
  return {
    id: crypto.randomUUID(),
    name,
    value: toOklch(value),
    ...(overrides && { overrides }),
  };
}

export function createTestPalette(colorCount: number = 1): GeneratorState {
  return {
    ...createPalette(PALETTE[0]),
    colors: Array.from({ length: colorCount }, (_, index) =>
      createColorEntry(DEFAULT_COLOR_NAMES[index] || `Color ${index + 1}`, PALETTE[index]),
    ),
  };
}
