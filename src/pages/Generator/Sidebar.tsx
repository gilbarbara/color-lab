import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { cn, Divider } from '@heroui/react';
import { PlusIcon, SidebarSimpleIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';

import useApp from '~/hooks/useApp';
import usePalette from '~/hooks/usePalette';
import { trackEvent } from '~/utils/analytics';
import { getRandomColor, rotateOklchHue } from '~/utils/color';
import { MAX_COLORS } from '~/utils/palette';
import { scrollToSelector } from '~/utils/scroll';

import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';

import ColorList from './ColorList';
import ColorOptions from './ColorOptions';
import Header from './Header';

export default function Sidebar() {
  const { addColor, baseSaturation, colors, defaultOptions, globalOptions, updateGlobalOptions } =
    usePalette(
      'addColor',
      'baseSaturation',
      'colors',
      'defaultOptions',
      'globalOptions',
      'updateGlobalOptions',
    );
  const { showSidebar, toggleSidebar } = useApp('showSidebar', 'toggleSidebar');
  const containerRef = useRef<HTMLDivElement>(null);

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

    if (newId) scrollToSelector(newId, containerRef.current);
  };

  return (
    <motion.div
      ref={containerRef}
      animate={{ width: showSidebar ? '24rem' : '3rem' }}
      className={cn(
        'sticky top-16 h-[calc(100vh-4rem)] overflow-hidden',
        'flex flex-col shrink-0',
        {
          'overflow-y-auto': showSidebar,
        },
      )}
      data-testid="Sidebar"
      initial={false}
      transition={{ duration: 0.5 }}
    >
      <Tooltip content="Toggle Sidebar">
        <Button
          aria-label="Toggle Sidebar"
          className="absolute top-2 right-2 z-10"
          isIconOnly
          onPress={toggleSidebar}
          size="sm"
          variant="light"
        >
          <SidebarSimpleIcon className="text-lg" />
        </Button>
      </Tooltip>
      <AnimatePresence initial={false}>
        {showSidebar && (
          <motion.div
            animate={{ opacity: 1 }}
            className="w-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Header />
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
