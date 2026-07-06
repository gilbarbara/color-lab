import type { CSSProperties } from 'react';
import { cn } from '@heroui/react';
import { convertCSS } from 'colorizr';

import useGenerator from '~/hooks/useGenerator';
import { formatOklch } from '~/utils/color';

import Tooltip from '~/components/Tooltip';

import ThemeToggle, { type PreviewThemeMode } from './ThemeToggle';

interface HeaderProps {
  activeId: string;
  name: string;
  onSelect: (id: string) => void;
  onThemeChange: (next: PreviewThemeMode) => void;
  themeMode: PreviewThemeMode;
}

export default function Header(props: HeaderProps) {
  const { activeId, name, onSelect, onThemeChange, themeMode } = props;
  const { colors } = useGenerator('colors');

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
        <div className="flex items-center gap-2 px-1">
          {colors.map(color => {
            const isActive = color.id === activeId;
            const oklch = formatOklch(color.value);
            const hex = convertCSS(color.value, 'hex');

            return (
              <Tooltip key={color.id} content={color.name} placement="bottom">
                <button
                  aria-label={`Use ${color.name} as primary`}
                  aria-pressed={isActive}
                  className={cn(
                    'size-5 rounded-full transition-transform',
                    'bg-(--gamut-bg-oklch) text-(--gamut-bg-oklch)',
                    'gamut-srgb:bg-(--gamut-bg-hex) gamut-srgb:text-(--gamut-bg-hex)',
                    {
                      'ring-2 ring-current ring-offset-2 ring-offset-content1': isActive,
                      'hover:scale-110': !isActive,
                    },
                  )}
                  onClick={() => onSelect(color.id)}
                  style={
                    {
                      '--gamut-bg-oklch': oklch,
                      '--gamut-bg-hex': hex,
                    } as CSSProperties
                  }
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
