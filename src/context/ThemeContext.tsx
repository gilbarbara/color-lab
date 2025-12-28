import type { JSX, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { HeroUIProvider, type HeroUIProviderProps, ToastProvider } from '@heroui/react';

import { ThemeContext } from './theme';

interface ThemeProviderProps {
  children: ReactNode;
  heroUIProps?: Omit<HeroUIProviderProps, 'children'>;
}

export function ThemeProvider({ children, heroUIProps }: ThemeProviderProps): JSX.Element {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage for saved preference
    const saved = localStorage.getItem('darkMode');
    // Check system preference if no saved preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    return saved ? saved === 'true' : prefersDark;
  });

  useEffect(() => {
    // Update document class when dark mode changes
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save preference to local storage
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = (): void => {
    setIsDarkMode(previous => !previous);
  };

  const contextValue = useMemo(() => ({ isDarkMode, toggleDarkMode }), [isDarkMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <HeroUIProvider {...heroUIProps}>
        <ToastProvider toastProps={{ shouldShowTimeoutProgress: true }} />
        {children}
      </HeroUIProvider>
    </ThemeContext.Provider>
  );
}
