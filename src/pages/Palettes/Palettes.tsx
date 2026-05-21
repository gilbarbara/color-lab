import { type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { addToast, Button, Spinner } from '@heroui/react';
import { PlusIcon, SignInIcon } from '@phosphor-icons/react';

import useApp from '~/hooks/useApp';
import useAuth from '~/hooks/useAuth';
import usePalette from '~/hooks/usePalette';
import useSavedPalettes from '~/hooks/useSavedPalettes';

import Feedback from '~/components/Feedback';
import Page from '~/components/Page';
import { PaletteCard } from '~/pages/Palettes/PaletteCard';

export default function Palettes() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { deletePalette, isLoading, palettes, toggleFavorite } = useSavedPalettes();
  const { generatorUrl } = usePalette();
  const { openLoginModal } = useApp('openLoginModal');

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

  let content: ReactNode;

  if (!isAuthenticated) {
    content = (
      <Feedback description="Sign in to view your saved palettes" type={null}>
        <Button color="primary" onPress={openLoginModal} startContent={<SignInIcon />}>
          Sign In
        </Button>
      </Feedback>
    );
  } else if (isLoading) {
    content = (
      <Feedback
        description={<span className="text-foreground-500">Loading palettes...</span>}
        icon={<Spinner size="lg" />}
        type={null}
      />
    );
  } else if (palettes.length === 0) {
    content = (
      <Feedback
        description="Create a color palette and click Save to add it here."
        title="You have no saved palettes yet."
        type="empty"
      >
        <Button
          color="primary"
          onPress={() => navigate(generatorUrl)}
          startContent={<PlusIcon weight="bold" />}
        >
          Create Palette
        </Button>
      </Feedback>
    );
  } else {
    content = (
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {palettes.map(palette => (
          <PaletteCard
            key={palette.id}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
            palette={palette}
          />
        ))}
      </div>
    );
  }

  return (
    <Page className="text-center" data-testid="Palettes">
      <h1 className="text-4xl font-bold mb-16">My Palettes</h1>
      {content}
    </Page>
  );
}
