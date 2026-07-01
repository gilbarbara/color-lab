'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { normalizePathname, trackPage } from '~/utils/analytics';

export default function usePageTracking(): void {
  const pathname = usePathname();

  const url = normalizePathname(pathname);

  useEffect(() => {
    if (url) {
      trackPage();
    }
  }, [url]);
}
