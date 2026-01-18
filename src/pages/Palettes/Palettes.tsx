import { type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { addToast, Button, Spinner } from '@heroui/react';

import useAuth from '~/hooks/useAuth';
import useSavedPalettes from '~/hooks/useSavedPalettes';

import { PaletteCard } from '~/pages/Palettes/PaletteCard';

export default function Palettes() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { deletePalette, isLoading, loadPalette, palettes, toggleFavorite } = useSavedPalettes();

  const handleDelete = async (id: string) => {
    const success = await deletePalette(id);

    if (success) {
      addToast({ title: 'Palette deleted', color: 'success' });
    }
  };

  const handleToggleFavorite = async (id: string) => {
    await toggleFavorite(id);
  };

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Spinner size="lg" />
      </div>
    );
  }

  let content: ReactNode = null;

  if (!isAuthenticated) {
    content = <div>Sign in to view your saved palettes</div>;
  } else if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4">
        <Spinner size="lg" />
        <p className="text-default-500">Loading palettes...</p>
      </div>
    );
  } else if (palettes.length === 0) {
    content = (
      <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4 text-center">
        <p className="text-default-500 text-lg">No saved palettes yet</p>
        <p className="text-default-400 text-sm">
          Create a color palette and click Save to add it here.
        </p>
        <Button color="primary" onPress={() => navigate('/')}>
          Create Palette
        </Button>
      </div>
    );
  } else {
    content = (
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {palettes.map(palette => (
          <PaletteCard
            key={palette.$id}
            onDelete={handleDelete}
            onLoad={loadPalette}
            onToggleFavorite={handleToggleFavorite}
            palette={palette}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-7xl mx-auto flex flex-col flex-1 mt-8 md:mt-16 px-4 md:px-8 items-center"
      data-uid="Palettes"
    >
      <h1 className="text-4xl font-bold mb-16">My Palettes</h1>
      {content}
    </div>
  );
}
