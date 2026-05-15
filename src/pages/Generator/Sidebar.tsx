import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { Button, Divider } from '@heroui/react';
import { PlusIcon } from '@phosphor-icons/react';
import { rotate } from 'colorizr';

import usePalette from '~/hooks/usePalette';
import { trackEvent } from '~/utils/analytics';
import { getRandomColor } from '~/utils/color';
import { MAX_COLORS } from '~/utils/palette';
import { scrollToSelector } from '~/utils/scroll';

import ColorList from './ColorList';
import ColorOptions from './ColorOptions';
import Header from './Header';

export default function Sidebar() {
  const { addColor, baseSaturation, colors, defaultOptions, globalOptions, updateGlobalOptions } =
    usePalette();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAddColor = () => {
    const lastColor = colors.at(-1);
    const nextColor = lastColor ? rotate(lastColor.value, 30) : getRandomColor(baseSaturation);

    let newId: string | null = null;

    flushSync(() => {
      newId = addColor(nextColor);
    });
    trackEvent('add-color');

    if (newId) scrollToSelector(newId, containerRef.current);
  };

  return (
    <div
      ref={containerRef}
      className="sticky top-16 w-sm h-[calc(100vh-4rem)] flex flex-col overflow-y-auto shrink-0"
      data-testid="Sidebar"
    >
      <div>
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
      </div>
    </div>
  );
}
