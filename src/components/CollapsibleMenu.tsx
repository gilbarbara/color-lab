import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@heroui/react';
import { DotsThreeIcon } from '@phosphor-icons/react';

import Button from '~/components/Button';

interface CollapsibleMenuProps {
  children: ReactNode;
  className?: string;
  classNames?: { panel?: string; trigger?: string };
  label?: string;
  triggerIcon?: ReactNode;
}

/**
 * Below `xsm` (400px) the children collapse behind a toggle that opens an overlay
 * dropdown; at `xsm`+ they render inline, always visible. The responsive switch is
 * CSS-only (`xsm:` variants) so SSR and the first client render produce identical
 * markup — the only React state is the small-screen toggle.
 *
 * Hides the collapsed panel with `visibility` (not `inert`) so `xsm:visible` can
 * override it from CSS; `inert` is a JS-set property a media variant can't reach.
 * `xsm` is hardcoded because Tailwind JIT needs literal variant classes.
 */
export default function CollapsibleMenu(props: CollapsibleMenuProps) {
  const { children, className, classNames, label = 'More actions', triggerIcon } = props;
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className={cn('relative flex items-center', className)}>
      <Button
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={label}
        className={cn('xsm:hidden', classNames?.trigger)}
        isIconOnly
        onPress={() => setIsOpen(previous => !previous)}
        size="menu"
        variant="flat"
      >
        {triggerIcon ?? <DotsThreeIcon className="text-lg" weight="bold" />}
      </Button>
      <div
        aria-label={label}
        className={cn(
          'absolute right-0 top-full z-20 mt-1 flex items-center gap-2 rounded-medium bg-content1 p-1 shadow-medium invisible opacity-0 transition-[opacity,visibility] duration-200',
          'data-[open=true]:visible data-[open=true]:opacity-100',
          'xsm:static xsm:visible xsm:opacity-100 xsm:z-auto xsm:mt-0 xsm:bg-transparent xsm:p-0 xsm:shadow-none',
          classNames?.panel,
        )}
        data-open={isOpen}
        id={panelId}
        role="group"
      >
        {children}
      </div>
    </div>
  );
}
