import { Button } from '@heroui/react';

import { trackEvent } from '~/utils/analytics';
import { generateExport } from '~/utils/export';

import type { ScaleSteps } from '~/types';

import ExportModal from './ExportModal';

interface CodePreviewProps {
  code: string;
  onCopy: (code: string) => void;
}

interface ExportScaleProps {
  name: string;
  steps: ScaleSteps;
}

function CodePreview(props: CodePreviewProps) {
  const { code, onCopy } = props;

  return (
    <div className="relative min-h-80 overflow-hidden rounded-lg bg-content2">
      <pre className="h-full overflow-auto p-4 font-mono text-sm">
        <code>{code}</code>
      </pre>
      <Button className="absolute right-2 bottom-2" onPress={() => onCopy(code)}>
        Copy
      </Button>
    </div>
  );
}

export default function ExportScale(props: ExportScaleProps) {
  const { name, steps } = props;

  return (
    <ExportModal
      title="Export"
      trigger={onOpen => (
        <Button
          className="h-8 px-2 min-w-8"
          onPress={() => {
            trackEvent('open-export-scale');
            onOpen();
          }}
          variant="light"
        >
          Export
        </Button>
      )}
    >
      {({ colorFormat, formatType, onCopy }) => {
        const code = generateExport(name, steps, { colorFormat, formatType });

        const handleCopy = (value: string) => {
          trackEvent('copy-export-scale', { format: formatType, colorFormat });
          onCopy(value);
        };

        return <CodePreview code={code} onCopy={handleCopy} />;
      }}
    </ExportModal>
  );
}
