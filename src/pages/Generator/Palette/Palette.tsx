/* eslint-disable react/no-array-index-key */

import { cn } from '@heroui/react';

import usePalette from '~/hooks/usePalette';
import { getEffectiveOptions } from '~/utils/palette';

import Footer from '~/components/Footer';
import BottomBar from '~/pages/Generator/BottomBar';

import Header from './Header';
import Scale from './Scale';

interface PaletteProps {
  showBottomBar?: boolean;
}

export default function Palette({ showBottomBar = false }: PaletteProps) {
  const { colors, globalOptions } = usePalette();

  return (
    <div
      className={cn('w-full flex flex-col', {
        'border-l border-default': !showBottomBar,
      })}
      data-testid="Palette"
    >
      <div className="flex-1 flex flex-col gap-8 p-4">
        <Header />
        <div className="flex flex-col items-start flex-1 gap-8">
          {colors.map((colorEntry, index) => {
            const options = getEffectiveOptions(colorEntry, globalOptions);

            return (
              <Scale
                key={`${colorEntry.name}-${index}`}
                colorEntry={colorEntry}
                options={options}
              />
            );
          })}
        </div>
      </div>
      {showBottomBar && <BottomBar />}
      <Footer hideBorder />
    </div>
  );
}
