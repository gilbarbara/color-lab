import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@heroui/react';

import { DEFAULT_PALETTE_NAME } from '~/config/globals';

import { Input } from '~/components/Field/Input';
import Modal from '~/components/Modal';

interface SavePaletteModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function SavePaletteModal({
  isOpen,
  isSaving,
  onClose,
  onSave,
}: SavePaletteModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = (event: FormEvent) => {
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
      maxWidth="sm"
      onOpenChange={handleOpenChange}
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
