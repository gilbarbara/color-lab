/* eslint-disable react/no-array-index-key */
import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Card, CardBody } from '@heroui/react';
import { HeartIcon, TrashIcon } from '@phosphor-icons/react';

import { trackEvent } from '~/utils/analytics';
import { formatDate } from '~/utils/date';
import { parsePaletteFromUrl } from '~/utils/url';

import ColorCircle from '~/components/ColorCircle';
import Popconfirm from '~/components/Popconfirm';

import type { SavedPalette } from '~/types';

interface PaletteCardProps {
  onDelete: (id: string) => void;
  onLoad: (palette: SavedPalette) => void;
  onToggleFavorite: (id: string) => void;
  palette: SavedPalette;
}

export function PaletteCard(props: PaletteCardProps) {
  const { onDelete, onLoad, onToggleFavorite, palette } = props;
  const [isDeleting, setIsDeleting] = useState(false);
  const colors = parsePaletteFromUrl(palette.url)?.colors.map(c => c.value) ?? [];

  const handleClickDelete = async () => {
    setIsDeleting(true);
    onDelete(palette.$id);
    setIsDeleting(false);

    trackEvent('delete-saved-palette', { value: palette.name });
  };

  const handleClickFavorite = () => {
    onToggleFavorite(palette.$id);

    trackEvent(palette.isFavorite ? 'unfavorite-palette' : 'favorite-palette', {
      value: palette.name,
    });
  };

  const handleClickLoad = () => {
    onLoad(palette);

    trackEvent('load-saved-palette', { value: palette.name });
  };

  return (
    <Card className="w-full">
      <CardBody className="p-4">
        <div className="flex items-start justify-between mb-4">
          <Link className="space-y-0.5" onClick={handleClickLoad} to={palette.url}>
            <h3 className="font-semibold text-lg">{palette.name}</h3>
            <p className="text-xs text-default-500">{formatDate(palette.$updatedAt)}</p>
          </Link>
          <div className="flex items-center gap-0.5">
            <Button
              color={palette.isFavorite ? 'success' : undefined}
              isIconOnly
              onPress={handleClickFavorite}
              size="sm"
              variant="light"
            >
              <HeartIcon className="size-5" weight={palette.isFavorite ? 'fill' : 'regular'} />
            </Button>
            <Popconfirm
              description="This action cannot be undone."
              onConfirm={handleClickDelete}
              title={`Remove "${palette.name}"?`}
            >
              <Button color="danger" isIconOnly isLoading={isDeleting} size="sm" variant="light">
                {!isDeleting && <TrashIcon className="h-4 w-4" />}
              </Button>
            </Popconfirm>
          </div>
        </div>
        <Link
          className="flex gap-1 h-8 rounded-lg overflow-hidden"
          onClick={() => onLoad(palette)}
          to={palette.url}
        >
          {colors.map((color, index) => (
            <ColorCircle key={`${color}-${index}`} color={color} size="lg" />
          ))}
        </Link>
      </CardBody>
    </Card>
  );
}
