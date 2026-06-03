import { type KeyboardEvent, type MouseEvent, type TouchEvent, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useBreakpoint, useIsomorphicLayoutEffect } from '@gilbarbara/hooks';
import { cn, Divider } from '@heroui/react';
import { PlusIcon, SidebarSimpleIcon } from '@phosphor-icons/react';

import { BREAKPOINTS, OFFSET, SCROLL_OFFSET } from '~/config/globals';
import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import useScrollToColor from '~/hooks/useScrollToColor';
import { trackEvent } from '~/utils/analytics';
import { getRandomColor, rotateOklchHue } from '~/utils/color';
import { MAX_COLORS } from '~/utils/generator';
import { scrollToSelector } from '~/utils/scroll';

import AppIntro from '~/components/AppIntro';
import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';
import ColorList from '~/containers/ColorList';

import ColorOptions from '../ColorOptions';

import BottomBar from './BottomBar';

/**
 * Unified palette panel. Renders shared content (ColorOptions, ColorList,
 * AddColor) once; chrome adapts to viewport via CSS:
 *   - md+: sticky sidebar collapsing width 24rem ↔ 3rem (driven by html[data-sidebar])
 *   - sm:  fixed bottom drawer sliding top 100dvh ↔ 0 (driven by data-sm-open)
 * Single DOM instance avoids duplicate `id` attributes on ColorItem and
 * single source of state for ColorOptions form fields. SSR matches client
 * because no JS branch on viewport.
 */
