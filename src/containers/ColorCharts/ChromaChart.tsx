import { useMemo } from 'react';
import { clamp } from '@gilbarbara/helpers';
import { getP3MaxChroma, parseCSS } from 'colorizr';

import { normalizeChromaCurve, parabolicScale } from '~/utils/scale-options';

import TooltipClickable from '~/components/TooltipClickable';

import type { ScaleChartComponentProps } from './types';
import { getAnchorT, PAD_Y, parseSteps, rangeFractionAt } from './utils';

// Chroma gridline intervals; the smallest one that keeps ≤4 lines is used.
const TICK_INTERVALS = [0.05, 0.1, 0.2, 0.25, 0.5];

function getChromaTicks(maxY: number) {
  const interval = TICK_INTERVALS.find(step => maxY / step <= 4) ?? maxY;
  const ticks: Array<number> = [];

  for (let value = 0; value <= maxY + 1e-9; value += interval) {
    ticks.push(value);
  }

  return ticks;
}

/** Vertical position (0–100) for a chroma value, matching the polyline mapping. */
function yFor(value: number, maxY: number) {
  return PAD_Y + (1 - value / maxY) * (100 - 2 * PAD_Y);
}

/**
 * Chroma across the scale for a specific hue: the P3 gamut ceiling, what the
 * chroma curve requests, and what survives the clamp (the actual output). The
 * ceiling and actual come straight from the generated steps (so they reflect mode
 * and locked steps); the chroma curve line is derived at each step's real lightness.
 * Hue-specific, so it belongs next to a color editor, not a global slider.
 */
export default function ChromaChart(props: ScaleChartComponentProps) {
  const { className, colorEntry, options, steps } = props;

  const { c: baseC, h: baseH, l: inputL } = parseCSS(colorEntry.value, 'oklch');

  const { chromaCurve, lock } = options;
  const chroma = normalizeChromaCurve(chromaCurve);

  const { actual, ceiling, curve, dots, maxY, ticks } = useMemo(() => {
    const parsed = parseSteps(steps);
    const anchorT = getAnchorT(parsed.length, lock);
    // Endpoints "mid" = the input color's own fraction of the gamut ceiling at
    // its lightness/hue, matching scale()'s baseChroma / getP3MaxChroma(lch).
    const inputCeil = getP3MaxChroma({ l: inputL, c: 0, h: baseH });
    const mid = inputCeil > 0 ? clamp(baseC / inputCeil, 0, 1) : 0;

    const points = parsed.map(step => {
      const ceil = getP3MaxChroma({ l: step.l, c: 0, h: step.h });
      const curveValue =
        chroma.type === 'range'
          ? rangeFractionAt(step.t, anchorT, chroma.low, mid, chroma.high) * ceil
          : baseC * parabolicScale(step.l, chroma.amount, chroma.peak);

      return { ceil, curveValue, label: step.label, output: step.c, t: step.t };
    });

    const max = Math.max(...points.map(point => point.ceil), baseC) || 1;
    const toPoint = (t: number, value: number) => `${t * 100},${yFor(value, max)}`;

    return {
      actual: points.map(point => toPoint(point.t, point.output)).join(' '),
      ceiling: points.map(point => toPoint(point.t, point.ceil)).join(' '),
      curve: points.map(point => toPoint(point.t, point.curveValue)).join(' '),
      // Dots sit at the real step positions (3–20), aligned with the swatch row.
      dots: points.map(point => ({
        label: point.label,
        output: point.output,
        x: point.t * 100,
        y: yFor(point.output, max),
      })),
      maxY: max,
      ticks: getChromaTicks(max),
    };
  }, [baseC, baseH, chroma, inputL, lock, steps]);

  return (
    <div className={className}>
      <div className="w-full h-32 flex gap-3">
        {/* Y axis: value labels positioned at their gridline height (auto-fit ceiling) */}
        <div className="relative w-9 shrink-0">
          {ticks.map(value => (
            <span
              key={value}
              className="absolute right-1 -translate-y-1/2 text-tiny leading-none text-foreground-400"
              style={{ top: `${yFor(value, maxY)}%` }}
            >
              {value.toFixed(2)}
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
            {ticks.map(value => (
              <line
                key={value}
                className="text-foreground/10"
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                x1="0"
                x2="100"
                y1={yFor(value, maxY)}
                y2={yFor(value, maxY)}
              />
            ))}

            <polyline
              className="text-foreground-400"
              fill="none"
              points={ceiling}
              stroke="currentColor"
              strokeDasharray="3 3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />

            <polyline
              className="text-warning-500"
              fill="none"
              points={actual}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />

            <polyline
              className="text-success-400"
              fill="none"
              points={curve}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Output dots at each step */}
          {dots.map((dot, index) => (
            <TooltipClickable
              key={dot.label ?? index}
              aria-label={`Step ${dot.label}: chroma ${dot.output.toFixed(3)}`}
              className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warning-500 ring-1 ring-content1 transition-transform hover:scale-150"
              content={`${dot.label} · ${dot.output.toFixed(3)}`}
              placement="top"
              style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
            >
              {null}
            </TooltipClickable>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm mt-1">
        <div className="text-foreground-400">┄ gamut ceiling</div>
        <div className="text-success-600 ">▬ chroma curve</div>
        <div className="text-warning-600 ">▬ output</div>
      </div>
    </div>
  );
}
