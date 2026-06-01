import { useAppStore } from '~/stores/appStore';
import { createTestPalette } from '~/test-fixtures';
import { getGeneratorStore, mockAddToast } from '~/test-mocks';
import { act, fireEvent, render, screen, waitFor, within } from '~/test-utils';

import Header from '~/containers/Palette/Header';

const mockRenamePalette = vi.fn();
const mockSavePalette = vi.fn();
const mockUpdateCurrentPalette = vi.fn();

const savedPalettesState: {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  paletteId: string | undefined;
  paletteName: string;
  renamePalette: typeof mockRenamePalette;
  savePalette: typeof mockSavePalette;
  updateCurrentPalette: typeof mockUpdateCurrentPalette;
} = {
  hasUnsavedChanges: false,
  isSaving: false,
  paletteId: undefined,
  paletteName: 'Color Palette',
  renamePalette: mockRenamePalette,
  savePalette: mockSavePalette,
  updateCurrentPalette: mockUpdateCurrentPalette,
};

vi.mock('~/hooks/useSavedPalettes', () => ({
  default: () => savedPalettesState,
}));

function resetSavedPalettesState() {
  savedPalettesState.hasUnsavedChanges = false;
  savedPalettesState.isSaving = false;
  savedPalettesState.paletteId = undefined;
  savedPalettesState.paletteName = 'Color Palette';
}

describe('PaletteHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSavedPalettesState();
    getGeneratorStore().setState(createTestPalette(1));
    useAppStore.setState({ showPaletteOptionsPanel: false, showLoginModal: false, gamut: 'p3' });
  });

  describe('Render', () => {
    it('renders unauthenticated state', () => {
      render(<Header />);

      expect(screen.getByTestId('PaletteHeader')).toMatchSnapshot();
    });

    it('renders authenticated, no saved palette', () => {
      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      expect(screen.getByTestId('PaletteHeader')).toMatchSnapshot();
    });

    it('renders with saved palette and unsaved changes', () => {
      savedPalettesState.paletteId = 'p1';
      savedPalettesState.paletteName = 'My Palette';
      savedPalettesState.hasUnsavedChanges = true;
      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      expect(screen.getByTestId('PaletteHeader')).toMatchSnapshot();
    });

    it('renders with options panel open', () => {
      useAppStore.setState({ showPaletteOptionsPanel: true });
      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      expect(screen.getByTestId('PaletteHeader')).toMatchSnapshot();
    });

    it('renders custom palette options badge when options differ from default', () => {
      const base = createTestPalette(1);

      getGeneratorStore().setState({
        ...base,
        globalOptions: { ...base.globalOptions, variant: 'vibrant' },
      });
      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      expect(screen.getByTestId('PaletteHeader')).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('toggles options panel on Options button click', () => {
      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      fireEvent.click(screen.getByRole('button', { name: 'Palette Options' }));

      expect(useAppStore.getState().showPaletteOptionsPanel).toBe(true);
    });

    it('opens login modal when unauthenticated user clicks Save', () => {
      render(<Header />);

      fireEvent.click(screen.getByRole('button', { name: /save|heart/i }));

      expect(useAppStore.getState().showLoginModal).toBe(true);
      expect(mockSavePalette).not.toHaveBeenCalled();
    });

    it('disables palette name input when unauthenticated', () => {
      savedPalettesState.paletteName = 'Color Palette';
      render(<Header />);

      expect(screen.getByDisplayValue('Color Palette')).toBeDisabled();
    });

    it('opens save modal when authenticated user without paletteId clicks Save', async () => {
      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('calls updateCurrentPalette when authenticated with paletteId and unsaved changes', async () => {
      savedPalettesState.paletteId = 'p1';
      savedPalettesState.paletteName = 'My Palette';
      savedPalettesState.hasUnsavedChanges = true;
      mockUpdateCurrentPalette.mockResolvedValue(true);

      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      fireEvent.click(screen.getByRole('button', { name: /update/i }));

      await waitFor(() => {
        expect(mockUpdateCurrentPalette).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          title: 'Palette updated',
          color: 'success',
        });
      });
    });

    it('disables Save button when paletteId set and no unsaved changes', () => {
      savedPalettesState.paletteId = 'p1';
      savedPalettesState.paletteName = 'My Palette';
      savedPalettesState.hasUnsavedChanges = false;

      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      expect(screen.getByRole('button', { name: /update/i })).toBeDisabled();
    });

    it('calls savePalette when authenticated user commits name with no paletteId', async () => {
      savedPalettesState.paletteName = 'Color Palette';
      mockSavePalette.mockResolvedValue({ id: 'p1', name: 'New Name' });

      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      const input = screen.getByDisplayValue('Color Palette') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.change(input, { target: { value: '  New Name  ' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockSavePalette).toHaveBeenCalledWith('New Name');
      });
    });

    it('calls renamePalette when authenticated user commits name with paletteId', async () => {
      savedPalettesState.paletteId = 'p1';
      savedPalettesState.paletteName = 'My Palette';
      mockRenamePalette.mockResolvedValue(true);

      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      const input = screen.getByDisplayValue('My Palette') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.change(input, { target: { value: 'Renamed' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockRenamePalette).toHaveBeenCalledWith('p1', 'Renamed');
      });
    });

    it('does not call save/rename when name is whitespace', async () => {
      savedPalettesState.paletteName = 'Color Palette';

      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      const input = screen.getByDisplayValue('Color Palette') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.blur(input);

      // Give any potential async commit a tick to misfire
      await Promise.resolve();

      expect(mockSavePalette).not.toHaveBeenCalled();
      expect(mockRenamePalette).not.toHaveBeenCalled();
    });

    it('saves a new palette via the save modal and shows success toast', async () => {
      mockSavePalette.mockResolvedValue({ id: 'p1', name: 'Fresh' });

      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const nameInput = within(screen.getByRole('dialog')).getByLabelText(/name/i);

      fireEvent.change(nameInput, { target: { value: 'Fresh' } });
      fireEvent.submit(nameInput.closest('form')!);

      await waitFor(() => {
        expect(mockSavePalette).toHaveBeenCalledWith('Fresh');
      });

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          title: 'Palette saved',
          color: 'success',
        });
      });
    });
  });
});
