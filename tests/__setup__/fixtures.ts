import { scale } from 'colorizr';

import { toOklch } from '~/utils/color';

import type { OklchString, ScaleSteps } from '~/types';

// Storage invariant: ColorEntry.value is always an OKLCH CSS string.
// These constants are the literal formatCSS(parseCSS(<hex>, 'oklch'), { format: 'oklch' })
// outputs for the legacy hex values previously scattered across tests.
// toOklch() validates at module load — a typo here throws immediately.

export const BLUE: OklchString = toOklch('oklch(45.201% 0.31321 264.05)'); // ex-#0000FF
export const CRIMSON: OklchString = toOklch('oklch(63.269% 0.25404 19.902)'); // ex-#FF0044
export const GREEN: OklchString = toOklch('oklch(86.644% 0.29483 142.5)'); // ex-#00FF00
export const PLUM: OklchString = toOklch('oklch(66.724% 0.1953 333.92)');
export const RED: OklchString = toOklch('oklch(62.796% 0.25768 29.234)'); // ex-#FF0000
export const SKY_BLUE: OklchString = toOklch('oklch(68.469% 0.14787 237.32)'); // ex-#0066FF

export const WHITE: OklchString = toOklch('oklch(100% 0 none)'); // ex-#FFFFFF
export const GRAY: OklchString = toOklch('oklch(59.987% 0 none)'); // ex-#808080
export const SLATE: OklchString = toOklch('oklch(31.917% 0.07245 251.17)'); // ex-#123456

export const CRIMSON_SCALE: ScaleSteps = scale(CRIMSON);
export const PLUM_SCALE: ScaleSteps = scale(PLUM);
export const SKY_SCALE: ScaleSteps = scale(SKY_BLUE);
