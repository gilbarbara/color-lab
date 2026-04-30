import { type ReactNode, useRef, useState } from 'react';
import { cn } from '@heroui/react';
import { AnimatePresence, type Easing, motion } from 'framer-motion';

interface CollapseProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  ease?: Easing | Easing[];
  isOpen: boolean;
  onAnimationComplete?: (isOpen: boolean) => void;
}

export default function Collapse(props: CollapseProps) {
  const { children, className, duration = 0.3, ease, isOpen, onAnimationComplete } = props;
  const [isAnimating, setIsAnimating] = useState(false);
  const isOpenRef = useRef<boolean>(false);

  isOpenRef.current = isOpen;

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          animate={{ height: 'auto', opacity: 1 }}
          className={cn(isAnimating && 'overflow-hidden', className)}
          exit={{ height: 0, opacity: 0 }}
          initial={{ height: 0, opacity: 0 }}
          onAnimationComplete={() => {
            setIsAnimating(false);
            onAnimationComplete?.(isOpenRef.current);
          }}
          onAnimationStart={() => setIsAnimating(true)}
          transition={{ duration, ease }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
