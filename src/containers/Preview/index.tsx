import { useEffect, useRef, useState } from 'react';
import { useSetState } from '@gilbarbara/hooks';
import { cn, Divider } from '@heroui/react';
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import { parseCSS } from 'colorizr';
import { animate } from 'framer-motion';

import { SCROLL_OFFSET } from '~/config/ui';
import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import useGeneratorStore from '~/hooks/useGeneratorStore';
import { trackEvent } from '~/utils/analytics';
import { getEffectiveOptions } from '~/utils/generator';
import { prefersReducedMotion } from '~/utils/motion';
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
  const { globalOptions, setPreviewColor } = useGenerator('globalOptions', 'setPreviewColor');
  const activeColor = useGeneratorStore(
    state => state.colors.find(c => c.id === state.previewColorId) ?? state.colors[0],
  );
  const {
    previewScrollNonce,
    showPreview,
    togglePreview,
    view: paletteView,
  } = useApp('previewScrollNonce', 'showPreview', 'togglePreview', 'view');

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

    // Nothing to cancel when we jump, so the wheel/touch listeners below are skipped too.
    if (prefersReducedMotion()) {
      window.scrollTo(0, targetY);

      return undefined;
    }

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
    trackEvent('preview:select_color');
    setPreviewColor(selectedId);
  };

  const handleViewChange = (next: PreviewView) => {
    trackEvent('preview:change_view', { value: next });
    setView(next);
  };

  const showHeader = paletteView !== 'preview';

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
      {showHeader && (
        <div className="w-full p-4">
          <button
            aria-expanded={showPreview}
            aria-label={showPreview ? 'Collapse Live preview' : 'Expand Live preview'}
            className="w-full flex items-center justify-between cursor-pointer"
            onClick={() => {
              trackEvent('preview:toggle', { enabled: !showPreview });
              togglePreview();
            }}
            type="button"
          >
            <span className="text-sm font-semibold uppercase tracking-wide opacity-60">
              Live preview
            </span>
            <span>{showPreview ? <CaretUpIcon /> : <CaretDownIcon />}</span>
          </button>
        </div>
      )}
      <CollapsePanel
        className="duration-500"
        isOpen={showPreview}
        openClassName="preview-open:grid-rows-[1fr] preview-open:opacity-100"
      >
        <div
          className={cn('flex flex-col gap-2 p-4', {
            'pt-0': showHeader,
          })}
        >
          <Header
            activeId={activeColor.id}
            name={activeColor.name}
            onSelect={handleSelect}
            onThemeChange={next => {
              trackEvent('preview:change_theme', { value: next });
              setState({ themeOverrides: { ...themeOverrides, [activeColor.id]: next } });
            }}
            themeMode={mode}
          />
          <Toolbar onViewChange={handleViewChange} view={view} />
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
