import type { SubmitEvent } from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@heroui/react';

import { DEFAULT_PALETTE_NAME } from '~/config/globals';

import { Input } from '~/components/Field/Input';
import Modal from '~/components/Modal';

interface SavePaletteModalProps {
  defaultName?: string;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function SavePaletteModal({
  defaultName = '',
  isOpen,
  isSaving,
  onClose,
  onSave,
}: SavePaletteModalProps) {
  const [name, setName] = useState(defaultName);

  // Re-seed when the modal opens with a fresh defaultName (user typed a draft, then clicked Save)
  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
    }
  }, [isOpen, defaultName]);

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    if (name.trim()) {
      onSave(name.trim());
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName('');
      onClose();
    }
  };

  return (
    <Modal
      footer={
        <div className="flex gap-2 justify-end">
          <Button onPress={onClose} variant="light">
            Cancel
          </Button>
          <Button
            color="primary"
            form="save-palette-form"
            isDisabled={!name.trim()}
            isLoading={isSaving}
            type="submit"
          >
            Save
          </Button>
        </div>
      }
      header="Save Palette"
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      size="sm"
    >
      <form className="flex flex-col gap-4" id="save-palette-form" onSubmit={handleSubmit}>
        <Input
          autoComplete="off"
          autoFocus
          isRequired
          label="Name"
          name="name"
          onChange={event => setName(event.target.value)}
          placeholder={DEFAULT_PALETTE_NAME}
          value={name}
        />
      </form>
    </Modal>
  );
}
