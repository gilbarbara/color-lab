import useGenerator from '~/hooks/useGenerator';
import { getEffectiveOptions } from '~/utils/generator';

import Footer from '~/components/Footer';
import Preview from '~/containers/Preview';

import Header from './Header';
import Scale from './Scale';

export default function Palette() {
  const { colors, globalOptions } = useGenerator('colors', 'globalOptions');

  return (
    <div
      className="@container w-full flex flex-col md:border-l md:border-default"
      data-testid="Palette"
    >
      <div className="flex-1 flex flex-col gap-8 p-4">
        {/* Section heading for the palette region. Keeps the heading order valid
            (h2 → h3 color scales) even on mobile, where the panel's "Colors" h2
            is collapsed/hidden. */}
        <h2 className="sr-only">Color palette</h2>
        <Header />
        <div className="flex flex-col items-start flex-1 gap-8">
          {colors.map(colorEntry => {
            const options = getEffectiveOptions(colorEntry, globalOptions);

            return <Scale key={colorEntry.id} colorEntry={colorEntry} options={options} />;
          })}
          <Preview />
        </div>
      </div>
      <Footer />
    </div>
  );
}
