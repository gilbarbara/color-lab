import usePalette from '~/hooks/usePalette';

import ColorSelector from './ColorSelector';

interface ColorListProps {
  baseSaturation: number;
}

export default function ColorList(props: ColorListProps) {
  const { baseSaturation } = props;
  const {
    clearColorOverrides,
    colors,
    globalOptions,
    removeColor,
    updateColor,
    updateGlobalOptions,
  } = usePalette();

  return (
    <div className="p-4" data-uid="ColorList">
      <h2 className="font-semibold text-xl">Colors</h2>
      <div className="space-y-4 mt-4">
        {colors.map((colorEntry, index) => (
          <ColorSelector
            key={colorEntry.id}
            baseSaturation={baseSaturation}
            colorEntry={colorEntry}
            globalOptions={globalOptions}
            index={index}
            isOnlyColor={colors.length === 1}
            onRemoveColor={removeColor}
            onResetColor={clearColorOverrides}
            onUpdateColor={updateColor}
            onUpdateGlobalOptions={updateGlobalOptions}
          />
        ))}
      </div>
    </div>
  );
}
