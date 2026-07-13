import { type KeyboardEvent, memo, useEffect, useId, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger, useDisclosure } from '@heroui/react';
import { ArrowsDownUpIcon, DotsSixVerticalIcon } from '@phosphor-icons/react';
import { Reorder } from 'framer-motion';

import useGenerator from '~/hooks/useGenerator';
import { useGeneratorStoreApi } from '~/hooks/useGeneratorStore';
import { trackEvent } from '~/utils/analytics';

import Button from '~/components/Button';
import ColorBox from '~/components/ColorBox';

import type { ColorEntry } from '~/types';

function ReorderColors() {
  // Only the count is needed to render. The entries themselves are read from the store on open
  // and on commit, so a color edit — every frame of a slider drag — doesn't re-render this.
  const { colorCount, reorderColors } = useGenerator('colorCount', 'reorderColors');
  const storeApi = useGeneratorStoreApi();
  const { isOpen, onOpenChange } = useDisclosure();
  // Local order drives the drag list. The store stays untouched mid-drag, so the
  // main color list doesn't re-render on every pointer move — only on commit.
  const [ordered, setOrdered] = useState<ColorEntry[]>(() => storeApi.getState().colors);
  const [announcement, setAnnouncement] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const titleId = useId();
  const instructionsId = useId();

  // Focus the first handle on open so the arrow keys act immediately — otherwise
  // the user has to blind-tab into the list before the label's promise comes true.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    // Wait a frame: the popover content and its entry animation mount first.
    const frame = requestAnimationFrame(() => {
      listRef.current?.querySelector('button')?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    // Re-seed from the store on open so the list reflects any add/remove/edit
    // that happened while the popover was closed.
    if (open) {
      setOrdered(storeApi.getState().colors);
      setAnnouncement('');
    }

    onOpenChange();
  };

  // Commit once per discrete change — a drop, or a single key press — so the
  // store, and thus the URL/history, records one entry per move. A drag that
  // ends where it started reaches this with an unchanged order; bail out so it
  // doesn't report a reorder that never happened.
  const commit = (list: ColorEntry[]) => {
    const { colors } = storeApi.getState();

    if (list.every((color, index) => color.id === colors[index]?.id)) {
      return;
    }

    reorderColors(list.map(color => color.id));
    trackEvent('color:reorder');
  };

  const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= ordered.length) {
      return;
    }

    const next = [...ordered];
    const [moved] = next.splice(from, 1);

    next.splice(to, 0, moved);

    setOrdered(next);
    commit(next);
    setAnnouncement(`${moved.name} moved to position ${to + 1} of ${next.length}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const destinations: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      End: ordered.length - 1,
      Home: 0,
    };
    const to = destinations[event.key];

    if (to === undefined) {
      return;
    }

    // Keep the popover from scrolling under the arrow keys.
    event.preventDefault();
    handleMove(index, to);
  };

  if (colorCount === 1) {
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
            <p className="mb-2 font-medium text-foreground-500 text-tiny uppercase" id={titleId}>
              Drag or use arrow keys
            </p>
            <span className="sr-only" id={instructionsId}>
              Use the arrow keys to move this color. Home moves it to the top, End to the bottom.
            </span>
            <span aria-live="polite" className="sr-only" role="status">
              {announcement}
            </span>
            <Reorder.Group
              ref={listRef}
              aria-labelledby={titleId}
              axis="y"
              className="space-y-1"
              onReorder={setOrdered}
              values={ordered}
            >
              {ordered.map((color, index) => (
                <Reorder.Item
                  key={color.id}
                  // Ring on :focus, not :focus-visible — the arrow keys act on the focused
                  // row, so it has to be obvious which one that is however it got focused.
                  className="flex cursor-grab items-center gap-2 rounded-medium px-1 py-1.5 select-none has-[button:focus]:bg-default-100 has-[button:focus]:ring-2 has-[button:focus]:ring-focus hover:bg-default-100 active:cursor-grabbing"
                  onDragEnd={() => commit(ordered)}
                  value={color}
                >
                  {/* The grip is the keyboard handle. It stays inside Reorder.Item with no
                      dragControls, so pointerdown still bubbles and the whole row drags as before. */}
                  <button
                    aria-describedby={instructionsId}
                    aria-label={`Reorder ${color.name}, position ${index + 1} of ${ordered.length}`}
                    className="shrink-0 cursor-grab text-foreground-500 text-lg outline-none active:cursor-grabbing"
                    onKeyDown={event => handleKeyDown(event, index)}
                    type="button"
                  >
                    <DotsSixVerticalIcon />
                  </button>
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

// No props, so this never needs to re-render from its parent — and ColorList, which renders it,
// re-renders on every color edit. Its own narrowed subscription (`colorCount`) drives it instead.
export default memo(ReorderColors);
