'use client';

import type { ReactNode } from 'react';
import { HeroUIProvider, type HeroUIProviderProps, ToastProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useRouter } from 'next/navigation';

interface ThemeProviderProps {
  children: ReactNode;
  heroUIProps?: Omit<HeroUIProviderProps, 'children'>;
}

export default function ThemeProvider({ children, heroUIProps }: ThemeProviderProps) {
  const router = useRouter();

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <HeroUIProvider {...heroUIProps} navigate={href => router.push(href)} useHref={href => href}>
        {/* The toast region defaults to `z-[100]`, which sits under `.overlay-root` (z-200, see
            src/index.css) — so a toast raised from inside a modal renders behind it and can't even
            be clicked to dismiss. It has to outrank the overlay layer. */}
        <ToastProvider
          placement="bottom-center"
          regionProps={{ className: 'z-300' }}
          toastProps={{ shouldShowTimeoutProgress: true, variant: 'solid' }}
        />
        {children}
      </HeroUIProvider>
    </NextThemesProvider>
  );
}
