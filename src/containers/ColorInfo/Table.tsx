import { useEffect, useRef } from 'react';

import { APCA_LIGHTNESS_CONTRAST } from '~/config/globals';

import type { ScaleOptions, ScaleSteps } from '~/types';

import Row from './Row';

interface TableProps {
  onSelect: (step: string) => void;
  options: ScaleOptions;
  selectedStep: string;
  steps: ScaleSteps;
}

export default function Table({ onSelect, options, selectedStep, steps }: TableProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = containerRef.current?.querySelector<HTMLElement>(`[data-step="${selectedStep}"]`);

    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedStep]);

  return (
    <div ref={containerRef} className="overflow-auto flex-1 min-h-0" data-testid="ColorInfo-Table">
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr className="text-foreground-500 text-xs uppercase tracking-wide">
            <th
              aria-label="Step"
              className="py-2 pr-3 font-normal w-12 sticky top-0 bg-content1 z-10"
            />
            <th className="py-2 pr-3 font-normal sticky top-0 bg-content1 z-10">
              APCA {APCA_LIGHTNESS_CONTRAST}
            </th>
            <th className="py-2 pr-3 font-normal sticky top-0 bg-content1 z-10">Gamut</th>
            <th className="py-2 pr-3 font-normal sticky top-0 bg-content1 z-10">OKLCH</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(steps).map(([step, color]) => (
            <Row
              key={step}
              color={color}
              isLocked={parseInt(step, 10) === options.lock}
              isSelected={step === selectedStep}
              onSelect={onSelect}
              step={step}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
