import { Button } from '@heroui/react';

import { trackEvent } from '~/utils/analytics';
import { generateExport } from '~/utils/export';

import type { ScaleSteps } from '~/types';

import ExportDrawer from './ExportDrawer';

interface ExportScaleProps {
  name: string;
  steps: ScaleSteps;
}

export default function ExportScale(props: ExportScaleProps) {
  const { name, steps } = props;

  return (
    <ExportDrawer
      footer={({ colorFormat, formatType, onCopy }) => {
        const code = generateExport(name, steps, { colorFormat, formatType });

        return (
          <Button
            className="w-full"
            color="primary"
            onPress={() => {
              trackEvent('copy-export-scale', { format: formatType, colorFormat });
              onCopy(code);
            }}
          >
            Copy
          </Button>
        );
      }}
      title="Export"
      trigger={onOpen => (
        <Button
          className="text-sm"
          onPress={() => {
            trackEvent('open-export-scale');
            onOpen();
          }}
          size="sm"
          variant="flat"
        >
          Export
        </Button>
      )}
    >
      {({ colorFormat, formatType }) => {
        const code = generateExport(name, steps, { colorFormat, formatType });

        return (
          <pre className="h-full overflow-auto rounded-lg bg-content2 p-4 font-mono text-sm">
            <code>{code}</code>
          </pre>
        );
      }}
    </ExportDrawer>
  );
}
