import { Button, Divider } from '@heroui/react';
import { PlusIcon } from '@phosphor-icons/react';
import { rotate } from 'colorizr';

import usePalette from '~/hooks/usePalette';
import { getRandomColor } from '~/utils/color';
import { MAX_COLORS } from '~/utils/palette';
import { scrollToSelector } from '~/utils/scroll';

import ColorList from './ColorList';
import ColorOptions from './ColorOptions';
import Header from './Header';

export default function Sidebar() {
  const { addColor, baseSaturation, colors, defaultOptions, globalOptions, updateGlobalOptions } =
    usePalette();

  const handleAddColor = () => {
    const lastColor = colors.at(-1);
    const nextColor = lastColor
      ? rotate(lastColor.value, 30)
      : getRandomColor('oklch', baseSaturation);

    addColor(nextColor);

    setTimeout(() => scrollToSelector(`${colors.length}-${nextColor}`), 100);
  };

  return (
    <div
      className="sticky top-16 w-sm h-[calc(100vh-4rem)] flex flex-col overflow-y-auto shrink-0"
      data-uid="Sidebar"
    >
      <div>
        <Header />
        <ColorOptions
          defaultOptions={defaultOptions}
          globalOptions={globalOptions}
          updateGlobalOptions={updateGlobalOptions}
        />
        <ColorList baseSaturation={baseSaturation} />
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
