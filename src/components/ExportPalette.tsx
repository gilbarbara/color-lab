import { useEffect, useMemo, useState } from 'react';
import { useBreakpoint } from '@gilbarbara/hooks';
import { ExportIcon } from '@phosphor-icons/react';
import { convertCSS, readableColor, scale } from 'colorizr';

import { BREAKPOINTS } from '~/config/globals';
import usePalette from '~/hooks/usePalette';
import { useAppStore } from '~/stores/appStore';
import { trackEvent } from '~/utils/analytics';
import { generateExport, generatePaletteExport } from '~/utils/export';

import Button from '~/components/Button';
import CheckboxToggle from '~/components/CheckboxToggle';
import CopyText from '~/components/CopyText';
import Tooltip from '~/components/Tooltip';

import type { ScaleExportData } from '~/types';

import ExportDrawer, { type ExportRenderProps } from './ExportDrawer';

interface ScaleItemProps extends ExportRenderProps {
  index: number;
  isSelected: boolean;
  mainColor: string;
  name: string;
  onSelectionChange: (index: number, selected: boolean) => void;
  steps: Record<string, string>;
}

function ScaleItem(props: ScaleItemProps) {
  const {
    colorFormat,
    formatType,
    index,
    isSelected,
    mainColor,
    name,
    onCopy,
    onSelectionChange,
    steps,
  } = props;
  const gamut = useAppStore(state => state.gamut);

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
            onCopy={onCopy}
            placement="bottom-start"
            value={code}
          />
        }
        isSelected={isSelected}
        onValueChange={checked => onSelectionChange(index, checked)}
        style={{ backgroundColor: displayMainColor, color: textColor }}
      >
        {name}
      </CheckboxToggle>
    </div>
  );
}

export default function ExportPalette() {
  const { colors, globalOptions } = usePalette();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set(colors.map((_, index) => index)),
  );
  const { min } = useBreakpoint(BREAKPOINTS);

  useEffect(() => {
    setSelectedIndices(new Set(colors.map((_, index) => index)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors.length]);

  const scalesData = useMemo(() => {
    return colors.map(color => ({
      name: color.name,
      mainColor: color.value,
      steps: scale(color.value, { ...globalOptions, ...color.overrides }),
    }));
  }, [colors, globalOptions]);

  const handleSelectionChange = (index: number, selected: boolean) => {
    setSelectedIndices(previous => {
      const next = new Set(previous);

      if (selected) {
        next.add(index);
      } else {
        next.delete(index);
      }

      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIndices(new Set(colors.map((_, index) => index)));
  };

  const handleSelectNone = () => {
    setSelectedIndices(new Set());
  };

  const isLarge = min('lg');
  const showSelection = colors.length > 1;

  return (
    <ExportDrawer
      footer={({ colorFormat, formatType, onCopy }) => {
        const selectedScales: ScaleExportData[] = scalesData
          .filter((_, index) => selectedIndices.has(index))
          .map(({ name, steps }) => ({ name, steps }));

        const allCode = generatePaletteExport(selectedScales, { colorFormat, formatType });

        return (
          <Button
            className="w-full"
            color="primary"
            isDisabled={selectedIndices.size === 0}
            onPress={() => {
              trackEvent('copy-export-palette', {
                format: formatType,
                colorFormat,
                count: selectedIndices.size,
              });
              onCopy(allCode);
            }}
          >
            Copy All ({selectedIndices.size})
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
                  {selectedIndices.size} of {scalesData.length} selected
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
            className="@max-xl:px-0 @max-xl:min-w-8 @max-xl:w-8"
            onPress={() => {
              trackEvent('open-export-palette');
              onOpen();
            }}
            size="menu"
            startContent={<ExportIcon className="text-xl" weight="bold" />}
            variant="light"
          >
            <span className="hidden @xl:inline-flex">Export All</span>
          </Button>
        </Tooltip>
      )}
    >
      {({ colorFormat, formatType, onCopy }) => {
        const selectedScales: ScaleExportData[] = scalesData
          .filter((_, index) => selectedIndices.has(index))
          .map(({ name, steps }) => ({ name, steps }));

        const allCode = generatePaletteExport(selectedScales, { colorFormat, formatType });

        return (
          <div className="flex flex-col gap-4">
            {showSelection && (
              <div className="flex flex-wrap gap-2">
                {scalesData.map((scaleData, index) => (
                  <ScaleItem
                    key={scaleData.name}
                    colorFormat={colorFormat}
                    formatType={formatType}
                    index={index}
                    isSelected={selectedIndices.has(index)}
                    mainColor={scaleData.mainColor}
                    name={scaleData.name}
                    onCopy={onCopy}
                    onSelectionChange={handleSelectionChange}
                    steps={scaleData.steps}
                  />
                ))}
              </div>
            )}
            {selectedIndices.size === 0 ? (
              <div className="rounded-lg bg-content2 p-4 text-sm text-foreground-500">
                Select at least one color to preview the export.
              </div>
            ) : (
              <pre className="overflow-auto rounded-lg bg-content2 p-4 font-mono text-sm">
                <code>{allCode}</code>
              </pre>
            )}
          </div>
        );
      }}
    </ExportDrawer>
  );
}
