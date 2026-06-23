'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { trackPage } from '~/utils/analytics';

function normalizePathname(pathname: string): string | null {
  // Collapse high-cardinality palette URLs into a single page.
  if (pathname === '/p' || pathname.startsWith('/p/')) return '/generator';
  // Skip auth routes (robots-disallowed, no analytics value).
  if (pathname.startsWith('/auth/')) return null;

  return pathname;
}

export default function usePageTracking(): void {
  const pathname = usePathname();

  const url = normalizePathname(pathname);

  useEffect(() => {
    if (url) {
      trackPage(url);
    }
  }, [url]);
}
