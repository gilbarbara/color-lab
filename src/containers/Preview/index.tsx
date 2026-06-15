import { useEffect, useRef, useState } from 'react';
import { useSetState } from '@gilbarbara/hooks';
import { cn, Divider } from '@heroui/react';
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import { parseCSS } from 'colorizr';
import { animate } from 'framer-motion';

import { SCROLL_OFFSET } from '~/config/globals';
import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import { getEffectiveOptions } from '~/utils/generator';
import { buildPreviewScope } from '~/utils/preview-tokens';

import CollapsePanel from '~/components/CollapsePanel';

import Cards from './Cards';
import Controls from './Controls';
import Header from './Header';
import { type PreviewThemeMode } from './ThemeToggle';
import Toolbar, { type PreviewView } from './Toolbar';
import Typography from './Typography';

interface PreviewState {
  themeOverrides: Record<string, PreviewThemeMode>;
}

function autoBgUtility(color: string): string {
  const { l } = parseCSS(color, 'oklch');

  if (l >= 0.9) return 'preview-bg-dark dark';
  if (l <= 0.3) return 'preview-bg-light light';

  return 'preview-bg-auto';
}

export default function Preview() {
  const { colors, globalOptions, previewColorId, setPreviewColor } = useGenerator(
    'colors',
    'globalOptions',
    'previewColorId',
    'setPreviewColor',
  );
  const { previewScrollNonce, showPreview, togglePreview } = useApp(
    'previewScrollNonce',
    'showPreview',
    'togglePreview',
  );

  const [{ themeOverrides }, setState] = useSetState<PreviewState>({
    themeOverrides: {},
  });
  const [view, setView] = useState<PreviewView>('components');

  const ref = useRef<HTMLDivElement | null>(null);
  const lastScrollNonce = useRef(previewScrollNonce);

  useEffect(() => {
    const el = ref.current;

    // Only scroll on a genuine nonce change during this mount's life.
    if (previewScrollNonce === lastScrollNonce.current || !el) {
      return undefined;
    }

    lastScrollNonce.current = previewScrollNonce;

    const startY = window.scrollY;
    const targetY = startY + el.getBoundingClientRect().top - SCROLL_OFFSET;

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
  const forced = mode === 'light' || mode === 'dark' ? mode : undefined;
  const bgUtility = forced ? `preview-bg-${forced} ${forced}` : autoBgUtility(activeColor.value);
  const options = getEffectiveOptions(activeColor, globalOptions);
  const scope = buildPreviewScope(activeColor.value, options, forced);

  return (
    <section
      ref={ref}
      className={cn('w-full flex flex-col rounded-xl preview-scope', bgUtility)}
      data-testid="Preview"
      style={scope}
    >
      <div className="w-full flex items-center justify-between p-4">
        <button
          aria-expanded={showPreview}
          aria-label={showPreview ? 'Collapse Live preview' : 'Expand Live preview'}
          className="w-full flex items-center justify-between cursor-pointer"
          onClick={() => togglePreview()}
          type="button"
        >
          <span className="text-sm font-semibold uppercase tracking-wide opacity-60">
            Live preview
          </span>
          <span>{showPreview ? <CaretUpIcon /> : <CaretDownIcon />}</span>
        </button>
      </div>
      <CollapsePanel
        className="duration-500"
        isOpen={showPreview}
        openClassName="preview-open:grid-rows-[1fr] preview-open:opacity-100"
      >
        <div className="flex flex-col gap-2 p-4 pt-0">
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
          <Toolbar onViewChange={setView} view={view} />
          <div className="flex flex-col gap-6">
            <Divider className="bg-(--color-preview)" />
            {view === 'components' ? (
              <>
                <Controls />
                <Divider />
                <Cards />
              </>
            ) : (
              <Typography name={activeColor.name} />
            )}
          </div>
        </div>
      </CollapsePanel>
    </section>
  );
}
