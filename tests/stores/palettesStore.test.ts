import { usePalettesStore } from '~/stores/palettesStore';

import type { SavedPalette } from '~/types';

const mockPalette: SavedPalette = {
  id: 'palette-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  userId: 'user-1',
  name: 'Test Palette',
  url: '/p/red-ff0000/blue-0000ff',
  isFavorite: false,
};

const mockPalette2: SavedPalette = {
  ...mockPalette,
  id: 'palette-2',
  name: 'Second Palette',
};

describe('stores/palettesStore', () => {
  beforeEach(() => {
    usePalettesStore.setState({
      error: null,
      palettes: [],
      status: 'idle',
    });
  });

  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = usePalettesStore.getState();

      expect(state.error).toBe(null);
      expect(state.palettes).toEqual([]);
      expect(state.status).toBe('idle');
    });
  });

  describe('addPalette', () => {
    it('prepends palette to the array', () => {
      usePalettesStore.setState({ palettes: [mockPalette2] });

      usePalettesStore.getState().addPalette(mockPalette);

      const { palettes } = usePalettesStore.getState();

      expect(palettes).toHaveLength(2);
      expect(palettes[0].id).toBe('palette-1');
      expect(palettes[1].id).toBe('palette-2');
    });
  });

  describe('removePalette', () => {
    it('removes palette by id', () => {
      usePalettesStore.setState({ palettes: [mockPalette, mockPalette2] });

      usePalettesStore.getState().removePalette('palette-1');

      const { palettes } = usePalettesStore.getState();

      expect(palettes).toHaveLength(1);
      expect(palettes[0].id).toBe('palette-2');
    });

    it('does nothing if id not found', () => {
      usePalettesStore.setState({ palettes: [mockPalette] });

      usePalettesStore.getState().removePalette('nonexistent');

      expect(usePalettesStore.getState().palettes).toHaveLength(1);
    });
  });

  describe('updatePalette', () => {
    it('merges updates into matching palette', () => {
      usePalettesStore.setState({ palettes: [mockPalette, mockPalette2] });

      usePalettesStore
        .getState()
        .updatePalette('palette-1', { name: 'Updated Name', isFavorite: true });

      const updated = usePalettesStore.getState().palettes[0];

      expect(updated.name).toBe('Updated Name');
      expect(updated.isFavorite).toBe(true);
      expect(updated.url).toBe(mockPalette.url);
    });

    it('does not affect other palettes', () => {
      usePalettesStore.setState({ palettes: [mockPalette, mockPalette2] });

      usePalettesStore.getState().updatePalette('palette-1', { name: 'Updated' });

      expect(usePalettesStore.getState().palettes[1].name).toBe('Second Palette');
    });
  });

  describe('setPalettes', () => {
    it('sets palettes from array', () => {
      usePalettesStore.getState().setPalettes([mockPalette, mockPalette2]);

      const state = usePalettesStore.getState();

      expect(state.palettes).toEqual([mockPalette, mockPalette2]);
      expect(state.status).toBe('idle');
    });
  });

  describe('setStatus', () => {
    it('updates status', () => {
      usePalettesStore.getState().setStatus('loading');

      expect(usePalettesStore.getState().status).toBe('loading');
    });
  });

  describe('setError', () => {
    it('sets error and status to error', () => {
      usePalettesStore.getState().setError('Something went wrong');

      const state = usePalettesStore.getState();

      expect(state.error).toBe('Something went wrong');
      expect(state.status).toBe('error');
    });

    it('clears error and sets status to idle when null', () => {
      usePalettesStore.setState({ error: 'previous error', status: 'error' });

      usePalettesStore.getState().setError(null);

      const state = usePalettesStore.getState();

      expect(state.error).toBe(null);
      expect(state.status).toBe('idle');
    });
  });

  describe('reset', () => {
    it('restores initial state', () => {
      usePalettesStore.setState({
        error: 'some error',
        palettes: [mockPalette],
        status: 'error',
      });

      usePalettesStore.getState().reset();

      const state = usePalettesStore.getState();

      expect(state.error).toBe(null);
      expect(state.palettes).toEqual([]);
      expect(state.status).toBe('idle');
    });
  });
});
