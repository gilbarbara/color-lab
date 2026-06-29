import useApp from '~/hooks/useApp';

import CollapsePanel from '~/components/CollapsePanel';
import CollapsibleMenu from '~/components/CollapsibleMenu';
import ExportPalette from '~/containers/ExportPalette';

import GamutToggle from './GamutToggle';
import NameField from './NameField';
import Options from './Options';
import OptionsToggle from './OptionsToggle';
import SaveControls from './SaveControls';
import ShareButton from './ShareButton';

export default function PaletteHeader() {
  const { showPaletteOptionsPanel } = useApp('showPaletteOptionsPanel');

  return (
    <div data-testid="PaletteHeader">
      <div className="flex items-center justify-between">
        <NameField />

        <div className="flex items-center gap-1 md:gap-2">
          <CollapsibleMenu label="More palette tools">
            <GamutToggle />
            <OptionsToggle />
          </CollapsibleMenu>
          <ExportPalette />
          <ShareButton />
          <SaveControls />
        </div>
      </div>

      <CollapsePanel
        isOpen={showPaletteOptionsPanel}
        openClassName="palette-options-open:grid-rows-[1fr] palette-options-open:opacity-100"
      >
        <Options />
      </CollapsePanel>
    </div>
  );
}
