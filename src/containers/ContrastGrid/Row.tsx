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

  const unit = guideline === 'wcag2' ? 'ratio' : 'Lc';
  // `all` shows every pair without grading any of them, so `passes` returns true across the board.
  // Announcing that as "pass" would claim a verdict the UI never makes — an Lc 0 pair is not a pass.
  const grades = threshold !== 'all';

  return (
    <div role="row" style={{ display: 'contents' }}>
      <div
        aria-label={`Text ${step}`}
        className={cn(cellBase, stickyBase, 'sticky left-0 z-10 rounded-none')}
        role="rowheader"
      >
        {step}
      </div>
      {entries.map(([colStep, colColor]) => {
        if (rowColor === colColor) {
          return (
            <div
              key={`cell-${colStep}`}
              aria-label={`Text ${step} on background ${colStep}: same color`}
              className={`${cellBase} text-foreground-400`}
              data-state="identity"
              data-testid="ContrastGrid-Cell"
              role="cell"
            >
              —
            </div>
          );
        }

        const ok = passes(guideline, threshold, rowColor, colColor);
        const value = getContrastValue(guideline, rowColor, colColor);
        const score = formatContrast(guideline, value);
        const outcome = grades ? `, ${ok ? 'pass' : 'fail'}` : '';
        const label = `Text ${step} on background ${colStep}: ${unit} ${score}${outcome}`;

        // A failing cell still renders its score — it used to be an empty striped div, which made
        // the failing pairs unreadable to everyone, not only to a screen reader.
        if (!ok) {
          return (
            <div
              key={`cell-${colStep}`}
              aria-label={label}
              className={cn(cellBase, 'text-foreground-400')}
              data-state="fail"
              data-testid="ContrastGrid-Cell"
              role="cell"
              style={failBg}
            >
              {score}
            </div>
          );
        }

        const colOklch = formatOklch(colColor);
        const colHex = convertCSS(colColor, 'hex');

        return (
          <div
            key={`cell-${colStep}`}
            aria-label={label}
            className={cn(
              cellBase,
              'bg-(--gamut-bg-oklch) text-(--gamut-fg-oklch)',
              'gamut-srgb:bg-(--gamut-bg-hex) gamut-srgb:text-(--gamut-fg-hex)',
            )}
            data-state="pass"
            data-testid="ContrastGrid-Cell"
            role="cell"
            style={
              {
                '--gamut-bg-oklch': colOklch,
                '--gamut-bg-hex': colHex,
                '--gamut-fg-oklch': rowOklch,
                '--gamut-fg-hex': rowHex,
              } as CSSProperties
            }
          >
            {score}
          </div>
        );
      })}
    </div>
  );
}
