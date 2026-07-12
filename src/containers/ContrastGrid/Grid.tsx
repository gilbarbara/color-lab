import { type CSSProperties, useMemo } from 'react';
import { cn } from '@heroui/react';

import type { ScaleSteps } from '~/types';

import type { ApcaThreshold, Guideline, WcagThreshold } from './constants';
import Row from './Row';

interface GridProps {
  guideline: Guideline;
  name: string;
  steps: ScaleSteps;
  threshold: ApcaThreshold | WcagThreshold;
}

export default function Grid(props: GridProps) {
  const { guideline, name, steps, threshold } = props;

  const entries = useMemo(() => Object.entries(steps), [steps]);

  const cellBase = 'size-12 rounded-md flex items-center justify-center text-xs font-medium';
  const stickyBase = 'bg-content1';

  const failBg: CSSProperties = {
    backgroundImage:
      'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 4px, transparent 4px 8px)',
  };

  return (
    <div className="min-w-0 flex-1 overflow-auto max-h-[70vh]" data-testid="ContrastGrid-Grid">
      {/* `display: contents` on each row keeps the flat CSS grid layout while still exposing
          row semantics — without it the cells have no row to belong to and the whole matrix is
          unreadable to a screen reader.
          `table`, not `grid`: `grid` is a composite widget whose contract includes managed focus and
          two-dimensional arrow-key navigation. No cell here is focusable, so `grid` would promise an
          interaction that does not exist. */}
      <div
        aria-label={`Contrast grid for ${name}. Rows are text, columns are background.`}
        role="table"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${entries.length + 1}, 48px)`,
          gap: '4px',
          width: 'max-content',
        }}
      >
        <div role="row" style={{ display: 'contents' }}>
          <div
            aria-label="Step"
            className={`${cellBase} ${stickyBase} sticky top-0 left-0 z-30`}
            role="columnheader"
          />
          {entries.map(([step]) => (
            <div
              key={`col-${step}`}
              aria-label={`Background ${step}`}
              className={cn(cellBase, stickyBase, 'sticky top-0 z-20 rounded-none')}
              role="columnheader"
            >
              {step}
            </div>
          ))}
        </div>

        {entries.map(([rowStep, rowColor]) => (
          <Row
            key={`row-${rowStep}`}
            cellBase={cellBase}
            entries={entries}
            failBg={failBg}
            guideline={guideline}
            rowColor={rowColor}
            step={rowStep}
            stickyBase={stickyBase}
            threshold={threshold}
          />
        ))}
      </div>
    </div>
  );
}
