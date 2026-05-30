import { type HTMLProps, type ReactNode } from 'react';
import { cn } from '@heroui/react';

interface CollapsePanelProps extends HTMLProps<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  isOpen: boolean;
  openClassName?: string;
}

/**
 * Pure-CSS collapse for dynamic-height content. Uses the grid
 * `0fr ↔ 1fr` + inner `overflow-hidden` technique driven by a `data-open`
 * attribute, so it animates without JS height measurement and stays SSR-safe
 * (content is always mounted). Transitions height and opacity.
 *
 * Pass `openClassName` to drive the open paint from an ancestor `<html>` data
 * attribute (e.g. `preview-open:grid-rows-[1fr] preview-open:opacity-100`)
 * instead of the React-controlled `data-open`. This lets a pre-paint script set
 * the correct initial state before hydration, avoiding a flash. When provided
 * it replaces the `data-open` open rule entirely (the store-default `data-open`
 * would otherwise win pre-hydration for default-open panels).
 */
export default function CollapsePanel(props: CollapsePanelProps) {
  const { children, className, isOpen, openClassName, ...rest } = props;

  return (
    <div
      className={cn(
        'grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-in-out',
        openClassName ?? 'data-[open=true]:grid-rows-[1fr] data-[open=true]:opacity-100',
        className,
      )}
      data-open={isOpen}
      {...rest}
    >
      {/* `inert` keeps collapsed content out of the tab order / a11y tree —
          parity with the unmounting framer Collapse this replaces. */}
      <div className="overflow-hidden" inert={!isOpen}>
        {children}
      </div>
    </div>
  );
}
