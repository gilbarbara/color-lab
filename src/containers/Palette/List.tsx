import useGenerator from '~/hooks/useGenerator';
import { getEffectiveOptions } from '~/utils/generator';

import Scale from './Scale';

export default function PaletteList() {
  const { colors, globalOptions } = useGenerator('colors', 'globalOptions');

  return (
    <div className="flex flex-col items-start gap-8">
      {colors.map(colorEntry => {
        const options = getEffectiveOptions(colorEntry, globalOptions);

        return <Scale key={colorEntry.id} colorEntry={colorEntry} options={options} />;
      })}
    </div>
  );
}
