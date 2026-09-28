'use client';

import { useHydrated, useTheme as useThemeContext } from '@wrksz/themes/client';

export interface ThemeContextType {
  isDarkMode: boolean;
  isMounted: boolean;
  toggleDarkMode: () => void;
}

export default function useTheme(): ThemeContextType {
  const { resolvedTheme, setTheme } = useThemeContext();
  const isMounted = useHydrated();

  const isDarkMode = isMounted && resolvedTheme === 'dark';

  const toggleDarkMode = () => {
    if (!isMounted) return;

    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return { isDarkMode, isMounted, toggleDarkMode };
}
