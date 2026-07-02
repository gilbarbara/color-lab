import { useBreakpoint, useSetState } from '@gilbarbara/hooks';
import { Divider, useDisclosure } from '@heroui/react';
import { CircleHalfIcon } from '@phosphor-icons/react';

import { BREAKPOINTS, MODAL_BODY_PADDING, MODAL_GAP } from '~/config/globals';
import { trackEvent } from '~/utils/analytics';
import { getModalMaxWidth } from '~/utils/layout';

import Button from '~/components/Button';
import Modal, { ModalBody, ModalContent, ModalHeader } from '~/components/Modal';
import Tooltip from '~/components/Tooltip';

import type { ColorEntry, ScaleSteps } from '~/types';

import type { ApcaThreshold, Guideline, WcagThreshold } from './constants';
import Grid from './Grid';
import Sidebar from './Sidebar';

const SIDEBAR_WIDTH = 176;
const CELL_WIDTH = 48;
const CELL_GAP = 4;
const MODAL_MAX_WIDTH = 1440;

interface ContrastGridProps {
  colorEntry: ColorEntry;
  steps: ScaleSteps;
}

interface ContrastGridState {
  apcaThreshold: ApcaThreshold;
  guideline: Guideline;
  wcagThreshold: WcagThreshold;
}

export default function ContrastGrid(props: ContrastGridProps) {
  const { colorEntry, steps } = props;

  const [{ apcaThreshold, guideline, wcagThreshold }, setState] = useSetState<ContrastGridState>({
    apcaThreshold: 45,
    guideline: 'apca',
    wcagThreshold: 4.5,
  });

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { min } = useBreakpoint(BREAKPOINTS);
  const isMd = min('md');

  const threshold = guideline === 'wcag2' ? wcagThreshold : apcaThreshold;

  const stepCount = Object.keys(steps).length;
  const gridWidth = (stepCount + 1) * CELL_WIDTH + stepCount * CELL_GAP;
  const desiredWidth = SIDEBAR_WIDTH + MODAL_GAP + gridWidth + MODAL_BODY_PADDING;
  const modalMaxWidth = getModalMaxWidth(desiredWidth, MODAL_MAX_WIDTH, isMd);

  return (
    <>
      <Tooltip content="View Contrast Grid" placement="bottom-end">
        <Button
          aria-label="View Contrast Grid"
          isIconOnly
          onPress={() => {
            trackEvent('contrast:open');
            onOpen();
          }}
          size="menu"
          variant="flat"
        >
          <CircleHalfIcon className="text-lg" weight="fill" />
        </Button>
      </Tooltip>

      <Modal
        classNames={{ base: 'w-full', header: 'gap-1 font-normal' }}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        style={{ maxWidth: modalMaxWidth }}
      >
        <ModalContent>
          <ModalHeader data-testid="ContrastGrid-Header">
            <span>Contrast grid</span>
            <span>·</span>
            <span className="text-foreground-500">{colorEntry.name}</span>
          </ModalHeader>
          <Divider />
          <ModalBody>
            <div className="flex flex-col md:flex-row gap-6">
              <Sidebar
                apcaThreshold={apcaThreshold}
                guideline={guideline}
                onChangeApcaThreshold={value => setState({ apcaThreshold: value })}
                onChangeGuideline={value => setState({ guideline: value })}
                onChangeWcagThreshold={value => setState({ wcagThreshold: value })}
                wcagThreshold={wcagThreshold}
              />
              <Grid guideline={guideline} steps={steps} threshold={threshold} />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
