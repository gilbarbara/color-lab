import useGenerator from '~/hooks/useGenerator';

import Swatch from './Swatch';

export default function PaletteGrid() {
  const { colors } = useGenerator('colors');

  return (
    <div
      className="w-full grid grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5 px-4 gap-8"
      data-testid="PaletteGrid"
    >
      {colors.map(color => (
        <Swatch
          key={color.id}
          className="w-full aspect-square p-4! h-auto! flex-col! items-end! justify-end!"
          color={color.value}
          step={color.name}
          stepClassName="text-right"
        />
      ))}
    </div>
  );
}
