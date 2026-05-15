import { useEffect, useRef } from 'react';
import { useSetState } from '@gilbarbara/hooks';
import { cn, Divider } from '@heroui/react';
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import { parseCSS } from 'colorizr';
import { animate } from 'framer-motion';

import { HEADER_HEIGHT } from '~/config/globals';
import usePalette from '~/hooks/usePalette';
import useTheme from '~/hooks/useTheme';
import { useAppStore } from '~/stores/appStore';
import { buildPreviewScope } from '~/utils/preview-tokens';

import Cards from './Cards';
import Controls from './Controls';
import Header from './Header';
import { type PreviewThemeMode } from './ThemeToggle';
import Toolbar from './Toolbar';

interface PreviewState {
  themeOverrides: Record<string, PreviewThemeMode>;
}

function autoTheme(color: string, isAppDark: boolean): 'light' | 'dark' {
  const { l } = parseCSS(color, 'oklch');

  if (l >= 0.9) return 'dark';
  if (l <= 0.3) return 'light';

  return isAppDark ? 'dark' : 'light';
}

export default function Preview() {
  const { isDarkMode } = useTheme();
  const { colors, previewColorId, setPreviewColor } = usePalette();
  const { previewScrollNonce, showPreview, togglePreview } = useAppStore();

  const [{ themeOverrides }, setState] = useSetState<PreviewState>({
    themeOverrides: {},
  });

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;

    if (previewScrollNonce === 0 || !el) {
      return undefined;
    }

    const startY = window.scrollY;
    const spacingY = HEADER_HEIGHT + 16;
    const targetY = startY + el.getBoundingClientRect().top - spacingY;

    const controls = animate(startY, targetY, {
      duration: 0.5,
      ease: 'easeInOut',
      onUpdate: y => window.scrollTo(0, y),
    });

    const cancel = () => {
      controls.stop();
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
    };

    window.addEventListener('wheel', cancel, { passive: true, once: true });
    window.addEventListener('touchstart', cancel, { passive: true, once: true });

    return cancel;
  }, [previewScrollNonce]);

  const handleSelect = (selectedId: string) => {
    setPreviewColor(selectedId);
  };

  const activeColor = colors.find(c => c.id === previewColorId) ?? colors[0];

  if (!activeColor) {
    return null;
  }

  const mode = themeOverrides[activeColor.id] ?? 'auto';
  const previewTheme = mode === 'auto' ? autoTheme(activeColor.value, isDarkMode) : mode;
  const scope = buildPreviewScope(activeColor.value, previewTheme);

  return (
    <section
      ref={ref}
      className={cn(
        'w-full flex flex-col rounded-lg p-4 transition-background duration-500',
        previewTheme,
        {
          'bg-[#181818] text-white': previewTheme === 'dark',
          'bg-[#f7f7f7] text-black': previewTheme === 'light',
        },
      )}
      data-testid="Preview"
      style={{
        ...scope,
        backgroundColor: !showPreview ? 'transparent' : undefined,
      }}
    >
      <div className="w-full flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide opacity-60">
          Live preview
        </span>
        <button className="cursor-pointer" onClick={() => togglePreview()} type="button">
          {showPreview ? <CaretUpIcon /> : <CaretDownIcon />}
        </button>
      </div>
      <div
        className={cn('flex flex-col gap-6 mt-2 opacity-0 transition-opacity duration-500', {
          'opacity-100': showPreview,
        })}
      >
        {showPreview && (
          <>
            <Header
              activeId={activeColor.id}
              colors={colors}
              name={activeColor.name}
              onSelect={handleSelect}
              onThemeChange={next =>
                setState({ themeOverrides: { ...themeOverrides, [activeColor.id]: next } })
              }
              themeMode={mode}
            />
            <Toolbar />
            <Divider className="bg-(--color-preview)" />
            <Controls />
            <Divider />
            <Cards />
          </>
        )}
      </div>
    </section>
  );
}
