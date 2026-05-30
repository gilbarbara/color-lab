import type { CSSProperties } from 'react';
import { cn } from '@heroui/react';
import { apcaContrast, contrast, convertCSS } from 'colorizr';

import { formatOklch } from '~/utils/color';

import type { ApcaThreshold, Guideline, WcagThreshold } from './constants';

interface RowProps {
  cellBase: string;
  entries: Array<[string, string]>;
  failBg: CSSProperties;
  guideline: Guideline;
  rowColor: string;
  step: string;
  stickyBase: string;
  threshold: ApcaThreshold | WcagThreshold;
}

function formatContrast(guideline: Guideline, value: number): string {
  if (guideline === 'wcag2') {
    return value.toFixed(1);
  }

  return Math.round(value).toString();
}

function getContrastValue(guideline: Guideline, fg: string, bg: string): number {
  if (guideline === 'wcag2') {
    return contrast(fg, bg);
  }

  return Math.abs(apcaContrast(bg, fg));
}

function passes(
  guideline: Guideline,
  threshold: ApcaThreshold | WcagThreshold,
  fg: string,
  bg: string,
): boolean {
  if (threshold === 'all') {
    return true;
  }

  if (fg === bg) {
    return false;
  }

  return getContrastValue(guideline, fg, bg) >= (threshold as number);
}

export default function Row(props: RowProps) {
  const { cellBase, entries, failBg, guideline, rowColor, step, stickyBase, threshold } = props;

  // Contrast math uses the canonical color string. Output is the same within
  // perceptual tolerance regardless of hex vs oklch round-trip, so it does not
  // need to be gamut-aware. Visual paint goes through CSS vars below.
  const rowOklch = formatOklch(rowColor);
  const rowHex = convertCSS(rowColor, 'hex');

  return (
    <>
      <div className={cn(cellBase, stickyBase, 'sticky left-0 z-10 rounded-none')}>{step}</div>
      {entries.map(([colStep, colColor]) => {
        if (rowColor === colColor) {
          return (
            <div
              key={`cell-${colStep}`}
              className={`${cellBase} text-foreground-400`}
              data-state="identity"
              data-testid="ContrastGrid-Cell"
            >
              —
            </div>
          );
        }

        const ok = passes(guideline, threshold, rowColor, colColor);

        if (!ok) {
          return (
            <div
              key={`cell-${colStep}`}
              className={cellBase}
              data-state="fail"
              data-testid="ContrastGrid-Cell"
              style={failBg}
            />
          );
        }

        const value = getContrastValue(guideline, rowColor, colColor);
        const colOklch = formatOklch(colColor);
        const colHex = convertCSS(colColor, 'hex');

        return (
          <div
            key={`cell-${colStep}`}
            className={cn(
              cellBase,
              'bg-(--gamut-bg-oklch) text-(--gamut-fg-oklch)',
              'gamut-srgb:bg-(--gamut-bg-hex) gamut-srgb:text-(--gamut-fg-hex)',
            )}
            data-state="pass"
            data-testid="ContrastGrid-Cell"
            style={
              {
                '--gamut-bg-oklch': colOklch,
                '--gamut-bg-hex': colHex,
                '--gamut-fg-oklch': rowOklch,
                '--gamut-fg-hex': rowHex,
              } as CSSProperties
            }
          >
            {formatContrast(guideline, value)}
          </div>
        );
      })}
    </>
  );
}
