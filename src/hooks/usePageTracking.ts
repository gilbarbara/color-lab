'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { trackPage } from '~/utils/analytics';

function normalizePathname(pathname: string): string | null {
  if (pathname === '/') return '/';
  if (pathname === '/about') return '/about';
  if (pathname === '/palettes') return '/palettes';
  if (pathname === '/privacy') return '/privacy';
  if (pathname === '/terms') return '/terms';
  if (pathname === '/p' || pathname.startsWith('/p/')) return '/generator';

  return null;
}

export default function usePageTracking(): void {
  const pathname = usePathname();

  useEffect(() => {
    const url = normalizePathname(pathname);

    if (url) {
      trackPage(url);
    }
  }, [pathname]);
}
