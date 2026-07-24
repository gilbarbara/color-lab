import { useEffect, useRef } from 'react';

import { APCA_LIGHTNESS_CONTRAST } from '~/config/globals';
import { prefersReducedMotion } from '~/utils/motion';

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
    const container = containerRef.current;

    // Only scroll when the table is its own scroller (lg layout). On small screens the
    // ModalBody is the scroller, and scrollIntoView would jump the whole modal on open.
    if (!container || container.scrollHeight <= container.clientHeight) {
      return;
    }

    const row = container.querySelector<HTMLElement>(`[data-step="${selectedStep}"]`);

    // An explicit `behavior` wins over the `scroll-behavior` property, so the reduced-motion
    // blanket in index.css can't reach this one — it has to be gated here.
    row?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  }, [selectedStep]);

  return (
    <div ref={containerRef} className="overflow-auto flex-1 min-h-0" data-testid="ColorInfo-Table">
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr className="text-foreground-500 text-xs uppercase tracking-wide">
            <th aria-label="Step" className="sticky top-0 z-10 w-12 bg-content1 py-2 pr-3" />
            <th className="sticky top-0 z-10 bg-content1 py-2 pr-3">
              APCA {APCA_LIGHTNESS_CONTRAST}
            </th>
            <th className="sticky top-0 z-10 bg-content1 py-2 pr-3">Gamut</th>
            <th className="sticky top-0 z-10 bg-content1 py-2 pr-3">OKLCH</th>
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
