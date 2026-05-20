import type { CSSProperties } from 'react';
import { cn } from '@heroui/react';
import { apcaContrast, contrast, convertCSS } from 'colorizr';

import { formatOklch } from '~/utils/color';

import type { ApcaThreshold, Guideline, WcagThreshold } from '~/components/ContrastGrid/constants';

import type { Gamut } from '~/types';

interface RowProps {
  cellBase: string;
  entries: Array<[string, string]>;
  failBg: CSSProperties;
  gamut: Gamut;
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
  const { cellBase, entries, failBg, gamut, guideline, rowColor, step, stickyBase, threshold } =
    props;

  const displayRowColor = gamut === 'srgb' ? convertCSS(rowColor, 'hex') : formatOklch(rowColor);

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

        const displayColColor =
          gamut === 'srgb' ? convertCSS(colColor, 'hex') : formatOklch(colColor);
        const ok = passes(guideline, threshold, displayRowColor, displayColColor);

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

        const value = getContrastValue(guideline, displayRowColor, displayColColor);

        return (
          <div
            key={`cell-${colStep}`}
            className={cellBase}
            data-state="pass"
            data-testid="ContrastGrid-Cell"
            style={{ backgroundColor: displayColColor, color: displayRowColor }}
          >
            {formatContrast(guideline, value)}
          </div>
        );
      })}
    </>
  );
}
