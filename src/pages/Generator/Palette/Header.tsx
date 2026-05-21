import { type ChangeEvent, type KeyboardEvent, useEffect } from 'react';
import { useBreakpoint, useSetState } from '@gilbarbara/hooks';
import { addToast, Badge, Input } from '@heroui/react';
import { HeartIcon, PaletteIcon, PencilSimpleLineIcon } from '@phosphor-icons/react';

import { BREAKPOINTS } from '~/config/globals';
import useAuth from '~/hooks/useAuth';
import usePalette from '~/hooks/usePalette';
import useSavedPalettes from '~/hooks/useSavedPalettes';
import { useAppStore } from '~/stores/appStore';
import { trackEvent } from '~/utils/analytics';

import Button from '~/components/Button';
import Collapse from '~/components/Collapse';
import ExportPalette from '~/components/ExportPalette';
import SavePaletteModal from '~/components/SavePaletteModal';
import Tooltip from '~/components/Tooltip';

import GamutToggle from './GamutToggle';
import Options from './Options';

interface PaletteHeaderState {
  isSaveModalOpen: boolean;
  isSaving: boolean;
  name: string;
}

export default function PaletteHeader() {
  const { isAuthenticated } = useAuth();
  const { openLoginModal, showPaletteOptionsPanel, togglePaletteOptionsPanel } = useAppStore();
  const { hasCustomPaletteOptions } = usePalette();
  const {
    hasUnsavedChanges,
    loadedPaletteId,
    loadedPaletteName,
    renamePalette,
    savePalette,
    updateCurrentPalette,
  } = useSavedPalettes();
  const { min } = useBreakpoint(BREAKPOINTS);

  const [{ isSaveModalOpen, isSaving, name }, setState] = useSetState<PaletteHeaderState>({
    isSaveModalOpen: false,
    isSaving: false,
    name: loadedPaletteName,
  });

  // Sync local name state when loadedPaletteName changes (e.g., new palette or palette loaded)
  useEffect(() => {
    setState({ name: loadedPaletteName });
  }, [loadedPaletteName, setState]);

  const handleBlurName = () => {
    if (loadedPaletteName && loadedPaletteName !== name) {
      setState({
        name: loadedPaletteName,
      });
    }
  };

  const handleChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    setState({ name: value });
  };

  const handleClickSave = async () => {
    if (!isAuthenticated) {
      openLoginModal();

      return;
    }

    if (loadedPaletteId) {
      // Update existing palette
      setState({ isSaving: true });

      const success = await updateCurrentPalette();

      setState({ isSaving: false });

      if (success) {
        trackEvent('update-palette');
        addToast({ title: 'Palette updated', color: 'success' });
      }
    } else {
      // Open modal to save new palette
      setState({ isSaveModalOpen: true });
    }
  };

  const handleKeyDownName = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (!isAuthenticated) {
        openLoginModal();

        return;
      }

      if (loadedPaletteId) {
        renamePalette(loadedPaletteId, name);

        return;
      }

      savePalette(name);
    }
  };

  const handleSaveNewPalette = async (value: string) => {
    setState({ isSaving: true });

    const palette = await savePalette(value);

    setState({ isSaving: false });

    if (palette) {
      trackEvent('save-palette');
      setState({ isSaveModalOpen: false, name: palette.name });
      addToast({ title: 'Palette saved', color: 'success' });
    }
  };

  const isLarge = min('lg');

  return (
    <div data-testid="PaletteHeader">
      <div className="flex items-center justify-between">
        <Input
          classNames={{
            base: 'opacity-100',
            innerWrapper: 'pb-0',
            input: 'text-2xl font-semibold text-foreground-800',
          }}
          color={loadedPaletteName !== name ? 'warning' : undefined}
          isDisabled={!isAuthenticated}
          name="palette-name"
          onBlur={handleBlurName}
          onChange={handleChangeName}
          onKeyDown={handleKeyDownName}
          size="sm"
          value={name}
          variant="underlined"
        />

        <div className="flex items-center gap-1 md:gap-2">
          <GamutToggle />
          <Tooltip content="Palette Options" placement="bottom">
            <Button
              aria-label="Palette Options"
              isIconOnly={!isLarge}
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
              {isLarge && 'Options'}
            </Button>
          </Tooltip>
          <ExportPalette />
          <Button
            color={hasUnsavedChanges ? 'warning' : 'primary'}
            isDisabled={!!loadedPaletteId && !hasUnsavedChanges}
            isIconOnly={!isLarge}
            isLoading={isSaving}
            onPress={handleClickSave}
            size="menu"
            startContent={
              loadedPaletteId ? (
                <PencilSimpleLineIcon className="text-xl" />
              ) : (
                <HeartIcon className="text-xl" />
              )
            }
            variant="flat"
          >
            {isLarge && (loadedPaletteId ? 'Update' : 'Save')}
          </Button>
        </div>
      </div>

      <Collapse isOpen={showPaletteOptionsPanel}>
        <Options />
      </Collapse>
      <SavePaletteModal
        isOpen={isSaveModalOpen}
        isSaving={isSaving}
        onClose={() => setState({ isSaveModalOpen: false })}
        onSave={handleSaveNewPalette}
      />
    </div>
  );
}
