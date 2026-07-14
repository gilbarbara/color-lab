import {
  Children,
  cloneElement,
  type FocusEvent,
  isValidElement,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { clamp } from '@gilbarbara/helpers';
import { cn } from '@heroui/react';

interface Coords {
  arrowOffset: number;
  isTop: boolean;
  left: number;
  top: number;
}

export type TooltipColor = 'danger' | 'tooltip';

export type TooltipPlacement =
  'bottom' | 'bottom-start' | 'bottom-end' | 'top' | 'top-start' | 'top-end';

export type TooltipSize = 'lg' | 'md';

export interface TooltipProps {
  /** The trigger. A single element with a forwarded ref. */
  children: ReactElement;
  /** `base`/`content` both map onto the floating panel (single element here). */
  classNames?: { base?: string; content?: string };
  /** @default 'tooltip' */
  color?: TooltipColor;
  content: ReactNode;
  /** Open delay in ms (hover only). @default 250 */
  delay?: number;
  isDisabled?: boolean;
  /** Controlled open state. Omit for uncontrolled hover/focus. */
  isOpen?: boolean;
  /** @default 'bottom-start' */
  placement?: TooltipPlacement;
  /** @default 'tooltip' */
  role?: string;
  /** @default true */
  showArrow?: boolean;
  /** @default 'md' */
  size?: TooltipSize;
}

const GAP = 8;
const EDGE_MARGIN = 4;
const ARROW_SIZE = 8;
// Grace period before a hover tooltip closes, so the pointer can cross the GAP
// onto the panel without it vanishing (WCAG 1.4.13 "Hoverable").
const CLOSE_DELAY = 150;

const PANEL: Record<TooltipColor, string> = {
  tooltip: 'bg-tooltip text-foreground',
  danger: 'bg-danger text-danger-foreground',
};

const ARROW: Record<TooltipColor, string> = {
  tooltip: 'bg-tooltip',
  danger: 'bg-danger',
};

const SIZE: Record<TooltipSize, string> = {
  md: 'text-small px-2 py-1',
  lg: 'text-medium px-2.5 py-1.5',
};

// Pull the panel's text toward the trigger edge, compensating the panel's
// horizontal padding. Centered placements stay put. The panel is `position:
// fixed` with `left` set, so only margin-left shifts its x — `-end` must nudge
// right via a positive margin-left, not margin-right (which is a no-op here).
const ALIGN_MARGIN: Record<'' | '-end' | '-start', string> = {
  '-start': '-ml-2',
  '-end': 'ml-2',
  '': '',
};

function chain<E>(...handlers: Array<((event: E) => void) | undefined>) {
  return (event: E) => {
    for (const handler of handlers) handler?.(event);
  };
}

function computeCoords(
  placement: TooltipPlacement,
  triggerRect: DOMRect,
  contentRect: DOMRect,
  marginOffset: number,
): Coords {
  const isTop = placement.startsWith('top');
  const top = isTop ? triggerRect.top - contentRect.height - GAP : triggerRect.bottom + GAP;

  const alignment = getAlignment(placement);
  let left: number;

  if (alignment === '-start') {
    left = triggerRect.left;
  } else if (alignment === '-end') {
    left = triggerRect.right - contentRect.width;
  } else {
    left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
  }

  const maxLeft = window.innerWidth - contentRect.width - EDGE_MARGIN;
  const maxTop = window.innerHeight - contentRect.height - EDGE_MARGIN;
  const clampedLeft = clamp(left, EDGE_MARGIN, Math.max(maxLeft, EDGE_MARGIN));

  // Keep the arrow pointing at the trigger center even after edge-clamping,
  // start/end alignment, or the ALIGN_MARGIN shift moves the panel away from
  // center. The panel renders at clampedLeft + marginOffset (the CSS margin),
  // so the arrow's panel-local offset must subtract that shift.
  const triggerCenter = triggerRect.left + triggerRect.width / 2;
  const arrowOffset = clamp(
    triggerCenter - clampedLeft - marginOffset,
    ARROW_SIZE,
    Math.max(contentRect.width - ARROW_SIZE, ARROW_SIZE),
  );

  return {
    arrowOffset,
    isTop,
    left: clampedLeft,
    top: clamp(top, EDGE_MARGIN, Math.max(maxTop, EDGE_MARGIN)),
  };
}

function getAlignment(placement: TooltipPlacement): '' | '-end' | '-start' {
  if (placement.endsWith('-start')) return '-start';
  if (placement.endsWith('-end')) return '-end';

  return '';
}

// Flatten a ReactNode to its text, so a tooltip whose markup is purely cosmetic
// (<span>View Charts</span>) is still recognized as a restatement of the name.
// The Tooltip's child isn't always the trigger: HeroUI's Dropdown/Popover triggers drop a
// cloned ref (heroui#1265), so call sites wrap them in a positioning div. Look through the
// wrapper for the labelled element rather than reading the div's flattened text.
function getAriaLabel(node: ReactNode): string | undefined {
  if (Array.isArray(node)) {
    for (const item of node) {
      const label = getAriaLabel(item);

      if (label) {
        return label;
      }
    }

    return undefined;
  }

  if (!isValidElement(node)) {
    return undefined;
  }

  const childProps = node.props as { 'aria-label'?: string; children?: ReactNode };

  return childProps['aria-label'] ?? getAriaLabel(childProps.children);
}

function getNodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join(' ');
  }

  if (isValidElement(node)) {
    return getNodeText((node.props as { children?: ReactNode }).children);
  }

  return '';
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function resolvePlacement(
  preferred: TooltipPlacement,
  triggerRect: DOMRect,
  contentRect: DOMRect,
): TooltipPlacement {
  const fitsTop = triggerRect.top - GAP >= contentRect.height;
  const fitsBottom = window.innerHeight - triggerRect.bottom - GAP >= contentRect.height;
  const isTop = preferred.startsWith('top');
  const alignment = getAlignment(preferred);

  if (isTop && !fitsTop && fitsBottom) return `bottom${alignment}`;
  if (!isTop && !fitsBottom && fitsTop) return `top${alignment}`;

  return preferred;
}

