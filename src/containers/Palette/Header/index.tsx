import ExportPalette from '~/containers/ExportPalette';

import DisplayMenu from '../DisplayMenu';
import OptionsButton from '../Options/OptionsButton';

import NameField from './NameField';
import SaveControls from './SaveControls';
import ShareButton from './ShareButton';

export default function PaletteHeader() {
  return (
    <div
      className="flex flex-col @4xl:flex-row @4xl:items-center @4xl:justify-between gap-1"
      data-testid="PaletteHeader"
    >
      <NameField />

      <div className="flex items-center gap-1 md:gap-2">
        <DisplayMenu />
        <OptionsButton />
        <ExportPalette />
        <ShareButton />
        <SaveControls />
      </div>
    </div>
  );
}
