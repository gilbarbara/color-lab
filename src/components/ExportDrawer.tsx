import { type Key, type ReactNode } from 'react';
import { useBreakpoint } from '@gilbarbara/hooks';
import {
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Tab,
  Tabs,
  useDisclosure,
} from '@heroui/react';

import { BREAKPOINTS } from '~/config/globals';
import { useAppStore } from '~/stores/appStore';
import { trackEvent } from '~/utils/analytics';
import { copyToClipboard } from '~/utils/clipboard';
import {
  colorFormatLabels,
  formatTypeLabels,
  formatTypes,
  getAvailableColorFormats,
} from '~/utils/export';

import type { ExportColorFormat, ExportFormatType } from '~/types';

export interface ExportDrawerProps {
  children: (props: ExportRenderProps) => ReactNode;
  footer?: (props: ExportRenderProps) => ReactNode;
  selection?: (props: ExportRenderProps) => ReactNode;
  title: string;
  trigger: (onOpen: () => void) => ReactNode;
}

export interface ExportRenderProps {
  colorFormat: ExportColorFormat;
  formatType: ExportFormatType;
  onCopy: (code: string) => void;
}

export default function ExportDrawer(props: ExportDrawerProps) {
  const { children, footer, selection, title, trigger } = props;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { min } = useBreakpoint(BREAKPOINTS);

  const {
    exportColorFormat: colorFormat,
    exportFormatType: formatType,
    setExportColorFormat,
    setExportFormatType,
  } = useAppStore();

  const isDesktop = min('md');

  const handleCopyToClipboard = (code: string) => copyToClipboard(code);

  const handleFormatTypeChange = (key: Key) => {
    const newFormatType = key as ExportFormatType;

    setExportFormatType(newFormatType);

    trackEvent('format-type', { value: key as string });

    const newAvailableFormats = getAvailableColorFormats(newFormatType);

    if (!newAvailableFormats.includes(colorFormat)) {
      setExportColorFormat(newAvailableFormats[0]);
    }
  };

  const handleColorFormatChange = (key: Key) => {
    setExportColorFormat(key as ExportColorFormat);

    trackEvent('color-format', { value: key as string });
  };

  const renderProps: ExportRenderProps = {
    colorFormat: formatType === 'svg' ? 'hex' : colorFormat,
    formatType,
    onCopy: handleCopyToClipboard,
  };

  return (
    <>
      {trigger(onOpen)}
      {isOpen && (
        <Drawer
          backdrop="blur"
          isDismissable
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          placement={isDesktop ? 'right' : 'bottom'}
          scrollBehavior="inside"
          size={isDesktop ? 'lg' : 'full'}
        >
          <DrawerContent>
            <DrawerHeader className="text-lg/3">{title}</DrawerHeader>
            <Divider />
            <div className="flex shrink-0 flex-col gap-3 px-4 py-3">
              <Tabs
                aria-label="Format type"
                classNames={{ tab: 'px-2 text-sm' }}
                color="primary"
                fullWidth
                onSelectionChange={handleFormatTypeChange}
                selectedKey={formatType}
                variant="solid"
              >
                {formatTypes.map(type => (
                  <Tab key={type} title={formatTypeLabels[type]} />
                ))}
              </Tabs>
              {formatType !== 'svg' && (
                <Tabs
                  aria-label="Color format"
                  classNames={{ tab: 'px-2 text-sm' }}
                  color="primary"
                  fullWidth
                  onSelectionChange={handleColorFormatChange}
                  selectedKey={colorFormat}
                  size="sm"
                  variant="solid"
                >
                  {getAvailableColorFormats(formatType).map(format => (
                    <Tab key={format} title={colorFormatLabels[format]} />
                  ))}
                </Tabs>
              )}
            </div>
            {selection && (
              <div className="shrink-0 border-t border-default-200 px-4 py-2">
                {selection(renderProps)}
              </div>
            )}
            <DrawerBody className="min-h-0 flex-1 overflow-auto p-4 border-t border-default">
              {children(renderProps)}
            </DrawerBody>
            {footer && <DrawerFooter className="shrink-0">{footer(renderProps)}</DrawerFooter>}
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
