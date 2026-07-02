import { cn } from '@heroui/react';
import { useSearchParams } from 'next/navigation';

import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';
import { getPaletteIdFromUrl } from '~/utils/url';

import EditableInput, { type CommitAction } from '~/components/EditableInput';

/**
 * Palette name field, isolated so the navigation subscription (useSearchParams)
 * lives on this leaf instead of the whole PaletteHeader. A `pushState` palette
 * edit re-renders only this input, not the header's menu/export/share/save cluster.
 */
export default function NameField() {
  const { paletteId: appPaletteId } = useApp('paletteId');
  const { name, setName } = useGenerator('name', 'setName');

  // The URL carries an unvalidated saved-palette `id`, but the record's name
  // resolves only after auth settles and usePaletteIdSync validates it (setting
  // appStore.paletteId). Until then show "Loading…" in the name field — unless the
  // URL already carries the name (`?name=`), which parsePaletteFromUrl has already
  // seeded into the store. An invalid id is stripped by usePaletteIdSync, so this
  // self-resolves either way.
  const searchParams = useSearchParams();
  const urlPaletteId = getPaletteIdFromUrl(searchParams.toString());
  const isLoadingSavedPalette = !!urlPaletteId && !searchParams.get('name') && !appPaletteId;

  // Naming is decoupled from saving: committing the name just updates the store,
  // which useUrlSync reflects into the URL `?name=`. Available to everyone.
  const handleCommitName = (value: string, _action: CommitAction) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return; // empty not allowed — input reverts to the current name
    }

    trackEvent('palette:rename', { name: trimmed });
    setName(trimmed);
  };

  return (
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
  );
}
