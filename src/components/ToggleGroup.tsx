import { type KeyboardEvent, type ReactNode, useId } from 'react';
import { cn } from '@heroui/react';

import Button from '~/components/Button';

interface ToggleGroupItem<T extends string> {
  label: string;
  value: T;
}

interface ToggleGroupProps<T extends string> {
  className?: string;
  /** Overrides for the label, the radiogroup wrapper and the items, when the pill row doesn't fit. */
  classNames?: {
    group?: string;
    item?: string;
    label?: string;
  };
  /** Optional node rendered between the label and the buttons (e.g. a tooltip). */
  info?: ReactNode;
  items: Array<ToggleGroupItem<T>>;
  /**
   * Visible label. Also the group's accessible name, via `aria-labelledby` — so a node resolves
   * to its text content (`<span>APCA L<sup>c</sup></span>` names the group "APCA Lc").
   */
  label: ReactNode;
  onChange: (value: T) => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  value: T;
}

/**
 * Segmented single-select. Renders a labelled `radiogroup` where exactly one option is active.
 * Keyboard nav uses a roving tabindex (single tab stop; arrows move selection + focus).
 */
export default function ToggleGroup<T extends string>(props: ToggleGroupProps<T>) {
  const {
    className,
    classNames,
    info,
    items,
    label,
    onChange,
    orientation = 'horizontal',
    size = 'xs',
    value,
  } = props;

  const labelId = useId();
  const isVertical = orientation === 'vertical';

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = items.findIndex(item => item.value === value);
    let next: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (current + 1) % items.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (current - 1 + items.length) % items.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    onChange(items[next].value);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div
      className={cn(
        isVertical ? 'w-full flex flex-col items-start gap-2' : 'w-full flex items-center gap-2',
        className,
      )}
    >
      <span className={classNames?.label} id={labelId}>
        {label}
      </span>
      {info}
      {/* No `aria-orientation`: `orientation` drives layout only, and a consumer that overrides the
          axis via `classNames.group` (the sidebar is `flex-row` below `md`) would desync the two.
          The key handler accepts both arrow axes regardless. */}
      <div
        aria-labelledby={labelId}
        className={cn(
          isVertical
            ? 'w-full flex flex-col gap-1'
            : 'flex items-center gap-1 bg-default-100 rounded-full',
          classNames?.group,
        )}
        onKeyDown={handleKeyDown}
        role="radiogroup"
        tabIndex={-1}
      >
        {items.map(item => (
          <Button
            key={item.value}
            aria-checked={value === item.value}
            className={cn(isVertical ? 'justify-start' : 'px-3 rounded-full', classNames?.item)}
            onPress={() => onChange(item.value)}
            role="radio"
            size={size}
            tabIndex={value === item.value ? 0 : -1}
            variant={value === item.value ? 'solid' : 'light'}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