export default function Panel() {
  const { addColor, baseSaturation, colors, defaultOptions, globalOptions, updateGlobalOptions } =
    useGenerator(
      'addColor',
      'baseSaturation',
      'colors',
      'defaultOptions',
      'globalOptions',
      'updateGlobalOptions',
    );
  const {
    collapseAnimationCount,
    colorScrollRequest,
    requestColorScroll,
    showBottomBar,
    showSidebar,
    toggleBottomBar,
    toggleSidebar,
  } = useApp(
    'collapseAnimationCount',
    'colorScrollRequest',
    'requestColorScroll',
    'showBottomBar',
    'showSidebar',
    'toggleBottomBar',
    'toggleSidebar',
  );

  const scrollToColor = useScrollToColor();
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const hasMountedRef = useRef(false);
  // Last colorScrollRequest.nonce we actually scrolled to — see the scroll effect.
  const servicedNonceRef = useRef<number | null>(null);

  // useBreakpoint is post-mount safe: it returns defaults on first render
  // (SSR + first client render match), then updates after mount. We only read
  // its value inside effects/event handlers, never in JSX — so re-renders from
  // its updates don't produce hydration mismatches.
  const { max } = useBreakpoint(BREAKPOINTS);
  const isMobile = max('md');

  // Adding a color changes the URL path, which remounts Panel and its scroll
  // container (resetting scrollTop to 0). A colorScrollRequest is already pending
  // on the first run after that remount — restore the scroll position synchronously
  // before paint so the fresh container never flashes at the top. In-place requests
  // (swatch / color-box clicks, no remount) keep the smooth animated scroll.
  useIsomorphicLayoutEffect(() => {
    const isRemountRestore = !hasMountedRef.current;

    hasMountedRef.current = true;

    if (!colorScrollRequest || collapseAnimationCount > 0) {
      return undefined;
    }

    // This effect also re-runs on collapseAnimationCount / isMobile changes — the gate
    // that defers scrolling until expand/collapse animations settle. Those re-runs must
    // not replay an already-serviced request: every ColorItem activation cycles
    // collapseAnimationCount (Collapse open/close), which would otherwise re-fire the
    // last request. Only act on a nonce we haven't scrolled to yet.
    if (colorScrollRequest.nonce === servicedNonceRef.current) {
      return undefined;
    }

    const { id, nonce } = colorScrollRequest;
    const offset = isMobile ? SCROLL_OFFSET : OFFSET;

    if (isRemountRestore) {
      servicedNonceRef.current = nonce;
      scrollToSelector(id, containerRef.current, offset, true);

      return undefined;
    }

    // Mark serviced inside the frame, not before: if a dep change cancels this rAF
    // first, the re-run must reschedule rather than skip a never-performed scroll.
    const raf = requestAnimationFrame(() => {
      scrollToSelector(id, containerRef.current, offset);
      servicedNonceRef.current = nonce;
    });

    return () => cancelAnimationFrame(raf);
  }, [colorScrollRequest, collapseAnimationCount, isMobile]);

  // `inert` keeps the collapsed sidebar / closed drawer out of the tab order and
  // a11y tree. It has no CSS form and depends on the breakpoint, which is only
  // safe to read post-mount — so set it imperatively rather than in JSX.
  useEffect(() => {
    const el = contentRef.current;

    if (!el) {
      return;
    }

    el.inert = isMobile ? !showBottomBar : !showSidebar;
  }, [isMobile, showBottomBar, showSidebar]);

  const handleAddColor = () => {
    const lastColor = colors.at(-1);
    const nextColor = lastColor
      ? rotateOklchHue(lastColor.value, 30)
      : getRandomColor(baseSaturation);

    let newId: string | null = null;

    flushSync(() => {
      newId = addColor(nextColor);
    });
    trackEvent('add-color');

    if (newId) requestColorScroll(newId);
  };

  const handleClickColorBox = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const { id } = event.currentTarget.dataset;

    if (id) scrollToColor(id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleBottomBar();
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    dragStartY.current = event.touches[0].clientY;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;

    const deltaY = event.changedTouches[0].clientY - dragStartY.current;
    const threshold = 30;

    if ((deltaY < -threshold && !showBottomBar) || (deltaY > threshold && showBottomBar)) {
      toggleBottomBar();
    }

    dragStartY.current = null;
  };

  return (
    <aside
      ref={containerRef}
      className={cn(
        // Desktop sidebar
        'md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-hidden md:flex md:flex-col md:shrink-0',
        'md:transition-[width] md:duration-500',
        'md:w-12 md:sidebar-open:w-96 md:sidebar-open:overflow-y-auto',
        // Mobile bottom drawer
        'max-md:fixed max-md:left-0 max-md:w-full max-md:h-dvh max-md:z-30 max-md:bg-background',
        'max-md:transition-[top,margin] max-md:duration-500',
        'max-md:top-[100dvh] max-md:-mt-16 max-md:overflow-hidden',
        'max-md:data-[sm-open=true]:top-0 max-md:data-[sm-open=true]:mt-0 max-md:data-[sm-open=true]:overflow-y-auto',
      )}
      data-sm-open={showBottomBar}
      data-testid="GeneratorPanel"
    >
      {/* Corner toggle — desktop only */}
      <Tooltip content="Toggle Sidebar">
        <Button
          aria-label="Toggle Sidebar"
          className="hidden md:flex absolute top-2 right-2 z-10"
          isIconOnly
          onPress={() => toggleSidebar()}
          size="sm"
          variant="light"
        >
          <SidebarSimpleIcon className="text-lg" />
        </Button>
      </Tooltip>

      {/* Draggable handle with color circles — mobile only */}
      <BottomBar
        colors={colors}
        onClick={handleClickColorBox}
        onKeyDown={handleKeyDown}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
        showBottomBar={showBottomBar}
        toggleBottomBar={toggleBottomBar}
      />

      {/* Shared content — rendered once */}
      <div
        ref={contentRef}
        className={cn(
          'transition-opacity duration-500',
          // Desktop: fade content out when collapsed
          'md:w-sm',
          'md:sidebar-closed:opacity-0 md:sidebar-closed:pointer-events-none',
          'max-md:data-[sm-open=false]:opacity-0 max-md:data-[sm-open=false]:pointer-events-none',
        )}
        data-sm-open={showBottomBar}
        data-testid="GeneratorPanel-Content"
      >
        {/* AppIntro only inside the desktop panel; mobile has it at top of Generator */}
        <div className="hidden md:block">
          <AppIntro />
        </div>
        <ColorOptions
          defaultOptions={defaultOptions}
          globalOptions={globalOptions}
          updateGlobalOptions={updateGlobalOptions}
        />
        <ColorList />
        <Divider />
        <div className="p-4">
          <Button
            color="primary"
            fullWidth
            isDisabled={colors.length >= MAX_COLORS}
            onPress={handleAddColor}
            startContent={<PlusIcon />}
          >
            Add Color
          </Button>
        </div>
      </div>
    </aside>
  );
}
