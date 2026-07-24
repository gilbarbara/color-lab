import { useSetState } from '@gilbarbara/hooks';
import { addToast, Spinner } from '@heroui/react';
import { HeartIcon, PencilSimpleLineIcon } from '@phosphor-icons/react';

import { DEFAULT_PALETTE_NAME } from '~/config/globals';
import useApp from '~/hooks/useApp';
import useAuth from '~/hooks/useAuth';
import useGenerator from '~/hooks/useGenerator';
import useSavedPalettes from '~/hooks/useSavedPalettes';
import { trackEvent } from '~/utils/analytics';

import Button from '~/components/Button';
import SavePaletteModal from '~/components/SavePaletteModal';

interface SaveControlsState {
  isSaveModalOpen: boolean;
}

/**
 * Save/Update button + new-palette modal, isolated so the save subscriptions
 * (useSavedPalettes → generatorUrl, which changes on every edit) live on this leaf
 * instead of the whole PaletteHeader. Keeps the memo'd header inert on palette edits.
 */
export default function SaveControls() {
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useApp('openLoginModal');
  const { name } = useGenerator('name');
  const { hasUnsavedChanges, isSaving, paletteId, savePalette, updateCurrentPalette } =
    useSavedPalettes();

  const [{ isSaveModalOpen }, setState] = useSetState<SaveControlsState>({
    isSaveModalOpen: false,
  });

  const saveAndAnnounce = async (nameToSave: string) => {
    const palette = await savePalette(nameToSave);

    if (palette) {
      trackEvent('palette:save');
      addToast({ title: 'Palette saved', color: 'success' });
    }

    return palette;
  };

  const handleClickSave = async () => {
    if (!isAuthenticated) {
      trackEvent('auth:open', { source: 'save' });
      openLoginModal();

      return;
    }

    if (paletteId) {
      // Update existing palette
      const success = await updateCurrentPalette();

      if (success) {
        trackEvent('palette:update');
        addToast({ title: 'Palette updated', color: 'success' });
      }
    } else {
      // Open modal to save new palette
      setState({ isSaveModalOpen: true });
    }
  };

  const handleSaveNewPalette = async (value: string) => {
    const palette = await saveAndAnnounce(value);

    if (palette) {
      setState({ isSaveModalOpen: false });
    }
  };

  let icon = paletteId ? (
    <PencilSimpleLineIcon className="text-xl" />
  ) : (
    <HeartIcon className="text-xl" />
  );

  if (isSaving) {
    icon = <Spinner color="warning" size="sm" variant="simple" />;
  }

  return (
    <div className="ml-auto">
      <Button
        aria-label={paletteId ? 'Update palette' : 'Save palette'}
        color={hasUnsavedChanges ? 'warning' : 'primary'}
        isDisabled={isSaving || (!!paletteId && !hasUnsavedChanges)}
        onPress={handleClickSave}
        size="menu"
        startContent={icon}
        variant="faded"
      >
        <span>{paletteId ? 'Update' : 'Save'}</span>
      </Button>
      <SavePaletteModal
        defaultName={name !== DEFAULT_PALETTE_NAME ? name : ''}
        isOpen={isSaveModalOpen}
        isSaving={isSaving}
        onClose={() => {
          trackEvent('palette:dismiss_save');
          setState({ isSaveModalOpen: false });
        }}
        onSave={handleSaveNewPalette}
      />
    </div>
  );
}
