import type { ReactNode } from 'react';
import { Button } from '@heroui/react';
import { LightningIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';

import Tooltip from '~/components/Tooltip';

export type PreviewThemeMode = 'auto' | 'light' | 'dark';

const ORDER: PreviewThemeMode[] = ['auto', 'light', 'dark'];

const ICONS: Record<PreviewThemeMode, ReactNode> = {
  auto: <LightningIcon />,
  light: <SunIcon />,
  dark: <MoonIcon />,
};

const LABELS: Record<PreviewThemeMode, string> = {
  auto: 'Auto',
  light: 'Light',
  dark: 'Dark',
};

interface ThemeToggleProps {
  mode: PreviewThemeMode;
  onChange: (next: PreviewThemeMode) => void;
}

export default function ThemeToggle({ mode, onChange }: ThemeToggleProps) {
  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];

  return (
    <Tooltip content={`Preview theme: ${LABELS[mode]}`} placement="bottom">
      <Button
        aria-label="Toggle preview theme"
        className="text-md"
        isIconOnly
        onPress={() => onChange(next)}
        size="sm"
        variant="light"
      >
        {ICONS[mode]}
      </Button>
    </Tooltip>
  );
}
