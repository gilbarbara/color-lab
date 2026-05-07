import {
  type KeyboardEvent,
  type MouseEvent,
  type TouchEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Button, cn, Divider } from '@heroui/react';
import { CaretUpIcon, PlusIcon } from '@phosphor-icons/react';
import { rotate } from 'colorizr';

import usePalette from '~/hooks/usePalette';
import { useAppStore } from '~/stores/appStore';
import { trackEvent } from '~/utils/analytics';
import { getRandomColor } from '~/utils/color';
import { MAX_COLORS } from '~/utils/palette';
import { scrollToSelector } from '~/utils/scroll';

import ColorBox from '~/components/ColorBox';
import ColorList from '~/pages/Generator/ColorList';
import ColorOptions from '~/pages/Generator/ColorOptions';

export default function BottomBar() {
  const { addColor, baseSaturation, colors, defaultOptions, globalOptions, updateGlobalOptions } =
    usePalette();
  const { showBottomBar, toggleBottomBar } = useAppStore();
  const [shouldRenderContent, setShouldRenderContent] = useState(false);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    document.body.style.overflow = showBottomBar ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [showBottomBar]);

  useEffect(() => {
    if (showBottomBar) {
      setShouldRenderContent(true);

      return () => {};
    }

    // Delay unmount until transition completes
    const timer = setTimeout(() => setShouldRenderContent(false), 500);

    return () => clearTimeout(timer);
  }, [showBottomBar]);

  const handleAddColor = () => {
    const lastColor = colors.at(-1);
    const nextColor = lastColor ? rotate(lastColor.value, 30) : getRandomColor(baseSaturation);

    addColor(nextColor);
    trackEvent('add-color');

    setTimeout(() => scrollToSelector(`${colors.length}-${nextColor}`), 100);
  };

  const handleClickCircle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const { id } = event.currentTarget.dataset;

    if (!showBottomBar) {
      toggleBottomBar();
      // Wait for 500ms animation to complete
      setTimeout(() => scrollToSelector(id), 500);
    } else {
      scrollToSelector(id);
    }
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

    // Drag up to open, drag down to close
    if ((deltaY < -threshold && !showBottomBar) || (deltaY > threshold && showBottomBar)) {
      toggleBottomBar();
    }

    dragStartY.current = null;
  };

  return (
    <div
      className={cn('fixed left-0 z-30 w-full h-dvh bg-background transition-all duration-500', {
        'top-[100dvh] -mt-16 overflow-hidden': !showBottomBar,
        'top-0 overflow-y-auto': showBottomBar,
      })}
      data-testid="BottomBar"
    >
      <div
        aria-label="Toggle Bottom Bar"
        className="sticky top-0 flex items-center justify-between p-4 bg-default-800 text-background dark:bg-default-100 dark:text-foreground z-20 border-b border-default touch-none"
        data-testid="BottomBarHeader"
        onClick={toggleBottomBar}
        onKeyDown={handleKeyDown}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
        role="button"
        tabIndex={0}
      >
        {!showBottomBar && (
          <div className="h-1 w-8 absolute top-0 left-1/2 -translate-x-1/2 z-30 bg-foreground rounded-full" />
        )}
        <div
          className={cn('flex items-center', {
            'mask-r-from-80%': colors.length >= 3,
            'gap-2': colors.length < 7,
            'gap-1': colors.length < 8,
          })}
        >
          {colors.map((color, index) => (
            <ColorBox
              key={color.value}
              className={cn('first:ms-0', {
                '-ms-1': colors.length > 8,
                '-ms-2': colors.length > 9,
              })}
              color={color.value}
              data-id={`${index}-${color.value}`}
              onClick={handleClickCircle}
              size="sm"
            />
          ))}
        </div>
        <button className="p-2 -mr-2 rounded-full" type="button">
          <CaretUpIcon
            className={cn('transition-transform text-base', {
              'rotate-180': showBottomBar,
            })}
          />
        </button>
      </div>
      {shouldRenderContent && (
        <>
          <ColorOptions
            defaultOptions={defaultOptions}
            globalOptions={globalOptions}
            updateGlobalOptions={updateGlobalOptions}
          />
          <Divider />
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
        </>
      )}
    </div>
  );
}
