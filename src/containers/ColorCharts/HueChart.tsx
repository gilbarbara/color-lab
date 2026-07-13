import { useMemo } from 'react';
import { parseCSS } from 'colorizr';

import { CHART_PAD_Y } from '~/config/ui';

import TooltipClickable from '~/components/TooltipClickable';

import type { ScaleChartComponentProps } from './types';
import { parseSteps, unwrapHues } from './utils';

// Minimum visible span (degrees) so a flat curve (hueShift 0) still renders a
// centered line with sensible axis numbers instead of dividing by zero.
export const MIN_SPAN = 10;

/** Normalize an unwrapped hue to a 0–359 integer for labels. */
function normalizeHue(value: number) {
  return Math.round(((value % 360) + 360) % 360);
}

/** Vertical position (0–100) for a hue value within the auto-fit [minY, maxY] band. */
function yFor(value: number, minY: number, maxY: number) {
  const span = maxY - minY || 1;

  return CHART_PAD_Y + (1 - (value - minY) / span) * (100 - 2 * CHART_PAD_Y);
}

/**
 * Hue across the scale vs the base hue. With hueShift set, steps drift warm/cool
 * away from the anchor; the gap to the flat base line shows that drift, which is
 * impossible to read from the swatches. Read straight from the generated steps, so
 * it reflects mode and locked steps. Plotted in unwrapped degrees (anchored at the
 * base hue) so the line stays continuous; only the labels normalize to 0–359.
 */
export default function HueChart(props: ScaleChartComponentProps) {
  const { className, colorEntry, steps } = props;

  const { h } = parseCSS(colorEntry.value, 'oklch');

  const { actual, dots, maxY, minY, reference, ticks } = useMemo(() => {
    const parsed = parseSteps(steps);
    const hues = unwrapHues(
      parsed.map(step => step.h),
      h,
    );

    // Auto-fit the axis to the drift (base hue included), padded to a minimum span
    // + 10% breathing room.
    let lo = Math.min(h, ...hues);
    let hi = Math.max(h, ...hues);
    const span = hi - lo;

    if (span < MIN_SPAN) {
      const pad = (MIN_SPAN - span) / 2;

      lo -= pad;
      hi += pad;
    }

    const breathing = (hi - lo) * 0.1;

    lo -= breathing;
    hi += breathing;

    const mid = (lo + hi) / 2;

    const stepDots = parsed.map((step, index) => ({
      hue: hues[index],
      label: step.label,
      x: step.t * 100,
      y: yFor(hues[index], lo, hi),
    }));

    return {
      actual: stepDots.map(dot => `${dot.x},${dot.y}`).join(' '),
      dots: stepDots,
      maxY: hi,
      minY: lo,
      reference: `0,${yFor(h, lo, hi)} 100,${yFor(h, lo, hi)}`,
      ticks: [hi, mid, lo],
    };
  }, [h, steps]);

  return (
    <div className={className}>
      <div className="w-full h-32 flex gap-3">
        {/* Y axis: hue degree labels at their gridline height (auto-fit) */}
        <div className="relative w-9 shrink-0">
          {ticks.map(value => (
            <span
              key={value}
              className="absolute right-1 -translate-y-1/2 text-tiny leading-none text-foreground-400"
              style={{ top: `${yFor(value, minY, maxY)}%` }}
            >
              {normalizeHue(value)}°
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
                y1={yFor(value, minY, maxY)}
                y2={yFor(value, minY, maxY)}
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
              className="text-danger"
              fill="none"
              points={actual}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Hue dots at each step */}
          {dots.map((dot, index) => (
            <TooltipClickable
              key={dot.label ?? index}
              aria-label={`Step ${dot.label}: hue ${normalizeHue(dot.hue)}°`}
              className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger ring-1 ring-content1 transition-transform hover:scale-150"
              content={`${dot.label} · ${normalizeHue(dot.hue)}°`}
              placement="top"
              style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
            >
              {null}
            </TooltipClickable>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm mt-1">
        <div className="text-danger">▬ hue</div>
        <div className="text-foreground-400">┄ base</div>
      </div>
    </div>
  );
}
