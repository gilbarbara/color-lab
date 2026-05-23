import { mockAddToast } from '~/test-mocks';
import { fireEvent, render, screen, waitFor } from '~/test-utils';

import Palettes from '~/pages/Palettes';

import type { SavedPalette } from '~/types';

const mockDeletePalette = vi.fn();
const mockToggleFavorite = vi.fn();

const mockPalette: SavedPalette = {
  id: 'palette-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  userId: 'user-1',
  name: 'Test Palette',
  url: '/p/red-ff0000/blue-0000ff',
  isFavorite: false,
};

let mockAuthReturn = {
  isAuthenticated: true,
  isLoading: false,
};

let mockSavedPalettesReturn = {
  deletePalette: mockDeletePalette,
  isLoading: false,
  palettes: [] as SavedPalette[],
  toggleFavorite: mockToggleFavorite,
};

vi.mock('~/hooks/useAuth', () => ({
  default: () => mockAuthReturn,
}));

vi.mock('~/hooks/useSavedPalettes', () => ({
  default: () => mockSavedPalettesReturn,
}));

vi.mock('~/utils/date', () => ({
  formatDate: () => 'Jan 2, 2024',
}));

vi.mock('~/utils/url', () => ({
  parsePaletteFromUrl: () => ({
    state: {
      colors: [
        { value: 'oklch(62.796% 0.25768 29.234)' },
        { value: 'oklch(45.201% 0.31321 264.05)' },
      ],
      globalOptions: {},
    },
    dropped: [],
  }),
  serializePaletteToUrl: () => '/p/red-ff0000/blue-0000ff',
}));

describe('Palettes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeletePalette.mockResolvedValue(true);
    mockAuthReturn = {
      isAuthenticated: true,
      isLoading: false,
    };
    mockSavedPalettesReturn = {
      deletePalette: mockDeletePalette,
      isLoading: false,
      palettes: [],
      toggleFavorite: mockToggleFavorite,
    };
  });

  describe('Render', () => {
    it('shows spinner while auth is loading', () => {
      mockAuthReturn = { isAuthenticated: false, isLoading: true };

      render(<Palettes />);

      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('shows sign in message when not authenticated', () => {
      mockAuthReturn = { isAuthenticated: false, isLoading: false };

      render(<Palettes />);

      expect(screen.getByTestId('Palettes')).toMatchSnapshot();
    });

    it('shows loading spinner when fetching palettes', () => {
      mockSavedPalettesReturn = { ...mockSavedPalettesReturn, isLoading: true };

      render(<Palettes />);

      expect(screen.getByTestId('Palettes')).toMatchSnapshot();
    });

    it('shows empty state when no palettes', () => {
      render(<Palettes />);

      expect(screen.getByTestId('Palettes')).toMatchSnapshot();
    });

    it('shows palette grid', () => {
      mockSavedPalettesReturn = {
        ...mockSavedPalettesReturn,
        palettes: [mockPalette, { ...mockPalette, id: 'palette-2', name: 'Second' }],
      };

      render(<Palettes />);

      expect(screen.getByTestId('Palettes')).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('shows toast on successful delete', async () => {
      mockSavedPalettesReturn = { ...mockSavedPalettesReturn, palettes: [mockPalette] };

      render(<Palettes />);

      // Open popconfirm
      const deleteButton = screen.getAllByRole('button')[1];

      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/remove "test palette"/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(mockDeletePalette).toHaveBeenCalledWith('palette-1');
      });

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({ title: 'Palette deleted', color: 'success' });
      });
    });

    it('calls toggleFavorite', () => {
      mockSavedPalettesReturn = { ...mockSavedPalettesReturn, palettes: [mockPalette] };

      render(<Palettes />);

      const favoriteButton = screen.getAllByRole('button')[0];

      fireEvent.click(favoriteButton);

      expect(mockToggleFavorite).toHaveBeenCalledWith('palette-1');
    });
  });
});
