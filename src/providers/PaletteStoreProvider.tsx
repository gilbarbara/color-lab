'use client';

import type { ReactNode } from 'react';
import { createContext, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { createPaletteStore, type PaletteStoreApi } from '~/stores/paletteStore';
import { parsePaletteFromUrl } from '~/utils/url';

import type { PaletteState } from '~/types';

export const PaletteStoreContext = createContext<PaletteStoreApi | null>(null);

interface PaletteStoreProviderProps {
  children: ReactNode;
  fallbackPalette: PaletteState;
}

export default function PaletteStoreProvider({
  children,
  fallbackPalette,
}: PaletteStoreProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storeRef = useRef<PaletteStoreApi | null>(null);

  if (storeRef.current === null) {
    // Self-initialize so server and client first render match without a "mutate
    // store during render" hack. On /p/* both sides parse the same URL; elsewhere
    // both sides reuse the server-generated `fallbackPalette` prop (a single
    // serialized random palette) instead of each rolling their own.
    const search = searchParams.toString();
    const url = `${pathname}${search ? `?${search}` : ''}`;
    const parsed = pathname.startsWith('/p/') ? parsePaletteFromUrl(url) : null;

    storeRef.current = createPaletteStore(parsed?.state ?? fallbackPalette);
  }

  return (
    <PaletteStoreContext.Provider value={storeRef.current}>{children}</PaletteStoreContext.Provider>
  );
}
