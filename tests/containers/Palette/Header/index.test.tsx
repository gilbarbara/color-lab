import { useAppStore } from '~/stores/appStore';
import { createTestPalette } from '~/test-fixtures';
import { getGeneratorStore, mockAddToast } from '~/test-mocks';
import { act, fireEvent, render, screen, waitFor, within } from '~/test-utils';

import Header from '~/containers/Palette/Header';

const mockSavePalette = vi.fn();
const mockUpdateCurrentPalette = vi.fn();

const savedPalettesState: {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  paletteId: string | undefined;
  savePalette: typeof mockSavePalette;
  updateCurrentPalette: typeof mockUpdateCurrentPalette;
} = {
  hasUnsavedChanges: false,
  isSaving: false,
  paletteId: undefined,
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
}

describe('PaletteHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSavedPalettesState();
    getGeneratorStore().setState(createTestPalette(1));
    useAppStore.setState({
      gamut: 'p3',
      paletteId: null,
      showLoginModal: false,
      showPaletteOptionsPanel: false,
    });
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
      savedPalettesState.hasUnsavedChanges = true;
      act(() => getGeneratorStore().getState().setName('My Palette'));
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

  describe('Loading a saved palette from the URL', () => {
    it('shows "Loading…" and disables the name field for an unvalidated id (no ?name=)', () => {
      render(<Header />, {
        authState: { isAuthenticated: true, user: { uid: 'u1' } },
        initialEntries: ['/p/Primary-FF0044?id=abc123'],
      });

      expect(screen.getByDisplayValue('Loading…')).toBeDisabled();
    });

    it('shows the URL name instead of "Loading…" when ?name= is present', () => {
      act(() => getGeneratorStore().getState().setName('Sunset'));

      render(<Header />, {
        authState: { isAuthenticated: true, user: { uid: 'u1' } },
        initialEntries: ['/p/Primary-FF0044?name=Sunset&id=abc123'],
      });

      expect(screen.queryByDisplayValue('Loading…')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Sunset')).toBeEnabled();
    });

    it('shows the resolved name once the id is validated (appStore.paletteId set)', () => {
      useAppStore.setState({ paletteId: 'abc123' });
      act(() => getGeneratorStore().getState().setName('My Palette'));

      render(<Header />, {
        authState: { isAuthenticated: true, user: { uid: 'u1' } },
        initialEntries: ['/p/Primary-FF0044?id=abc123'],
      });

      expect(screen.queryByDisplayValue('Loading…')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('My Palette')).toBeEnabled();
    });

    it('does not show "Loading…" when the URL has no saved-palette id', () => {
      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      expect(screen.queryByDisplayValue('Loading…')).not.toBeInTheDocument();
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

    it('allows editing the palette name when unauthenticated', () => {
      render(<Header />);

      expect(screen.getByDisplayValue('Color Palette')).toBeEnabled();
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
      savedPalettesState.hasUnsavedChanges = false;

      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      expect(screen.getByRole('button', { name: /update/i })).toBeDisabled();
    });

    it('updates the generator name on commit without saving (no paletteId)', async () => {
      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      const input = screen.getByDisplayValue('Color Palette') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.change(input, { target: { value: '  New Name  ' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(getGeneratorStore().getState().name).toBe('New Name');
      });
      expect(mockSavePalette).not.toHaveBeenCalled();
    });

    it('updates the generator name on commit for a saved palette (no separate rename)', async () => {
      savedPalettesState.paletteId = 'p1';
      act(() => getGeneratorStore().getState().setName('My Palette'));

      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      const input = screen.getByDisplayValue('My Palette') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.change(input, { target: { value: 'Renamed' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(getGeneratorStore().getState().name).toBe('Renamed');
      });
      expect(mockSavePalette).not.toHaveBeenCalled();
    });

    it('keeps the current name and does not save on a whitespace commit', async () => {
      act(() => getGeneratorStore().getState().setName('My Palette'));

      render(<Header />, { authState: { isAuthenticated: true, user: { uid: 'u1' } } });

      const input = screen.getByDisplayValue('My Palette') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.blur(input);

      // Give any potential async commit a tick to misfire
      await Promise.resolve();

      expect(mockSavePalette).not.toHaveBeenCalled();
      expect(getGeneratorStore().getState().name).toBe('My Palette');
      expect(input.value).toBe('My Palette');
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
