import { useMemo, useState } from 'react';
import { useBreakpoint } from '@gilbarbara/hooks';
import { CopyIcon, ExportIcon } from '@phosphor-icons/react';
import { convertCSS, readableColor, scale } from 'colorizr';

import { BREAKPOINTS } from '~/config/ui';
import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';
import { generateExport, generatePaletteExport } from '~/utils/export';
import { getEffectiveOptions } from '~/utils/generator';

import Button from '~/components/Button';
import CheckboxToggle from '~/components/CheckboxToggle';
import CopyText from '~/components/CopyText';
import Tooltip from '~/components/Tooltip';

import type { ScaleExportData } from '~/types';

import ExportDrawer, { type ExportRenderProps } from './ExportDrawer';

interface ScaleItemProps extends ExportRenderProps {
  id: string;
  isSelected: boolean;
  mainColor: string;
  name: string;
  onSelectionChange: (id: string, selected: boolean) => void;
  steps: Record<string, string>;
}

function ScaleItem(props: ScaleItemProps) {
  const {
    colorFormat,
    formatType,
    id,
    isSelected,
    mainColor,
    name,
    onCopy,
    onSelectionChange,
    steps,
  } = props;
  const { gamut } = useApp('gamut');

  const displayMainColor = gamut === 'srgb' ? convertCSS(mainColor, 'hex') : mainColor;
  const textColor = readableColor(displayMainColor, 'apca');
  const code = generateExport(name, steps, { colorFormat, formatType });

  return (
    <div className="flex items-center gap-1">
      <CheckboxToggle
        endContent={
          <CopyText
            color={textColor}
            content={`Copy ${name} scale`}
            label={`Copy ${name}`}
            onCopy={value => {
              trackEvent('export:copy_row', { name });
              onCopy(value);
            }}
            placement="bottom-start"
            value={code}
          />
        }
        isSelected={isSelected}
        onValueChange={checked => onSelectionChange(id, checked)}
        style={{ backgroundColor: displayMainColor, color: textColor }}
      >
        {name}
      </CheckboxToggle>
    </div>
  );
}

export default function ExportPalette() {
  const { colors, globalOptions } = useGenerator('colors', 'globalOptions');
  // Keyed by color id, not index: a reorder leaves the palette the same length, so an
  // index-keyed selection silently follows the position and exports the wrong colors.
  // Tracking the *deselected* ids rather than the selected ones also means a newly added
  // color is selected by default, with no reconciliation against `colors`.
  // Ids aren't airtight: `useUrlSync` re-attaches them by position, so navigating back over a
  // reorder permutes them and this set names a different color. Left alone — the drawer shows
  // the selection before Copy, so it's visible and one click to fix.
  const [deselectedIds, setDeselectedIds] = useState<Set<string>>(() => new Set());
  const { min } = useBreakpoint(BREAKPOINTS);

  // Only ExportDrawer's render props read this, and they run only while the drawer is open.
  // Computing it eagerly ran `scale()` — the heaviest call in the app, ~0.32ms — once per color
  // on every palette edit, so a slider drag burned it N times a frame with the drawer shut.
  // Defer it behind an accessor; the result is cached until the palette or options change.
  const getScalesData = useMemo(() => {
    let cached: Array<ScaleExportData & { id: string; mainColor: string }> | null = null;

    return () => {
      cached ??= colors.map(color => ({
        id: color.id,
        name: color.name,
        mainColor: color.value,
        steps: scale(color.value, getEffectiveOptions(color, globalOptions)),
      }));

      return cached;
    };
  }, [colors, globalOptions]);

  const handleSelectionChange = (id: string, selected: boolean) => {
    setDeselectedIds(previous => {
      const next = new Set(previous);

      if (selected) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const handleSelectAll = () => {
    setDeselectedIds(new Set());
  };

  const handleSelectNone = () => {
    setDeselectedIds(new Set(colors.map(color => color.id)));
  };

  const isLarge = min('lg');
  const showSelection = colors.length > 1;
  // Deselections are never reconciled against `colors`, but the selection UI only exists above one
  // color — so a deselection left over from a larger palette would strand the drawer with nothing
  // to export and no control to re-select with. Ignore it while that UI is gone.
  const isDeselected = (id: string) => showSelection && deselectedIds.has(id);
  const selectedCount = colors.reduce((acc, color) => (isDeselected(color.id) ? acc : acc + 1), 0);

  // Both render props (footer + body) need the export of the selected scales for
  // the current format. Build it once here so the two stay in sync.
  const buildAllCode = ({
    colorFormat,
    formatType,
  }: Pick<ExportRenderProps, 'colorFormat' | 'formatType'>): string => {
    const selectedScales: ScaleExportData[] = getScalesData()
      .filter(({ id }) => !isDeselected(id))
      .map(({ name, steps }) => ({ name, steps }));

    return generatePaletteExport(selectedScales, { colorFormat, formatType });
  };

  return (
    <ExportDrawer
      footer={({ colorFormat, formatType, onCopy }) => {
        const allCode = buildAllCode({ colorFormat, formatType });

        return (
          <Button
            className="w-full"
            color="primary"
            isDisabled={selectedCount === 0}
            onPress={() => {
              trackEvent('palette:export_copy', {
                format: formatType,
                color_format: colorFormat,
                count: selectedCount,
              });
              onCopy(allCode);
            }}
            startContent={<CopyIcon className="text-lg" />}
          >
            Copy All ({selectedCount})
          </Button>
        );
      }}
      selection={
        showSelection
          ? () => (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button onPress={handleSelectAll} size="sm" variant="flat">
                    Select All
                  </Button>
                  <Button onPress={handleSelectNone} size="sm" variant="flat">
                    Select None
                  </Button>
                </div>
                <span className="text-sm text-foreground-500">
                  {selectedCount} of {colors.length} selected
                </span>
              </div>
            )
          : undefined
      }
      title="Export All"
      trigger={onOpen => (
        <Tooltip content="Export all" isDisabled={isLarge} placement="bottom-end">
          <Button
            aria-label="Export All"
            className="max-xsm:button-menu-square sm:@max-xl:button-menu-square"
            onPress={() => {
              trackEvent('palette:export');
              onOpen();
            }}
            size="menu"
            startContent={<ExportIcon className="text-xl shrink-0" weight="bold" />}
            variant="light"
          >
            <span className="hidden xsm:inline-flex sm:@max-xl:hidden">Export All</span>
          </Button>
        </Tooltip>
      )}
    >
      {({ colorFormat, formatType, onCopy }) => {
        const allCode = buildAllCode({ colorFormat, formatType });

        return (
          <div className="flex flex-col gap-4">
            {showSelection && (
              <div className="flex flex-wrap gap-2">
                {getScalesData().map(scaleData => (
                  <ScaleItem
                    key={scaleData.id}
                    colorFormat={colorFormat}
                    formatType={formatType}
                    id={scaleData.id}
                    isSelected={!isDeselected(scaleData.id)}
                    mainColor={scaleData.mainColor}
                    name={scaleData.name}
                    onCopy={onCopy}
                    onSelectionChange={handleSelectionChange}
                    steps={scaleData.steps}
                  />
                ))}
              </div>
            )}
            {selectedCount === 0 ? (
              <div className="rounded-lg bg-surface-alt p-4 text-sm text-foreground-500">
                Select at least one color to preview the export.
              </div>
            ) : (
              <pre className="overflow-auto rounded-lg bg-surface-alt p-4 font-mono text-sm">
                <code>{allCode}</code>
              </pre>
            )}
          </div>
        );
      }}
    </ExportDrawer>
  );
}
