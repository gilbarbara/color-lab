import { type CSSProperties, useMemo } from 'react';
import { cn } from '@heroui/react';

import type { ScaleSteps } from '~/types';

import type { ApcaThreshold, Guideline, WcagThreshold } from './constants';
import Row from './Row';

interface GridProps {
  guideline: Guideline;
  steps: ScaleSteps;
  threshold: ApcaThreshold | WcagThreshold;
}

export default function Grid(props: GridProps) {
  const { guideline, steps, threshold } = props;

  const entries = useMemo(() => Object.entries(steps), [steps]);

  const cellBase = 'size-12 rounded-md flex items-center justify-center text-xs font-medium';
  const stickyBase = 'bg-content1';

  const failBg: CSSProperties = {
    backgroundImage:
      'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 4px, transparent 4px 8px)',
  };

  return (
    <div className="min-w-0 flex-1 overflow-auto max-h-[70vh]" data-testid="ContrastGrid-Grid">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${entries.length + 1}, 48px)`,
          gap: '4px',
          width: 'max-content',
        }}
      >
        <div className={`${cellBase} ${stickyBase} sticky top-0 left-0 z-30`} />
        {entries.map(([step]) => (
          <div
            key={`col-${step}`}
            className={cn(cellBase, stickyBase, 'sticky top-0 z-20 rounded-none')}
          >
            {step}
          </div>
        ))}

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
