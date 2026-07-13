'use client';

import type { ReactNode } from 'react';
import { createContext, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { PALETTE_PATH_PREFIX } from '~/config/globals';
import { createGeneratorStore, type GeneratorStoreApi } from '~/stores/generatorStore';
import { parsePaletteFromUrl } from '~/utils/url';

import type { GeneratorState } from '~/types';

export const GeneratorStoreContext = createContext<GeneratorStoreApi | null>(null);

interface GeneratorStoreProviderProps {
  children: ReactNode;
  fallbackPalette: GeneratorState;
}

export default function GeneratorStoreProvider({
  children,
  fallbackPalette,
}: GeneratorStoreProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storeRef = useRef<GeneratorStoreApi | null>(null);

  if (storeRef.current === null) {
    // Self-initialize so server and client first render match without a "mutate
    // store during render" hack. On /p/* both sides parse the same URL; elsewhere
    // both sides reuse the server-generated `fallbackPalette` prop (a single
    // serialized random palette) instead of each rolling their own.
    const search = searchParams.toString();
    const url = `${pathname}${search ? `?${search}` : ''}`;
    const parsed = pathname.startsWith(`${PALETTE_PATH_PREFIX}/`) ? parsePaletteFromUrl(url) : null;

    storeRef.current = createGeneratorStore(parsed?.state ?? fallbackPalette);
  }

  return (
    <GeneratorStoreContext.Provider value={storeRef.current}>
      {children}
    </GeneratorStoreContext.Provider>
  );
}
