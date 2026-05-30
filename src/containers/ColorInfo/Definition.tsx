import { round } from '@gilbarbara/helpers';
import { parseCSS } from 'colorizr';

import { SECTION_LABEL } from './constants';

interface DefinitionProps {
  color: string;
  step: string;
}

export default function Definition({ color, step }: DefinitionProps) {
  const { c, h, l } = parseCSS(color, 'oklch');

  const rows: Array<[string, string]> = [
    ['Lightness', round(l, 3).toString()],
    ['Chroma', round(c, 3).toString()],
    ['Hue', `${round(h, 1)}°`],
  ];

  return (
    <section data-testid="ColorInfo-Definition">
      <div className="flex items-center justify-between mb-3">
        <p className={SECTION_LABEL}>OKLCH definition</p>
        <span className="flex items-center gap-2 text-xs text-foreground-500">
          <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }} />
          <span className="tabular-nums">{step}</span>
        </span>
      </div>
      <dl className="flex flex-col">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between py-2 border-t border-default-100"
          >
            <dt className="text-sm text-foreground-500">{label}</dt>
            <dd className="text-sm font-mono tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
