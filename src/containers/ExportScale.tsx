import { CopyIcon, ExportIcon } from '@phosphor-icons/react';

import { trackEvent } from '~/utils/analytics';
import { generateExport } from '~/utils/export';

import Tooltip from '~/components/Tooltip';

import type { ScaleSteps } from '~/types';

import Button from '../components/Button';

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
            startContent={<CopyIcon className="text-lg" />}
          >
            Copy
          </Button>
        );
      }}
      title="Export"
      trigger={onOpen => (
        <Tooltip content="Export scale" placement="bottom-end">
          <Button
            aria-label="Export scale"
            isIconOnly
            onPress={() => {
              trackEvent('open-export-scale');
              onOpen();
            }}
            size="menu"
            variant="flat"
          >
            <ExportIcon className="text-lg" />
          </Button>
        </Tooltip>
      )}
    >
      {({ colorFormat, formatType }) => {
        const code = generateExport(name, steps, { colorFormat, formatType });

        return (
          <pre className="h-full overflow-auto rounded-lg bg-surface-alt p-4 font-mono text-sm">
            <code>{code}</code>
          </pre>
        );
      }}
    </ExportDrawer>
  );
}
