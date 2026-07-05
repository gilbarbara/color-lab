import { useMemo, useState } from 'react';
import { useBreakpoint } from '@gilbarbara/hooks';
import { Divider, useDisclosure } from '@heroui/react';
import { ListMagnifyingGlassIcon } from '@phosphor-icons/react';

import { BREAKPOINTS, MODAL_BODY_PADDING, MODAL_GAP } from '~/config/globals';
import { trackEvent } from '~/utils/analytics';
import { getModalMaxWidth } from '~/utils/layout';

import Button from '~/components/Button';
import Modal, { ModalBody, ModalContent, ModalHeader } from '~/components/Modal';
import Tooltip from '~/components/Tooltip';

import type { ColorEntry, ScaleOptions, ScaleSteps } from '~/types';

import ChromaDistributionChart from './ChromaDistributionChart';
import Definition from './Definition';
import ScaleOptionsSection from './ScaleOptions';
import Table from './Table';

const LEFT_PANEL_WIDTH = 400;
const RIGHT_PANEL_WIDTH = 700;
const MODAL_MAX_WIDTH = 1280;

interface ColorInfoProps {
  colorEntry: ColorEntry;
  options: ScaleOptions;
  steps: ScaleSteps;
}

function pickDefaultStep(steps: ScaleSteps): string {
  const keys = Object.keys(steps);

  return keys[Math.floor(keys.length / 2)] ?? keys[0] ?? '';
}

export default function ColorInfo(props: ColorInfoProps) {
  const { colorEntry, options, steps } = props;

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { min } = useBreakpoint(BREAKPOINTS);
  const isMd = min('md');

  const defaultStep = useMemo(() => pickDefaultStep(steps), [steps]);
  const [selectedStep, setSelectedStep] = useState<string>(defaultStep);
  const activeStep = steps[selectedStep] ? selectedStep : defaultStep;
  const activeColor = steps[activeStep] ?? colorEntry.value;

  const desiredWidth = LEFT_PANEL_WIDTH + MODAL_GAP + RIGHT_PANEL_WIDTH + MODAL_BODY_PADDING;
  const modalMaxWidth = getModalMaxWidth(desiredWidth, MODAL_MAX_WIDTH, isMd);

  return (
    <>
      <Tooltip content="View color info" placement="bottom">
        <Button
          aria-label="View color info"
          isIconOnly
          onPress={() => {
            trackEvent('scale:info');
            onOpen();
          }}
          size="menu"
          variant="flat"
        >
          <ListMagnifyingGlassIcon className="text-lg" />
        </Button>
      </Tooltip>

      <Modal
        classNames={{
          base: 'w-full',
          body: 'flex flex-col lg:min-h-0',
          header: 'gap-1 font-normal',
        }}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        style={{ maxWidth: modalMaxWidth }}
      >
        <ModalContent data-testid="ColorInfo">
          <ModalHeader data-testid="ColorInfo-Header">
            <span>Color info</span>
            <span>·</span>
            <span className="text-foreground-500">{colorEntry.name}</span>
          </ModalHeader>
          <Divider />
          <ModalBody>
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
              <div className="flex flex-col gap-6 lg:basis-2/5 lg:min-w-0">
                <ScaleOptionsSection colorEntry={colorEntry} options={options} />
                <ChromaDistributionChart
                  onSelect={setSelectedStep}
                  selectedStep={activeStep}
                  steps={steps}
                />
                <Definition color={activeColor} step={activeStep} />
              </div>
              <div className="flex flex-col lg:basis-3/5 lg:min-w-0 lg:min-h-0">
                <Table
                  onSelect={setSelectedStep}
                  options={options}
                  selectedStep={activeStep}
                  steps={steps}
                />
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
