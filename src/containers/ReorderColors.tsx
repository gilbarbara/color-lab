import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger, useDisclosure } from '@heroui/react';
import { ArrowsDownUpIcon, DotsSixVerticalIcon } from '@phosphor-icons/react';
import { Reorder } from 'framer-motion';

import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';

import Button from '~/components/Button';
import ColorBox from '~/components/ColorBox';

import type { ColorEntry } from '~/types';

export default function ReorderColors() {
  const { colors, reorderColors } = useGenerator('colors', 'reorderColors');
  const { isOpen, onOpenChange } = useDisclosure();
  // Local order drives the drag list. The store stays untouched mid-drag, so the
  // main color list doesn't re-render on every pointer move — only on commit.
  const [ordered, setOrdered] = useState<ColorEntry[]>(colors);

  const handleOpenChange = (open: boolean) => {
    // Re-seed from the store on open so the list reflects any add/remove/edit
    // that happened while the popover was closed.
    if (open) {
      setOrdered(colors);
    }

    onOpenChange();
  };

  // Commit once per drop (not per onReorder tick) so the store — and thus the
  // URL/history — records a single structural change per drag.
  const handleCommit = () => {
    reorderColors(ordered.map(color => color.id));
    trackEvent('color:reorder');
  };

  if (colors.length === 1) {
    return null;
  }

  return (
    <div className="flex justify-end mt-4">
      <Popover
        backdrop="opaque"
        isNonModal={false}
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        placement="top-end"
        shouldCloseOnScroll={false}
        showArrow
      >
        <PopoverTrigger>
          <Button
            aria-label="Reorder colors"
            size="menu"
            startContent={<ArrowsDownUpIcon className="text-lg" />}
            variant="flat"
          >
            Reorder
          </Button>
        </PopoverTrigger>
        <PopoverContent className="px-3 py-2">
          <div className="w-56" data-testid="ReorderColors">
            <p className="mb-2 font-medium text-foreground-500 text-tiny uppercase">
              Drag to reorder
            </p>
            <Reorder.Group axis="y" className="space-y-1" onReorder={setOrdered} values={ordered}>
              {ordered.map(color => (
                <Reorder.Item
                  key={color.id}
                  className="flex cursor-grab items-center gap-2 rounded-medium px-1 py-1.5 select-none hover:bg-default-100 active:cursor-grabbing"
                  onDragEnd={handleCommit}
                  value={color}
                >
                  <DotsSixVerticalIcon className="shrink-0 text-foreground-500 text-lg" />
                  <ColorBox as="span" color={color.value} size="xs" />
                  <span className="truncate text-small">{color.name}</span>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
