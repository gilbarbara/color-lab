import { useMemo } from 'react';

import TooltipClickable from '~/components/TooltipClickable';

import type { ScaleChartComponentProps } from './types';
import { PAD_Y, parseSteps } from './utils';

const Y_TICKS = [0, 50, 100];

/** Vertical position (0–100) for a lightness percentage on a fixed 0–100 scale. */
function yFor(lightness: number) {
  return PAD_Y + (1 - lightness / 100) * (100 - 2 * PAD_Y);
}

/**
 * Lightness across the scale vs an even (linear) reference. The gap between the
 * two shows how the lightness curve biases steps lighter or darker — bunching
 * that's hard to read from the swatches alone. Read straight from the generated
 * steps, so it reflects mode and locked steps.
 */
export default function LightnessChart(props: ScaleChartComponentProps) {
  const { className, steps } = props;

  const { actual, dots, reference } = useMemo(() => {
    const points = parseSteps(steps).map(step => ({
      label: step.label,
      lightness: step.l * 100,
      x: step.t * 100,
      y: yFor(step.l * 100),
    }));
    const last = points.length - 1;

    // Even (linear) baseline: a straight line from the lightest to the darkest step.
    const reference_ =
      last > 0
        ? `0,${yFor(points[0].lightness)} 100,${yFor(points[last].lightness)}`
        : `0,${points[0] ? yFor(points[0].lightness) : 50} 100,${points[0] ? yFor(points[0].lightness) : 50}`;

    return {
      actual: points.map(point => `${point.x},${point.y}`).join(' '),
      dots: points,
      reference: reference_,
    };
  }, [steps]);

  return (
    <div className={className}>
      <div className="w-full h-32 flex gap-3">
        {/* Y axis: lightness % labels at their gridline height (fixed 0–100) */}
        <div className="relative w-9 shrink-0">
          {Y_TICKS.map(value => (
            <span
              key={value}
              className="absolute right-1 -translate-y-1/2 text-tiny leading-none text-foreground-400"
              style={{ top: `${yFor(value)}%` }}
            >
              {value}
            </span>
          ))}
        </div>

        <div className="relative flex-1 overflow-visible">
          <svg
            aria-hidden="true"
            className="block size-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {Y_TICKS.map(value => (
              <line
                key={value}
                className="text-foreground/10"
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                x1="0"
                x2="100"
                y1={yFor(value)}
                y2={yFor(value)}
              />
            ))}

            <polyline
              className="text-foreground-400"
              fill="none"
              points={reference}
              stroke="currentColor"
              strokeDasharray="3 3"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />

            <polyline
              className="text-secondary"
              fill="none"
              points={actual}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Lightness dots at each step */}
          {dots.map((dot, index) => (
            <TooltipClickable
              key={dot.label ?? index}
              aria-label={`Step ${dot.label}: lightness ${dot.lightness.toFixed(0)}%`}
              className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary ring-1 ring-content1 transition-transform hover:scale-150"
              content={`${dot.label} · ${dot.lightness.toFixed(0)}%`}
              placement="top"
              style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
            >
              {null}
            </TooltipClickable>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm mt-1">
        <div className="text-secondary">▬ lightness</div>
        <div className="text-foreground-400">┄ even</div>
      </div>
    </div>
  );
}
