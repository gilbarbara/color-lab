import { cn } from '@heroui/react';

interface CurvePreviewProps {
  className?: string;
  compute: (t: number) => number;
  samples?: number;
}

const PAD_Y = 5;

export default function CurvePreview(props: CurvePreviewProps) {
  const { className, compute, samples = 24 } = props;

  const points = Array.from({ length: samples + 1 }, (_, index) => {
    const t = index / samples;
    const y = Math.min(1, Math.max(0, compute(t)));

    return `${t * 100},${PAD_Y + (1 - y) * (100 - 2 * PAD_Y)}`;
  }).join(' ');

  return (
    <svg
      aria-hidden="true"
      className={cn('w-8 h-4 text-foreground shrink-0 overflow-visible', className)}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <polyline
        fill="none"
        points={points}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
