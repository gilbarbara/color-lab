import { memo } from 'react';

import useApp from '~/hooks/useApp';

import CollapsePanel from '~/components/CollapsePanel';
import Footer from '~/components/Footer';
import Preview from '~/containers/Preview';

import Grid from './Grid';
import GroupToolbar from './GroupToolbar';
import Header from './Header';
import List from './List';
import Options from './Options';

function Palette() {
  const { showPaletteOptionsPanel, view } = useApp('showPaletteOptionsPanel', 'view');

  return (
    <div
      className="@container w-full flex flex-col md:border-l md:border-default"
      data-testid="Palette"
    >
      <div className="flex-1 flex flex-col gap-8 p-4 md:min-h-[calc(100vh-4rem)]">
        {/* Section heading for the palette region. Keeps the heading order valid
            (h2 → h3 color scales) even on mobile, where the panel's "Colors" h2
            is collapsed/hidden. */}
        <h2 className="sr-only">Color palette</h2>
        <div>
          <Header />
          <CollapsePanel
            isOpen={showPaletteOptionsPanel}
            openClassName="palette-options-open:grid-rows-[1fr] palette-options-open:opacity-100"
          >
            <Options />
          </CollapsePanel>
          {view !== 'preview' && <GroupToolbar />}
        </div>
        {view === 'grid' && <Grid />}
        {view === 'list' && (
          <>
            <List />
            <Preview />
          </>
        )}
        {view === 'preview' && <Preview />}
      </div>
      <Footer />
    </div>
  );
}

export default memo(Palette);
