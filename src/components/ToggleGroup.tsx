import { type KeyboardEvent, type ReactNode, useId } from 'react';

import Button from '~/components/Button';

interface ToggleGroupItem<T extends string> {
  label: string;
  value: T;
}

interface ToggleGroupProps<T extends string> {
  /** Optional node rendered between the label and the buttons (e.g. a tooltip). */
  info?: ReactNode;
  items: Array<ToggleGroupItem<T>>;
  label: string;
  onChange: (value: T) => void;
  value: T;
}

/**
 * Segmented single-select. Renders a labelled `radiogroup` where exactly one option is active.
 * Keyboard nav uses a roving tabindex (single tab stop; arrows move selection + focus).
 */
export default function ToggleGroup<T extends string>(props: ToggleGroupProps<T>) {
  const { info, items, label, onChange, value } = props;

  const labelId = useId();

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
    <div className="w-full flex items-center gap-2">
      <span id={labelId}>{label}</span>
      {info}
      <div
        aria-labelledby={labelId}
        className="flex items-center gap-1 bg-default-100 rounded-full"
        onKeyDown={handleKeyDown}
        role="radiogroup"
        tabIndex={-1}
      >
        {items.map(item => (
          <Button
            key={item.value}
            aria-checked={value === item.value}
            className="px-3 rounded-full"
            onPress={() => onChange(item.value)}
            role="radio"
            size="xs"
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
