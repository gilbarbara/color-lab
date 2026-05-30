'use client';

import type { MouseEvent, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  children: ReactNode | ((p: NavLinkRenderProps) => ReactNode);
  className?: string | ((p: NavLinkRenderProps) => string | undefined);
  end?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  to: string;
}

interface NavLinkRenderProps {
  isActive: boolean;
  isPending: false;
  isTransitioning: false;
}

export default function NavLink({ children, className, end, onClick, to }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const props: NavLinkRenderProps = { isActive, isPending: false, isTransitioning: false };

  return (
    <Link
      aria-current={isActive ? 'page' : undefined}
      className={typeof className === 'function' ? className(props) : className}
      href={to}
      onClick={onClick}
    >
      {typeof children === 'function' ? children(props) : children}
    </Link>
  );
}

export type { NavLinkRenderProps };
