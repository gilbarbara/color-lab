'use client';

import { useEffect, useState } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

export interface ThemeContextType {
  isDarkMode: boolean;
  isMounted: boolean;
  toggleDarkMode: () => void;
}

export default function useTheme(): ThemeContextType {
  const { resolvedTheme, setTheme } = useNextTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDarkMode = isMounted && resolvedTheme === 'dark';

  const toggleDarkMode = () => {
    if (!isMounted) return;

    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return { isDarkMode, isMounted, toggleDarkMode };
}
