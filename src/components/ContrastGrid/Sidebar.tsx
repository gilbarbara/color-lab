import { Button, cn } from '@heroui/react';

import { APCA_LIGHTNESS_CONTRAST } from '~/config/globals';

import {
  APCA_DESCRIPTIONS,
  APCA_LABELS,
  APCA_THRESHOLDS,
  type ApcaThreshold,
  type Guideline,
  WCAG_DESCRIPTIONS,
  WCAG_LABELS,
  WCAG_THRESHOLDS,
  type WcagThreshold,
} from './constants';

interface SidebarProps {
  apcaThreshold: ApcaThreshold;
  guideline: Guideline;
  onChangeApcaThreshold: (value: ApcaThreshold) => void;
  onChangeGuideline: (value: Guideline) => void;
  onChangeWcagThreshold: (value: WcagThreshold) => void;
  wcagThreshold: WcagThreshold;
}

function formatThreshold(label: string, value: number | 'all'): string {
  if (value === 'all') {
    return label;
  }

  return `${label} ${value}+`;
}

export default function Sidebar(props: SidebarProps) {
  const {
    apcaThreshold,
    guideline,
    onChangeApcaThreshold,
    onChangeGuideline,
    onChangeWcagThreshold,
    wcagThreshold,
  } = props;

  const itemClass = (active: boolean) =>
    cn(
      'md:w-full justify-start h-8 px-3 text-sm rounded-md',
      active ? 'bg-default-200 text-foreground' : 'bg-transparent text-foreground-500',
    );

  const description =
    guideline === 'wcag2'
      ? wcagThreshold !== 'all' && WCAG_DESCRIPTIONS[wcagThreshold]
      : apcaThreshold !== 'all' && APCA_DESCRIPTIONS[apcaThreshold];

  return (
    <aside
      className="shrink-0 w-full md:w-44 flex flex-col text-sm"
      data-testid="ContrastGrid-Sidebar"
    >
      <section>
        <p className="text-foreground-500 uppercase text-xs tracking-wide mb-2">Guidelines</p>
        <div className="flex flex-row md:flex-col gap-1">
          <Button
            className={itemClass(guideline === 'apca')}
            onPress={() => onChangeGuideline('apca')}
            size="sm"
            variant="light"
          >
            WCAG 3 · APCA
          </Button>
          <Button
            className={itemClass(guideline === 'wcag2')}
            onPress={() => onChangeGuideline('wcag2')}
            size="sm"
            variant="light"
          >
            WCAG 2
          </Button>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-foreground-500 uppercase text-xs tracking-wide mb-2">
          {guideline === 'wcag2' ? 'Contrast Ratio' : <span>APCA {APCA_LIGHTNESS_CONTRAST}</span>}
        </p>
        <div className="flex flex-row flex-wrap md:flex-col gap-1 overflow-x-auto">
          {guideline === 'wcag2'
            ? WCAG_THRESHOLDS.map(value => (
                <Button
                  key={value}
                  className={itemClass(wcagThreshold === value)}
                  onPress={() => onChangeWcagThreshold(value)}
                  size="sm"
                  variant="light"
                >
                  {formatThreshold(WCAG_LABELS[value], value)}
                </Button>
              ))
            : APCA_THRESHOLDS.map(value => (
                <Button
                  key={value}
                  className={itemClass(apcaThreshold === value)}
                  onPress={() => onChangeApcaThreshold(value)}
                  size="sm"
                  variant="light"
                >
                  {formatThreshold(APCA_LABELS[value], value)}
                </Button>
              ))}
        </div>
      </section>

      {description && (
        <p className="text-foreground-500 italic text-sm leading-snug mt-2">{description}</p>
      )}

      {guideline === 'apca' && (
        <div className="mt-4">
          <p className="text-foreground-500 text-sm">Rows = text</p>
          <p className="text-foreground-500 text-sm">Cols = background</p>
        </div>
      )}
    </aside>
  );
}
