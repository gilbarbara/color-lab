import type { CSSProperties } from 'react';
import { type ColorType, readableColor, scale } from 'colorizr';

const STOP_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

type Mode = 'light' | 'dark';

export function buildPreviewScope(
  color: string,
  mode: Mode,
  colorMode: ColorType = 'oklch',
): CSSProperties {
  const steps = scale(color, { steps: 10, mode, lock: 500, format: colorMode });
  const base = steps[500];
  const vars: Record<string, string> = {};

  for (const stop of STOP_KEYS) {
    vars[`--color-preview-${stop}`] = steps[stop];
  }

  vars['--color-preview'] = base;
  vars['--color-preview-foreground'] = readableColor(base, 'apca');

  return vars as CSSProperties;
}
