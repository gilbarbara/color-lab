import { APCA_LIGHTNESS_CONTRAST } from '~/config/globals';
import { trackEvent } from '~/utils/analytics';

import ToggleGroup from '~/components/ToggleGroup';

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

// ToggleGroup keys on strings; the thresholds are `number | 'all'`. Serialize at this boundary
// rather than widening the shared component.
type ThresholdKey = string;

interface SidebarProps {
  apcaThreshold: ApcaThreshold;
  guideline: Guideline;
  onChangeApcaThreshold: (value: ApcaThreshold) => void;
  onChangeGuideline: (value: Guideline) => void;
  onChangeWcagThreshold: (value: WcagThreshold) => void;
  wcagThreshold: WcagThreshold;
}

const headingClass = 'text-foreground-500 uppercase text-xs tracking-wide';
const itemClass = 'md:w-full justify-start h-8 px-3 text-sm rounded-md';

function formatThreshold(label: string, value: number | 'all'): string {
  if (value === 'all') {
    return label;
  }

  return `${label} ${value}+`;
}

function parseThreshold<T extends ApcaThreshold | WcagThreshold>(value: ThresholdKey): T {
  return (value === 'all' ? 'all' : Number(value)) as T;
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

  const description =
    guideline === 'wcag2'
      ? wcagThreshold !== 'all' && WCAG_DESCRIPTIONS[wcagThreshold]
      : apcaThreshold !== 'all' && APCA_DESCRIPTIONS[apcaThreshold];

  const isWcag2 = guideline === 'wcag2';
  const threshold = isWcag2 ? wcagThreshold : apcaThreshold;

  const thresholdItems = (isWcag2 ? WCAG_THRESHOLDS : APCA_THRESHOLDS).map(value => ({
    label: formatThreshold(
      isWcag2 ? WCAG_LABELS[value as WcagThreshold] : APCA_LABELS[value as ApcaThreshold],
      value,
    ),
    value: String(value),
  }));

  const handleChangeGuideline = (value: Guideline) => {
    if (value !== guideline) {
      trackEvent('contrast:change_guideline', { value });
    }

    onChangeGuideline(value);
  };

  const handleChangeThreshold = (key: ThresholdKey) => {
    const value = parseThreshold<ApcaThreshold | WcagThreshold>(key);

    if (value !== threshold) {
      trackEvent('contrast:change_threshold', { guideline, value });
    }

    if (isWcag2) {
      onChangeWcagThreshold(value as WcagThreshold);
    } else {
      onChangeApcaThreshold(value as ApcaThreshold);
    }
  };

  return (
    <aside
      className="shrink-0 w-full md:w-44 flex flex-col text-sm"
      data-testid="ContrastGrid-Sidebar"
    >
      <ToggleGroup
        classNames={{
          group: 'flex flex-row md:flex-col gap-1',
          item: itemClass,
          label: headingClass,
        }}
        items={[
          { label: 'WCAG 3 · APCA', value: 'apca' },
          { label: 'WCAG 2', value: 'wcag2' },
        ]}
        label="Guidelines"
        onChange={handleChangeGuideline}
        orientation="vertical"
        size="sm"
        value={guideline}
      />

      <ToggleGroup
        className="mt-6"
        classNames={{
          group: 'flex flex-row flex-wrap md:flex-col gap-1 overflow-x-auto',
          item: itemClass,
          label: headingClass,
        }}
        items={thresholdItems}
        label={isWcag2 ? 'Contrast Ratio' : <span>APCA {APCA_LIGHTNESS_CONTRAST}</span>}
        onChange={handleChangeThreshold}
        orientation="vertical"
        size="sm"
        value={String(threshold)}
      />

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
