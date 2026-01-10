import { type Key, type ReactNode } from 'react';
import { useBreakpoint } from '@gilbarbara/hooks';
import {
  addToast,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Tab,
  Tabs,
  useDisclosure,
} from '@heroui/react';

import { useAppStore } from '~/stores/appStore';
import {
  colorFormatLabels,
  formatTypeLabels,
  formatTypes,
  getAvailableColorFormats,
} from '~/utils/export';

import type { ExportColorFormat, ExportFormatType } from '~/types';

export interface ExportModalProps {
  children: (props: ExportRenderProps) => ReactNode;
  title: string;
  trigger: (onOpen: () => void) => ReactNode;
}

export interface ExportRenderProps {
  colorFormat: ExportColorFormat;
  formatType: ExportFormatType;
  onCopy: (code: string) => void;
}

export default function ExportModal(props: ExportModalProps) {
  const { children, title, trigger } = props;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { min } = useBreakpoint();

  const {
    exportColorFormat: colorFormat,
    exportFormatType: formatType,
    setExportColorFormat,
    setExportFormatType,
  } = useAppStore();

  const isVertical = min('md');

  const handleCopyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      addToast({
        title: 'Copied to clipboard',
        color: 'success',
      });
    } catch {
      addToast({
        title: 'Failed to copy',
        color: 'danger',
      });
    }
  };

  const handleFormatTypeChange = (key: Key) => {
    const newFormatType = key as ExportFormatType;

    setExportFormatType(newFormatType);

    // Reset color format if not available for new format type
    const newAvailableFormats = getAvailableColorFormats(newFormatType);

    if (!newAvailableFormats.includes(colorFormat)) {
      setExportColorFormat(newAvailableFormats[0]);
    }
  };

  const handleColorFormatChange = (key: Key) => {
    setExportColorFormat(key as ExportColorFormat);
  };

  return (
    <>
      {trigger(onOpen)}
      {isOpen && (
        <Modal
          backdrop="blur"
          classNames={{
            header: 'p-4 text-lg/3',
            body: 'p-4 min-h-96',
          }}
          isOpen={isOpen}
          onClose={onOpenChange}
          scrollBehavior="inside"
          size={min('lg') ? '4xl' : '2xl'}
        >
          <ModalContent>
            <ModalHeader>{title}</ModalHeader>
            <Divider />
            <ModalBody>
              <Tabs
                aria-label="Format type"
                classNames={{
                  base: !isVertical ? 'w-full' : undefined,
                  tabList: 'gap-1',
                  tab: 'justify-start px-2',
                  panel: 'flex-1',
                }}
                isVertical={isVertical}
                onSelectionChange={handleFormatTypeChange}
                selectedKey={formatType}
                variant="light"
              >
                {formatTypes.map(type => (
                  <Tab key={type} title={formatTypeLabels[type]}>
                    {type === 'svg' ? (
                      children({
                        formatType: type,
                        colorFormat: 'hex',
                        onCopy: handleCopyToClipboard,
                      })
                    ) : (
                      <Tabs
                        aria-label="Color format"
                        classNames={{
                          base: !isVertical ? 'w-full' : undefined,
                          tabList: 'gap-1',
                          tab: 'justify-start px-3',
                          panel: 'flex-1',
                        }}
                        isVertical={isVertical}
                        onSelectionChange={handleColorFormatChange}
                        selectedKey={colorFormat}
                        variant="light"
                      >
                        {getAvailableColorFormats(type).map(format => (
                          <Tab key={format} title={colorFormatLabels[format]}>
                            {children({
                              formatType: type,
                              colorFormat: format,
                              onCopy: handleCopyToClipboard,
                            })}
                          </Tab>
                        ))}
                      </Tabs>
                    )}
                  </Tab>
                ))}
              </Tabs>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