function setRef<T>(target: Ref<T> | undefined, node: T | null) {
  if (typeof target === 'function') {
    target(node);
  } else if (target) {
    // eslint-disable-next-line no-param-reassign
    (target as { current: T | null }).current = node;
  }
}

export default function Tooltip(props: TooltipProps) {
  const {
    children,
    classNames,
    color = 'tooltip',
    content,
    delay = 250,
    isDisabled = false,
    isOpen: isOpenProp,
    placement = 'bottom-start',
    role = 'tooltip',
    showArrow = true,
    size = 'md',
  } = props;
  const isControlled = isOpenProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = !isDisabled && (isControlled ? isOpenProp : uncontrolledOpen);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoverCapable, setHoverCapable] = useState(true);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = `tooltip-${useId()}`;
  // Internal hover/focus handlers only when uncontrolled; controlled callers own it.
  const useHover = !isControlled && hoverCapable;

  const reposition = useCallback(() => {
    if (!triggerRef.current || !contentRef.current) {
      return;
    }

    const el = contentRef.current;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = el.getBoundingClientRect();
    // The applied ALIGN_MARGIN shifts the rendered panel away from the inline
    // `left` we set. Measure it from the DOM so the arrow stays on the trigger
    // regardless of which margin (or none) is in effect.
    const marginOffset = contentRect.left - (parseFloat(el.style.left) || 0);
    const resolved = resolvePlacement(placement, triggerRect, contentRect);

    setCoords(computeCoords(resolved, triggerRect, contentRect, marginOffset));
  }, [placement]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mql = window.matchMedia('(hover: hover) and (pointer: fine)');

    setHoverCapable(mql.matches);

    const handleChange = (event: MediaQueryListEvent) => setHoverCapable(event.matches);

    mql.addEventListener('change', handleChange);

    return () => mql.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      setIsVisible(false);

      return undefined;
    }

    reposition();

    const frame = requestAnimationFrame(() => setIsVisible(true));

    return () => cancelAnimationFrame(frame);
  }, [isOpen, reposition]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    window.addEventListener('scroll', reposition, { capture: true, passive: true });
    window.addEventListener('resize', reposition);

    return () => {
      window.removeEventListener('scroll', reposition, { capture: true });
      window.removeEventListener('resize', reposition);
    };
  }, [isOpen, reposition]);

  // Recenter when the panel itself resizes — e.g. `content` swapping to a
  // narrower/wider value while open. Observing the node keeps the arrow on the
  // trigger regardless of content identity (string or JSX).
  useEffect(() => {
    if (!isOpen || !contentRef.current || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => reposition());

    observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, [isOpen, reposition]);

  useEffect(
    () => () => {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
    },
    [],
  );

  // Escape dismisses an uncontrolled tooltip without moving focus (WCAG 1.4.13
  // "Dismissible"). Document-level so it also fires for hover-opened tooltips
  // whose focus is elsewhere. Controlled callers own their own dismissal.
  useEffect(() => {
    if (!isOpen || isControlled) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Consume the key so it dismisses only this tooltip. Capture phase, so
        // it lands before an enclosing overlay's own Escape handler and the two
        // don't close on the same keypress.
        event.stopPropagation();
        clearTimeout(openTimer.current);
        clearTimeout(closeTimer.current);
        setUncontrolledOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, isControlled]);

  const child = Children.only(children) as ReactElement<{
    'aria-describedby'?: string;
    'aria-label'?: string;
    children?: ReactNode;
    onBlur?: (event: FocusEvent) => void;
    onClick?: (event: MouseEvent) => void;
    onFocus?: (event: FocusEvent) => void;
    onPointerEnter?: (event: PointerEvent) => void;
    onPointerLeave?: (event: PointerEvent) => void;
    ref?: Ref<HTMLElement>;
  }>;
  // React 19 puts ref on props; React 18 and below put it on the element.
  // Only fall through to element.ref when props.ref is absent — accessing
  // element.ref on React 19 logs a deprecation warning.
  const propsRef = child.props.ref;
  const childRef =
    propsRef !== undefined ? propsRef : (child as unknown as { ref?: Ref<HTMLElement> }).ref;

  const mergedRef = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      setRef(childRef, node);
    },
    [childRef],
  );

  // A tooltip that only restates the trigger's accessible name is a visual affordance:
  // describing with it makes screen readers announce the same words twice. Only wire
  // aria-describedby when the tooltip carries something the name doesn't already have.
  const triggerName = getAriaLabel(child) ?? getNodeText(child.props.children);
  const tooltipText = getNodeText(content);
  const describes = !!tooltipText && !normalize(triggerName).includes(normalize(tooltipText));

  const triggerProps: Record<string, unknown> = {
    ref: mergedRef,
    'aria-describedby':
      describes && isOpen
        ? (child.props['aria-describedby'] ?? id)
        : child.props['aria-describedby'],
  };

  if (useHover) {
    triggerProps.onPointerEnter = chain(child.props.onPointerEnter, event => {
      if (event.pointerType !== 'mouse') {
        return;
      }

      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);

      if (delay > 0) {
        openTimer.current = setTimeout(() => setUncontrolledOpen(true), delay);
      } else {
        setUncontrolledOpen(true);
      }
    });
    triggerProps.onPointerLeave = chain(child.props.onPointerLeave, event => {
      if (event.pointerType !== 'mouse') {
        return;
      }

      clearTimeout(openTimer.current);
      closeTimer.current = setTimeout(() => setUncontrolledOpen(false), CLOSE_DELAY);
    });
    // Open on keyboard focus only. Mouse/programmatic focus restoration (e.g. an
    // overlay returning focus to its trigger on close) is not :focus-visible, and
    // must not pop the tooltip back open (WCAG 1.4.13 was for hover/focus intent).
    // Test `target`, not `currentTarget`: when the child is a wrapper (heroui#1265) the
    // handler sits on the wrapper, which is never focused — only the button inside is.
    triggerProps.onFocus = chain(child.props.onFocus, (event: FocusEvent) => {
      if (event.target.matches(':focus-visible')) {
        setUncontrolledOpen(true);
      }
    });
    triggerProps.onBlur = chain(child.props.onBlur, () => setUncontrolledOpen(false));
    // Activating the trigger (click or keyboard Enter/Space) dismisses the tooltip.
    // Clicking fires neither pointerleave (pointer still over) nor blur (focus moves
    // onto the trigger), so without this an opened tooltip lingers after a click.
    triggerProps.onClick = chain(child.props.onClick, () => {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
      setUncontrolledOpen(false);
    });
  }

  return (
    <>
      {cloneElement(child, triggerProps)}
      {isOpen &&
        createPortal(
          <div
            ref={contentRef}
            aria-hidden={!describes || undefined}
            className={cn(
              'fixed z-50 w-max transition-opacity duration-150',
              'max-w-64 rounded-small shadow-lg',
              SIZE[size],
              PANEL[color],
              coords && isVisible ? 'opacity-100' : 'opacity-0',
              ALIGN_MARGIN[getAlignment(placement)],
              classNames?.base,
              classNames?.content,
            )}
            data-state={coords && isVisible ? 'open' : 'closed'}
            data-testid="Tooltip"
            id={id}
            role={role}
            style={{ left: coords?.left ?? 0, top: coords?.top ?? 0 }}
            // Keep the tooltip open while the pointer is over the panel, and
            // close it (after the grace period) once it leaves (WCAG 1.4.13
            // "Hoverable"). Hover-mode only; controlled callers own their state.
            {...(useHover && {
              onPointerEnter: (event: PointerEvent) => {
                if (event.pointerType !== 'mouse') {
                  return;
                }

                clearTimeout(closeTimer.current);
              },
              onPointerLeave: (event: PointerEvent) => {
                if (event.pointerType !== 'mouse') {
                  return;
                }

                closeTimer.current = setTimeout(() => setUncontrolledOpen(false), CLOSE_DELAY);
              },
            })}
          >
            {content}
            {showArrow && coords && (
              <span
                className={cn('absolute size-2 rotate-45', ARROW[color])}
                style={{
                  left: coords.arrowOffset,
                  marginLeft: -ARROW_SIZE / 2,
                  ...(coords.isTop ? { bottom: -ARROW_SIZE / 2 } : { top: -ARROW_SIZE / 2 }),
                }}
              />
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
