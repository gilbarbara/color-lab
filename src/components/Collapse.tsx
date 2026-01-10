import type { ReactNode } from 'react';
import { cn } from '@heroui/react';

interface CollapseProps {
  children: ReactNode;
  className?: string;
  isOpen: boolean;
}

export default function Collapse({ children, className, isOpen }: CollapseProps) {
  return (
    <div
      className={cn('grid transition-all duration-300', className, {
        'grid-rows-[0fr]': !isOpen,
        'grid-rows-[1fr]': isOpen,
      })}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
