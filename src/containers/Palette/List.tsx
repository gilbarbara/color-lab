import { getEffectiveOptions } from '~/utils/generator';

import type { ColorEntry, GlobalScaleOptions } from '~/types';

import Scale from './Scale';

interface PaletteListProps {
  colors: ColorEntry[];
  globalOptions: GlobalScaleOptions;
}

export default function PaletteList(props: PaletteListProps) {
  const { colors, globalOptions } = props;

  return (
    <div className="flex flex-col items-start gap-8">
      {colors.map(colorEntry => {
        const options = getEffectiveOptions(colorEntry, globalOptions);

        return <Scale key={colorEntry.id} colorEntry={colorEntry} options={options} />;
      })}
    </div>
  );
}
