import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useHref, useNavigate } from 'react-router';
import { HeroUIProvider, type HeroUIProviderProps, ToastProvider } from '@heroui/react';

import ThemeContext from '~/contexts/theme';

interface ThemeProviderProps {
  children: ReactNode;
  heroUIProps?: Omit<HeroUIProviderProps, 'children'>;
}

export default function ThemeProvider({ children, heroUIProps }: ThemeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage for saved preference
    const saved = localStorage.getItem('darkMode');
    // Check system preference if no saved preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    return saved ? saved === 'true' : prefersDark;
  });
  const navigate = useNavigate();

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
      {/* eslint-disable-next-line react-compiler/react-compiler */}
      <HeroUIProvider {...heroUIProps} navigate={navigate} useHref={useHref}>
        <ToastProvider
          placement="bottom-center"
          toastProps={{ shouldShowTimeoutProgress: true, variant: 'solid' }}
        />
        {children}
      </HeroUIProvider>
    </ThemeContext.Provider>
  );
}
