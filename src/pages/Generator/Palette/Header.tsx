import { useBreakpoint, useSetState } from '@gilbarbara/hooks';
import { addToast, Badge } from '@heroui/react';
import { HeartIcon, PaletteIcon, PencilSimpleLineIcon } from '@phosphor-icons/react';

import { BREAKPOINTS, DEFAULT_PALETTE_NAME } from '~/config/globals';
import useApp from '~/hooks/useApp';
import useAuth from '~/hooks/useAuth';
import usePalette from '~/hooks/usePalette';
import useSavedPalettes from '~/hooks/useSavedPalettes';
import { trackEvent } from '~/utils/analytics';

import Button from '~/components/Button';
import Collapse from '~/components/Collapse';
import EditableInput, { type CommitAction } from '~/components/EditableInput';
import ExportPalette from '~/components/ExportPalette';
import SavePaletteModal from '~/components/SavePaletteModal';
import Tooltip from '~/components/Tooltip';

import GamutToggle from './GamutToggle';
import Options from './Options';

interface PaletteHeaderState {
  isSaveModalOpen: boolean;
}

export default function PaletteHeader() {
  const { isAuthenticated } = useAuth();
  const { openLoginModal, showPaletteOptionsPanel, togglePaletteOptionsPanel } = useApp(
    'openLoginModal',
    'showPaletteOptionsPanel',
    'togglePaletteOptionsPanel',
  );
  const { hasCustomPaletteOptions } = usePalette('hasCustomPaletteOptions');
  const {
    hasUnsavedChanges,
    isSaving,
    paletteId,
    paletteName,
    renamePalette,
    savePalette,
    updateCurrentPalette,
  } = useSavedPalettes();
  const { min } = useBreakpoint(BREAKPOINTS);

  const [{ isSaveModalOpen }, setState] = useSetState<PaletteHeaderState>({
    isSaveModalOpen: false,
  });

  const saveAndAnnounce = async (name: string) => {
    const palette = await savePalette(name);

    if (palette) {
      trackEvent('save-palette');
      addToast({ title: 'Palette saved', color: 'success' });
    }

    return palette;
  };

  const handleCommitName = (value: string, _action: CommitAction): Promise<unknown> | undefined => {
    const name = value.trim();

    if (!name) {
      return undefined;
    }

    if (!isAuthenticated) {
      openLoginModal();

      return undefined;
    }

    if (paletteId) {
      return renamePalette(paletteId, name);
    }

    return saveAndAnnounce(name);
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

  const isLarge = min('lg');

  return (
    <div data-testid="PaletteHeader">
      <div className="flex items-center justify-between">
        <EditableInput
          classNames={{
            base: 'opacity-100',
            innerWrapper: 'pb-0',
            input: 'text-2xl font-semibold text-foreground-800',
          }}
          isDisabled={!isAuthenticated}
          name="palette-name"
          onCommit={handleCommitName}
          size="sm"
          value={paletteName}
          variant="underlined"
        />

        <div className="flex items-center gap-1 md:gap-2">
          <GamutToggle />
          <Tooltip content="Palette Options" placement="bottom">
            <Button
              aria-label="Palette Options"
              className="@max-2xl:px-0 @max-2xl:min-w-8 @max-2xl:w-8"
              onPress={togglePaletteOptionsPanel}
              size="menu"
              startContent={
                <Badge
                  color="warning"
                  content=""
                  isDot
                  isInvisible={!hasCustomPaletteOptions}
                  size="sm"
                >
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
            color={hasUnsavedChanges ? 'warning' : 'primary'}
            isDisabled={!!paletteId && !hasUnsavedChanges}
            isIconOnly={!isLarge}
            isLoading={isSaving}
            onPress={handleClickSave}
            size="menu"
            startContent={
              paletteId ? (
                <PencilSimpleLineIcon className="text-xl" />
              ) : (
                <HeartIcon className="text-xl" />
              )
            }
            variant="flat"
          >
            {isLarge && (paletteId ? 'Update' : 'Save')}
          </Button>
        </div>
      </div>

      <Collapse isOpen={showPaletteOptionsPanel}>
        <Options />
      </Collapse>
      <SavePaletteModal
        defaultName={paletteName !== DEFAULT_PALETTE_NAME ? paletteName : ''}
        isOpen={isSaveModalOpen}
        isSaving={isSaving}
        onClose={() => setState({ isSaveModalOpen: false })}
        onSave={handleSaveNewPalette}
      />
    </div>
  );
}
