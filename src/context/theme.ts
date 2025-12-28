import { createContext } from 'react';

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
