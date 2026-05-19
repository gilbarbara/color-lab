import { cn } from '@heroui/react';
import { convertCSS } from 'colorizr';

import Tooltip from '~/components/Tooltip';

import type { ColorEntry, Gamut } from '~/types';

import ThemeToggle, { type PreviewThemeMode } from './ThemeToggle';

interface HeaderProps {
  activeId: string;
  colors: ColorEntry[];
  gamut: Gamut;
  name: string;
  onSelect: (id: string) => void;
  onThemeChange: (next: PreviewThemeMode) => void;
  themeMode: PreviewThemeMode;
}

export default function Header(props: HeaderProps) {
  const { activeId, colors, gamut, name, onSelect, onThemeChange, themeMode } = props;

  return (
    <div
      className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between"
      data-testid="Preview-Header"
    >
      <div className="flex items-center justify-between gap-2 lg:justify-start">
        <p className="font-bold text-lg">{name}</p>
        <ThemeToggle mode={themeMode} onChange={onThemeChange} />
      </div>
      {colors.length > 1 && (
        <div className="flex items-center gap-2">
          {colors.map(color => {
            const isActive = color.id === activeId;
            const displayValue = gamut === 'srgb' ? convertCSS(color.value, 'hex') : color.value;

            return (
              <Tooltip key={color.id} content={color.name} placement="bottom">
                <button
                  aria-label={`Use ${color.name} as primary`}
                  aria-pressed={isActive}
                  className={cn('size-5 rounded-full transition-transform', {
                    'ring-2 ring-current ring-offset-2 ring-offset-content1': isActive,
                    'hover:scale-110': !isActive,
                  })}
                  onClick={() => onSelect(color.id)}
                  style={{ backgroundColor: displayValue, color: displayValue }}
                  type="button"
                />
              </Tooltip>
            );
          })}
        </div>
      )}
    </div>
  );
}
