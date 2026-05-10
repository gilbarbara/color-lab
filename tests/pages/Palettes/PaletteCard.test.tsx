import { fireEvent, render, screen, waitFor } from '~/test-utils';

import { PaletteCard } from '~/pages/Palettes/PaletteCard';

import type { SavedPalette } from '~/types';

const mockCaptureMessage = vi.fn();

vi.mock('@sentry/react', () => ({
  captureMessage: (...arguments_: unknown[]) => mockCaptureMessage(...arguments_),
}));

vi.mock('~/utils/date', () => ({
  formatDate: () => 'Jan 2, 2024',
}));

const mockParsePaletteFromUrl = vi.fn();

vi.mock('~/utils/url', () => ({
  parsePaletteFromUrl: (url: string) => mockParsePaletteFromUrl(url),
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
    mockParsePaletteFromUrl.mockReturnValue({
      state: {
        colors: [{ value: '#ff0000' }, { value: '#0000ff' }],
        globalOptions: {},
      },
      dropped: [] as string[],
    });
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

    it('captures a Sentry warning when the saved palette has dropped colors', () => {
      mockParsePaletteFromUrl.mockReturnValue({
        state: {
          colors: [{ value: '#ff0000' }],
          globalOptions: {},
        },
        dropped: ['Bad', '(unnamed)'],
      });

      renderCard();

      expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        'Saved palette has invalid colors: Bad, (unnamed)',
        expect.objectContaining({
          level: 'warning',
          tags: { source: 'PaletteCard' },
          extra: expect.objectContaining({
            paletteId: 'palette-1',
            paletteName: 'Test Palette',
            dropped: ['Bad', '(unnamed)'],
          }),
        }),
      );
    });

    it('does not capture when there are no dropped colors', () => {
      renderCard();

      expect(mockCaptureMessage).not.toHaveBeenCalled();
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
