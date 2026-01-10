import { Button } from '@heroui/react';
import { MoonIcon, SunIcon } from '@phosphor-icons/react';

import { useTheme } from '~/hooks/useTheme';

export default function Header() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-10 flex items-center bg-background border-b border-default">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4">
        <h1 aria-label="ColorMeUp LAB" className="flex items-start gap-1">
          <img alt="Lab" className="h-8" src="/brand/logo.svg" />
          <span className="font-bold text-sm">LAB</span>
        </h1>
        <Button aria-label="Toggle dark mode" isIconOnly onPress={toggleDarkMode} variant="light">
          {isDarkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
        </Button>
      </div>
    </header>
  );
}
