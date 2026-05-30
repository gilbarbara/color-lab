import usePalette from '~/hooks/usePalette';

import ColorItem from './ColorItem';

export default function ColorList() {
  const { colors, globalOptions } = usePalette('colors', 'globalOptions');

  return (
    <div className="p-4" data-testid="ColorList">
      <h2 className="font-semibold text-xl">Colors</h2>
      <div className="space-y-4 mt-4">
        {colors.map((colorEntry, index) => (
          <ColorItem
            key={colorEntry.id}
            colorEntry={colorEntry}
            globalOptions={globalOptions}
            index={index}
            isOnlyColor={colors.length === 1}
          />
        ))}
      </div>
    </div>
  );
}
