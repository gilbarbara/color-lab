import { mockAddToast } from '~/test-mocks';
import { fireEvent, render, screen, waitFor } from '~/test-utils';

import Palettes from '~/pages/Palettes/Palettes';

import type { SavedPalette } from '~/types';

const mockDeletePalette = vi.fn();
const mockLoadPalette = vi.fn();
const mockToggleFavorite = vi.fn();

const mockPalette: SavedPalette = {
  $id: 'palette-1',
  $createdAt: '2024-01-01T00:00:00.000Z',
  $updatedAt: '2024-01-02T00:00:00.000Z',
  $permissions: [],
  $databaseId: 'color-lab',
  $tableId: 'palettes',
  $sequence: 1,
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
  loadPalette: mockLoadPalette,
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
    colors: [{ value: '#ff0000' }, { value: '#0000ff' }],
    globalOptions: {},
  }),
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
      loadPalette: mockLoadPalette,
      palettes: [],
      toggleFavorite: mockToggleFavorite,
    };
  });

  describe('Render', () => {
    it('shows spinner while auth is loading', () => {
      mockAuthReturn = { isAuthenticated: false, isLoading: true };

      const { container } = render(<Palettes />);

      expect(container).toMatchSnapshot();
    });

    it('shows sign in message when not authenticated', () => {
      mockAuthReturn = { isAuthenticated: false, isLoading: false };

      render(<Palettes />);

      expect(screen.getByText(/sign in to view/i)).toBeInTheDocument();
    });

    it('shows loading spinner when fetching palettes', () => {
      mockSavedPalettesReturn = { ...mockSavedPalettesReturn, isLoading: true };

      render(<Palettes />);

      expect(screen.getByText(/loading palettes/i)).toBeInTheDocument();
    });

    it('shows empty state when no palettes', () => {
      render(<Palettes />);

      expect(screen.getByText(/no saved palettes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create palette/i })).toBeInTheDocument();
    });

    it('shows palette grid', () => {
      mockSavedPalettesReturn = {
        ...mockSavedPalettesReturn,
        palettes: [mockPalette, { ...mockPalette, $id: 'palette-2', name: 'Second' }],
      };

      render(<Palettes />);

      expect(screen.getByText('Test Palette')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
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
