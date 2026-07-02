import { parseCSS } from 'colorizr';

import { trackEvent } from '~/utils/analytics';

import type { ScaleSteps } from '~/types';

import { SECTION_LABEL } from './constants';

interface ChromaChartProps {
  onSelect: (step: string) => void;
  selectedStep: string;
  steps: ScaleSteps;
}

const MIN_BAR_HEIGHT = 4;
const CHART_HEIGHT = 192;
const MAX_BAR_WIDTH = 32;

export default function ChromaDistributionChart({
  onSelect,
  selectedStep,
  steps,
}: ChromaChartProps) {
  const entries = Object.entries(steps);
  const chromas = entries.map(([, color]) => parseCSS(color, 'oklch').c);
  const maxChroma = Math.max(...chromas, 0.001);
  const columns = entries.length;

  return (
    <section data-testid="ColorInfo-ChromaDistributionChart">
      <p className={`${SECTION_LABEL} mb-3`}>Chroma distribution</p>
      <div
        className="grid items-end gap-1 justify-center"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, ${MAX_BAR_WIDTH}px))`,
          height: CHART_HEIGHT,
        }}
      >
        {entries.map(([step, color], index) => {
          const chroma = chromas[index];
          const heightPct = (chroma / maxChroma) * 100;
          const isSelected = step === selectedStep;

          return (
            <button
              key={step}
              aria-label={`Step ${step}, chroma ${chroma.toFixed(3)}`}
              aria-pressed={isSelected}
              className={`w-full rounded-t-sm transition-opacity cursor-pointer ${
                isSelected ? 'ring-1 ring-current/50' : 'hover:opacity-100'
              }`}
              data-testid="ColorInfo-ChromaDistributionChart-Bar"
              onClick={() => {
                trackEvent('info:select_step', { source: 'chart', step });
                onSelect(step);
              }}
              style={{
                backgroundColor: color,
                height: `max(${MIN_BAR_HEIGHT}px, ${heightPct}%)`,
              }}
              type="button"
            />
          );
        })}
      </div>
      <div
        className="grid gap-1 mt-2 justify-center"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, ${MAX_BAR_WIDTH}px))` }}
      >
        {entries.map(([step]) => {
          const isSelected = step === selectedStep;

          return (
            <span
              key={step}
              className={`text-center text-[10px] tabular-nums ${
                isSelected ? 'text-foreground font-semibold' : 'text-foreground-500'
              }`}
            >
              {step}
            </span>
          );
        })}
      </div>
    </section>
  );
}
