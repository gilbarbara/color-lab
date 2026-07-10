import CollapsibleMenu from '~/components/CollapsibleMenu';
import ExportPalette from '~/containers/ExportPalette';

import DisplayMenu from '../DisplayMenu';

import NameField from './NameField';
import OptionsToggle from './OptionsToggle';
import SaveControls from './SaveControls';
import ShareButton from './ShareButton';

export default function PaletteHeader() {
  return (
    <div data-testid="PaletteHeader">
      <div className="flex items-center justify-between">
        <NameField />

        <div className="flex items-center gap-1 md:gap-2">
          <CollapsibleMenu label="More palette tools">
            <DisplayMenu />
            <OptionsToggle />
          </CollapsibleMenu>
          <ExportPalette />
          <ShareButton />
          <SaveControls />
        </div>
      </div>
    </div>
  );
}
