import { fireEvent, render, screen, waitFor } from '~/test-utils';

import { PaletteCard } from '~/pages/Palettes/PaletteCard';

import type { SavedPalette } from '~/types';

vi.mock('~/utils/date', () => ({
  formatDate: () => 'Jan 2, 2024',
}));

vi.mock('~/utils/url', () => ({
  parsePaletteFromUrl: () => ({
    colors: [{ value: '#ff0000' }, { value: '#0000ff' }],
    globalOptions: {},
  }),
}));

const mockPalette: SavedPalette = {
  id: 'palette-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  userId: 'user-1',
  name: 'Test Palette',
  url: '/p/red-ff0000/blue-0000ff',
  isFavorite: false,
};

const mockOnDelete = vi.fn();
const mockOnToggleFavorite = vi.fn();

function renderCard(palette = mockPalette) {
  return render(
    <PaletteCard
      onDelete={mockOnDelete}
      onToggleFavorite={mockOnToggleFavorite}
      palette={palette}
    />,
  );
}

describe('PaletteCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders correctly', () => {
      renderCard();

      expect(screen.getByTestId('PaletteCard')).toMatchSnapshot();
    });

    it('renders filled heart for favorited palette', () => {
      renderCard({ ...mockPalette, isFavorite: true });

      expect(screen.getByTestId('PaletteCard')).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('calls onToggleFavorite when favorite button is clicked', () => {
      renderCard();

      const buttons = screen.getAllByRole('button');
      const favoriteButton = buttons[0];

      fireEvent.click(favoriteButton);

      expect(mockOnToggleFavorite).toHaveBeenCalledWith('palette-1');
    });

    it('calls onDelete after confirming deletion', async () => {
      renderCard();

      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons[1];

      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/remove "test palette"/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('palette-1');
      });
    });
  });
});
