import { useSetState } from '@gilbarbara/hooks';
import { addToast, cn } from '@heroui/react';
import { HeartIcon, PaletteIcon, PencilSimpleLineIcon } from '@phosphor-icons/react';
import { useSearchParams } from 'next/navigation';

import { DEFAULT_PALETTE_NAME } from '~/config/globals';
import useApp from '~/hooks/useApp';
import useAuth from '~/hooks/useAuth';
import useGenerator from '~/hooks/useGenerator';
import useSavedPalettes from '~/hooks/useSavedPalettes';
import { trackEvent } from '~/utils/analytics';
import { getPaletteIdFromUrl } from '~/utils/url';

import Badge from '~/components/Badge';
import Button from '~/components/Button';
import CollapsePanel from '~/components/CollapsePanel';
import EditableInput, { type CommitAction } from '~/components/EditableInput';
import SavePaletteModal from '~/components/SavePaletteModal';
import Tooltip from '~/components/Tooltip';
import ExportPalette from '~/containers/ExportPalette';

import GamutToggle from './GamutToggle';
import Options from './Options';

interface PaletteHeaderState {
  isSaveModalOpen: boolean;
}

export default function PaletteHeader() {
  const { isAuthenticated } = useAuth();
  const {
    openLoginModal,
    paletteId: appPaletteId,
    showPaletteOptionsPanel,
    togglePaletteOptionsPanel,
  } = useApp('openLoginModal', 'showPaletteOptionsPanel', 'togglePaletteOptionsPanel', 'paletteId');
  const { hasCustomPaletteOptions, name, setName } = useGenerator(
    'hasCustomPaletteOptions',
    'name',
    'setName',
  );
  const { hasUnsavedChanges, isSaving, paletteId, savePalette, updateCurrentPalette } =
    useSavedPalettes();

  const [{ isSaveModalOpen }, setState] = useSetState<PaletteHeaderState>({
    isSaveModalOpen: false,
  });

  // The URL carries an unvalidated saved-palette `id`, but the record's name
  // resolves only after auth settles and usePaletteIdSync validates it (setting
  // appStore.paletteId). Until then show "Loading…" in the name field — unless the
  // URL already carries the name (`?name=`), which parsePaletteFromUrl has already
  // seeded into the store. An invalid id is stripped by usePaletteIdSync, so this
  // self-resolves either way.
  const searchParams = useSearchParams();
  const urlPaletteId = getPaletteIdFromUrl(searchParams.toString());
  const isLoadingSavedPalette = !!urlPaletteId && !searchParams.get('name') && !appPaletteId;

  const saveAndAnnounce = async (nameToSave: string) => {
    const palette = await savePalette(nameToSave);

    if (palette) {
      trackEvent('save-palette');
      addToast({ title: 'Palette saved', color: 'success' });
    }

    return palette;
  };

  // Naming is decoupled from saving: committing the name just updates the store,
  // which useUrlSync reflects into the URL `?name=`. Available to everyone.
  const handleCommitName = (value: string, _action: CommitAction) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return; // empty not allowed — input reverts to the current name
    }

    setName(trimmed);
  };

  const handleClickSave = async () => {
    if (!isAuthenticated) {
      openLoginModal();

      return;
    }

    if (paletteId) {
      // Update existing palette
      const success = await updateCurrentPalette();

      if (success) {
        trackEvent('update-palette');
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

  const iconClass = cn('text-xl shrink-0', {
    'animate-bounce': isSaving,
  });

  return (
    <div data-testid="PaletteHeader">
      <div className="flex items-center justify-between">
        <EditableInput
          aria-label="Palette name"
          classNames={{
            base: 'opacity-100',
            innerWrapper: 'pb-0',
            input: cn('text-2xl font-semibold', {
              'group-data-[has-value=true]:text-foreground-500': isLoadingSavedPalette,
            }),
          }}
          isDisabled={isLoadingSavedPalette}
          name="palette-name"
          onCommit={handleCommitName}
          size="sm"
          value={isLoadingSavedPalette ? 'Loading…' : name}
          variant="underlined"
        />

        <div className="flex items-center gap-1 md:gap-2">
          <GamutToggle />
          <Tooltip content="Palette Options" placement="bottom">
            <Button
              aria-label="Palette Options"
              className="@max-2xl:button-menu-square"
              onPress={togglePaletteOptionsPanel}
              size="menu"
              startContent={
                <Badge content="" isInvisible={!hasCustomPaletteOptions}>
                  <PaletteIcon className="text-xl" weight="bold" />
                </Badge>
              }
              variant={showPaletteOptionsPanel ? 'solid' : 'light'}
            >
              <span className="hidden @2xl:inline-flex">Options</span>
            </Button>
          </Tooltip>
          <ExportPalette />
          <Button
            aria-label={paletteId ? 'Update palette' : 'Save palette'}
            className="max-lg:button-menu-square"
            color={hasUnsavedChanges ? 'warning' : 'primary'}
            isDisabled={isSaving || (!!paletteId && !hasUnsavedChanges)}
            onPress={handleClickSave}
            size="menu"
            startContent={
              paletteId ? (
                <PencilSimpleLineIcon className={iconClass} />
              ) : (
                <HeartIcon className={iconClass} />
              )
            }
            variant="faded"
          >
            <span className="hidden lg:inline">{paletteId ? 'Update' : 'Save'}</span>
          </Button>
        </div>
      </div>

      <CollapsePanel
        isOpen={showPaletteOptionsPanel}
        openClassName="palette-options-open:grid-rows-[1fr] palette-options-open:opacity-100"
      >
        <Options />
      </CollapsePanel>
      <SavePaletteModal
        defaultName={name !== DEFAULT_PALETTE_NAME ? name : ''}
        isOpen={isSaveModalOpen}
        isSaving={isSaving}
        onClose={() => setState({ isSaveModalOpen: false })}
        onSave={handleSaveNewPalette}
      />
    </div>
  );
}
