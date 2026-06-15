import useGenerator from '~/hooks/useGenerator';

import ColorPresets from '~/components/ColorPresets';

import ColorItem from './ColorItem';

export default function ColorList() {
  const { colors, globalOptions } = useGenerator('colors', 'globalOptions');

  return (
    <div className="p-4" data-testid="ColorList">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-xl">Colors</h2>

        <ColorPresets />
      </div>
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
