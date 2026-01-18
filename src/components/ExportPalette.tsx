import { useMemo, useState } from 'react';
import { useBreakpoint, useEffectDeepCompare } from '@gilbarbara/hooks';
import { Button, Checkbox, Chip, cn } from '@heroui/react';
import { CopyIcon, ExportIcon } from '@phosphor-icons/react';
import { readableColorAPCA, scale } from 'colorizr';

import usePalette from '~/hooks/usePalette';
import { generateExport, generatePaletteExport } from '~/utils/export';

import Tooltip from '~/components/Tooltip';

import type { ScaleExportData } from '~/types';

import ExportModal, { type ExportRenderProps } from './ExportModal';

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

  const textColor = readableColorAPCA(mainColor);
  const code = generateExport(name, steps, { colorFormat, formatType });

  return (
    <div className="flex items-center gap-1">
      <Checkbox
        isSelected={isSelected}
        onValueChange={checked => onSelectionChange(index, checked)}
      />
      <Chip
        classNames={{
          base: 'pe-2',
          content: 'font-medium',
        }}
        endContent={
          <Tooltip content={`Copy ${name} scale`} placement="bottom-start">
            <button aria-label={`Copy ${name}`} onClick={() => onCopy(code)} type="button">
              <CopyIcon className="text-base" style={{ color: textColor }} />
            </button>
          </Tooltip>
        }
        style={{ backgroundColor: mainColor, color: textColor }}
      >
        {name}
      </Chip>
    </div>
  );
}

export default function ExportPalette() {
  const { colors, globalOptions } = usePalette();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set(colors.map((_, index) => index)),
  );
  const { min } = useBreakpoint();

  // Reset to all selected when colors change
  useEffectDeepCompare(() => {
    setSelectedIndices(new Set(colors.map((_, index) => index)));
  }, [colors]);

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

  const isLarge = min('md');

  return (
    <ExportModal
      title="Export All"
      trigger={onOpen => (
        <Tooltip content="Export all" isDisabled={isLarge} placement="bottom-end">
          <Button
            aria-label="Export All"
            className={cn({
              'h-8 px-2 min-w-8': isLarge,
            })}
            isIconOnly={!isLarge}
            onPress={onOpen}
            variant="light"
          >
            {isLarge ? 'Export All' : <ExportIcon className="text-lg" />}
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

            <div className="relative flex flex-col gap-2">
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

            <Button
              className="absolute right-2 bottom-2"
              color="primary"
              isDisabled={selectedIndices.size === 0}
              onPress={() => onCopy(allCode)}
            >
              Copy All ({selectedIndices.size})
            </Button>
          </div>
        );
      }}
    </ExportModal>
  );
}
