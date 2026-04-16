/* eslint-disable react/no-array-index-key */
import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Card, CardBody } from '@heroui/react';
import { HeartIcon, TrashIcon } from '@phosphor-icons/react';

import { trackEvent } from '~/utils/analytics';
import { formatDate } from '~/utils/date';
import { parsePaletteFromUrl } from '~/utils/url';

import ColorBox from '~/components/ColorBox';
import Popconfirm from '~/components/Popconfirm';

import type { SavedPalette } from '~/types';

interface PaletteCardProps {
  onDelete: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => void;
  palette: SavedPalette;
}

export function PaletteCard(props: PaletteCardProps) {
  const { onDelete, onToggleFavorite, palette } = props;
  const [isDeleting, setIsDeleting] = useState(false);
  const colors = parsePaletteFromUrl(palette.url)?.colors.map(c => c.value) ?? [];

  const handleClickDelete = async () => {
    setIsDeleting(true);
    await onDelete(palette.id);
    setIsDeleting(false);

    trackEvent('delete-saved-palette', { value: palette.name });
  };

  const handleClickFavorite = () => {
    onToggleFavorite(palette.id);

    trackEvent(palette.isFavorite ? 'unfavorite-palette' : 'favorite-palette', {
      value: palette.name,
    });
  };

  const handleClickLoad = () => {
    trackEvent('load-saved-palette', { value: palette.name });
  };

  return (
    <Card className="w-full" data-testid="PaletteCard">
      <CardBody className="p-4">
        <div className="flex items-start mb-4">
          <div className="grow space-y-0.5">
            <h3 className="font-semibold text-lg">
              <Link
                aria-label={`Load Palette (${palette.name})`}
                className="flex hover:underline"
                onClick={handleClickLoad}
                to={palette.url}
              >
                {palette.name}
              </Link>
            </h3>
            <p className="text-xs text-default-500">{formatDate(palette.updatedAt)}</p>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              aria-label={`${palette.isFavorite ? 'Unfavorite Palette' : 'Favorite Palette'} (${palette.name})`}
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
              <Button
                aria-label={`Remove Palette (${palette.name})`}
                color="danger"
                isIconOnly
                isLoading={isDeleting}
                size="sm"
                variant="light"
              >
                {!isDeleting && <TrashIcon className="h-4 w-4" />}
              </Button>
            </Popconfirm>
          </div>
        </div>
        <Link
          aria-label={`Load Palette Colors (${palette.name})`}
          className="flex flex-wrap gap-2 rounded-lg cursor-pointer overflow-hidden"
          onClick={handleClickLoad}
          to={palette.url}
        >
          {colors.map((color, index) => (
            <ColorBox key={`${color}-${index}`} as="span" color={color} />
          ))}
        </Link>
      </CardBody>
    </Card>
  );
}
