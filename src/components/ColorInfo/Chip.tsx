import { apcaContrast } from 'colorizr';

interface CircleChipProps {
  bg: string;
  fg: string;
  testid: string;
  title: string;
}

interface ShadeChipProps {
  darkColor?: string;
  lightColor?: string;
  shade: string;
}

function lc(bg: string, fg: string): number {
  return Math.round(Math.abs(apcaContrast(bg, fg)));
}

export function CircleChip({ bg, fg, testid, title }: CircleChipProps) {
  const score = lc(bg, fg);

  return (
    <span
      aria-label={`${title} Lc ${score}`}
      className="inline-flex items-center justify-center rounded-md size-9 text-sm font-semibold tabular-nums"
      data-testid={testid}
      style={{ backgroundColor: bg, color: fg }}
    >
      {score}
    </span>
  );
}

export function ShadeBgChip(props: ShadeChipProps) {
  const { darkColor = '#000000', lightColor = '#ffffff', shade } = props;
  const dark = lc(shade, darkColor);
  const light = lc(shade, lightColor);

  return (
    <div
      aria-label={`Dark text Lc ${dark}, light text Lc ${light}`}
      className="w-20 h-9 inline-flex items-center rounded-md px-2 gap-1"
      data-testid="ColorInfo-Chip-Shade"
      style={{ backgroundColor: shade }}
    >
      <span
        className="flex-1 text-center text-sm font-semibold tabular-nums"
        style={{ color: darkColor }}
      >
        {dark}
      </span>
      <span
        className="flex-1 text-center text-sm font-semibold tabular-nums"
        style={{ color: lightColor }}
      >
        {light}
      </span>
    </div>
  );
}
