'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@heroui/react';

import Footer from '~/components/Footer';

interface PageProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Page(props: PageProps) {
  const { children, className, ...rest } = props;

  return (
    <div className="flex flex-col flex-1" {...rest}>
      <div className={cn('w-full max-w-7xl mx-auto flex-1 py-8 px-4 md:px-8', className)}>
        {children}
      </div>
      <Footer />
    </div>
  );
}
