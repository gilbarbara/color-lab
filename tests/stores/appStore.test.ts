import { DEFAULT_PALETTE_NAME } from '~/config/globals';
import { initialState, useAppStore } from '~/stores/appStore';

const PERSISTED_KEYS = [
  'colorSpacing',
  'exportColorFormat',
  'exportFormatType',
  'gamut',
  'showColorOptionsPanel',
  'showPaletteOptionsPanel',
  'showPreview',
  'showSidebar',
];

function readPersistedState(): { state: Record<string, unknown>; version: number } | null {
  const raw = localStorage.getItem('color-lab');

  return raw ? JSON.parse(raw) : null;
}

describe('stores/appStore', () => {
  beforeEach(() => {
    useAppStore.setState(initialState);
  });

  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useAppStore.getState();

      expect(state).toMatchSnapshot();
    });
  });

  describe('clearPalette', () => {
    it('clears all loaded palette fields', () => {
      useAppStore.getState().setPalette('palette-123', 'My Palette', '/p/Primary-FF0000');
      useAppStore.getState().clearPalette();

      const state = useAppStore.getState();

      expect(state.paletteId).toBe(null);
      expect(state.paletteName).toBe(DEFAULT_PALETTE_NAME);
      expect(state.lastSavedUrl).toBe(null);
      expect(state.sessionPalettePath).toBe(null);
    });
  });

  describe('closeLoginModal', () => {
    it('sets showLoginModal to false', () => {
      useAppStore.setState({ showLoginModal: true });

      useAppStore.getState().closeLoginModal();

      expect(useAppStore.getState().showLoginModal).toBe(false);
    });
  });

  describe('openLoginModal', () => {
    it('sets showLoginModal to true', () => {
      expect(useAppStore.getState().showLoginModal).toBe(false);

      useAppStore.getState().openLoginModal();

      expect(useAppStore.getState().showLoginModal).toBe(true);
    });
  });

  describe('requestColorScroll', () => {
    it('sets request with nonce 1 from null', () => {
      expect(useAppStore.getState().colorScrollRequest).toBe(null);

      useAppStore.getState().requestColorScroll('color-a');

      expect(useAppStore.getState().colorScrollRequest).toEqual({ id: 'color-a', nonce: 1 });
    });

    it('bumps nonce and updates id on subsequent calls', () => {
      const { requestColorScroll } = useAppStore.getState();

      requestColorScroll('color-a');
      requestColorScroll('color-b');
      requestColorScroll('color-c');

      expect(useAppStore.getState().colorScrollRequest).toEqual({ id: 'color-c', nonce: 3 });
    });

    it('bumps nonce even when id repeats', () => {
      const { requestColorScroll } = useAppStore.getState();

      requestColorScroll('color-a');
      requestColorScroll('color-a');

      expect(useAppStore.getState().colorScrollRequest).toEqual({ id: 'color-a', nonce: 2 });
    });
  });

  describe('requestPreviewScroll', () => {
    it('increments previewScrollNonce from 0', () => {
      expect(useAppStore.getState().previewScrollNonce).toBe(0);

      useAppStore.getState().requestPreviewScroll();

      expect(useAppStore.getState().previewScrollNonce).toBe(1);
    });

    it('increments previewScrollNonce on each call', () => {
      const { requestPreviewScroll } = useAppStore.getState();

      requestPreviewScroll();
      requestPreviewScroll();
      requestPreviewScroll();

      expect(useAppStore.getState().previewScrollNonce).toBe(3);
    });
  });

  describe('setExportColorFormat', () => {
    it('updates exportColorFormat to hex', () => {
      useAppStore.getState().setExportColorFormat('hex');

      expect(useAppStore.getState().exportColorFormat).toBe('hex');
    });

    it('updates exportColorFormat to hsl', () => {
      useAppStore.getState().setExportColorFormat('hsl');

      expect(useAppStore.getState().exportColorFormat).toBe('hsl');
    });

    it('updates exportColorFormat to rgb', () => {
      useAppStore.getState().setExportColorFormat('rgb');

      expect(useAppStore.getState().exportColorFormat).toBe('rgb');
    });

    it('updates exportColorFormat to rgb-channels', () => {
      useAppStore.getState().setExportColorFormat('rgb-channels');

      expect(useAppStore.getState().exportColorFormat).toBe('rgb-channels');
    });
  });

  describe('setGamut', () => {
    it('updates gamut to p3', () => {
      useAppStore.getState().setGamut('p3');

      expect(useAppStore.getState().gamut).toBe('p3');
    });

    it('updates gamut to srgb', () => {
      useAppStore.getState().setGamut('srgb');

      expect(useAppStore.getState().gamut).toBe('srgb');
    });
  });

  describe('setExportFormatType', () => {
    it('updates exportFormatType to tailwind3', () => {
      useAppStore.getState().setExportFormatType('tailwind3');

      expect(useAppStore.getState().exportFormatType).toBe('tailwind3');
    });

    it('updates exportFormatType to css', () => {
      useAppStore.getState().setExportFormatType('css');

      expect(useAppStore.getState().exportFormatType).toBe('css');
    });

    it('updates exportFormatType to scss', () => {
      useAppStore.getState().setExportFormatType('scss');

      expect(useAppStore.getState().exportFormatType).toBe('scss');
    });

    it('updates exportFormatType to svg', () => {
      useAppStore.getState().setExportFormatType('svg');

      expect(useAppStore.getState().exportFormatType).toBe('svg');
    });
  });

  describe('setPalette', () => {
    it('sets all loaded palette fields', () => {
      useAppStore.getState().setPalette('palette-123', 'My Palette', '/p/Primary-FF0000');

      const state = useAppStore.getState();

      expect(state.paletteId).toBe('palette-123');
      expect(state.paletteName).toBe('My Palette');
      expect(state.lastSavedUrl).toBe('/p/Primary-FF0000');
    });

    it('can set fields to null', () => {
      useAppStore.getState().setPalette('id', 'name', 'url');
      useAppStore.getState().setPalette(null, null, null);

      const state = useAppStore.getState();

      expect(state.paletteId).toBe(null);
      expect(state.paletteName).toBe(DEFAULT_PALETTE_NAME);
      expect(state.lastSavedUrl).toBe(null);
    });
  });

  describe('setColorSpacing', () => {
    it('updates colorSpacing from the wide default', () => {
      expect(useAppStore.getState().colorSpacing).toBe('wide');

      useAppStore.getState().setColorSpacing('golden');

      expect(useAppStore.getState().colorSpacing).toBe('golden');
    });
  });

  describe('setSessionPalettePath', () => {
    it('stores and clears the session palette path', () => {
      useAppStore.getState().setSessionPalettePath('/p/Primary-FF0000?id=p1');

      expect(useAppStore.getState().sessionPalettePath).toBe('/p/Primary-FF0000?id=p1');

      useAppStore.getState().setSessionPalettePath(null);

      expect(useAppStore.getState().sessionPalettePath).toBe(null);
    });
  });

  describe('toggleBottomBar', () => {
    it('toggles showBottomBar from false to true', () => {
      expect(useAppStore.getState().showBottomBar).toBe(false);

      useAppStore.getState().toggleBottomBar();

      expect(useAppStore.getState().showBottomBar).toBe(true);
    });

    it('toggles showBottomBar from true to false', () => {
      useAppStore.setState({ showBottomBar: true });

      useAppStore.getState().toggleBottomBar();

      expect(useAppStore.getState().showBottomBar).toBe(false);
    });

    it('toggles multiple times correctly', () => {
      const { toggleBottomBar } = useAppStore.getState();

      expect(useAppStore.getState().showBottomBar).toBe(false);

      toggleBottomBar();
      expect(useAppStore.getState().showBottomBar).toBe(true);

      toggleBottomBar();
      expect(useAppStore.getState().showBottomBar).toBe(false);

      toggleBottomBar();
      expect(useAppStore.getState().showBottomBar).toBe(true);
    });

    it('forces showBottomBar to true when called with true', () => {
      useAppStore.getState().toggleBottomBar(true);

      expect(useAppStore.getState().showBottomBar).toBe(true);
    });

    it('forces showBottomBar to false when called with false', () => {
      useAppStore.setState({ showBottomBar: true });

      useAppStore.getState().toggleBottomBar(false);

      expect(useAppStore.getState().showBottomBar).toBe(false);
    });

    it('keeps showBottomBar when forced to current value', () => {
      useAppStore.setState({ showBottomBar: true });

      useAppStore.getState().toggleBottomBar(true);

      expect(useAppStore.getState().showBottomBar).toBe(true);
    });
  });

  describe('toggleColorOptionsPanel', () => {
    it('toggles showColorOptionsPanel from false to true', () => {
      expect(useAppStore.getState().showColorOptionsPanel).toBe(false);

      useAppStore.getState().toggleColorOptionsPanel();

      expect(useAppStore.getState().showColorOptionsPanel).toBe(true);
    });

    it('toggles showColorOptionsPanel from true to false', () => {
      useAppStore.setState({ showColorOptionsPanel: true });

      useAppStore.getState().toggleColorOptionsPanel();

      expect(useAppStore.getState().showColorOptionsPanel).toBe(false);
    });

    it('toggles multiple times correctly', () => {
      const { toggleColorOptionsPanel } = useAppStore.getState();

      expect(useAppStore.getState().showColorOptionsPanel).toBe(false);

      toggleColorOptionsPanel();
      expect(useAppStore.getState().showColorOptionsPanel).toBe(true);

      toggleColorOptionsPanel();
      expect(useAppStore.getState().showColorOptionsPanel).toBe(false);

      toggleColorOptionsPanel();
      expect(useAppStore.getState().showColorOptionsPanel).toBe(true);
    });
  });

  describe('togglePaletteOptionsPanel', () => {
    it('toggles showPaletteOptionsPanel from false to true', () => {
      expect(useAppStore.getState().showPaletteOptionsPanel).toBe(false);

      useAppStore.getState().togglePaletteOptionsPanel();

      expect(useAppStore.getState().showPaletteOptionsPanel).toBe(true);
    });

    it('toggles showPaletteOptionsPanel from true to false', () => {
      useAppStore.setState({ showPaletteOptionsPanel: true });

      useAppStore.getState().togglePaletteOptionsPanel();

      expect(useAppStore.getState().showPaletteOptionsPanel).toBe(false);
    });

    it('toggles multiple times correctly', () => {
      const { togglePaletteOptionsPanel } = useAppStore.getState();

      expect(useAppStore.getState().showPaletteOptionsPanel).toBe(false);

      togglePaletteOptionsPanel();
      expect(useAppStore.getState().showPaletteOptionsPanel).toBe(true);

      togglePaletteOptionsPanel();
      expect(useAppStore.getState().showPaletteOptionsPanel).toBe(false);

      togglePaletteOptionsPanel();
      expect(useAppStore.getState().showPaletteOptionsPanel).toBe(true);
    });
  });

  describe('toggleSidebar', () => {
    it('toggles showSidebar from true to false', () => {
      expect(useAppStore.getState().showSidebar).toBe(true);

      useAppStore.getState().toggleSidebar();

      expect(useAppStore.getState().showSidebar).toBe(false);
    });

    it('toggles showSidebar from false to true', () => {
      useAppStore.setState({ showSidebar: false });

      useAppStore.getState().toggleSidebar();

      expect(useAppStore.getState().showSidebar).toBe(true);
    });

    it('toggles multiple times correctly', () => {
      const { toggleSidebar } = useAppStore.getState();

      expect(useAppStore.getState().showSidebar).toBe(true);

      toggleSidebar();
      expect(useAppStore.getState().showSidebar).toBe(false);

      toggleSidebar();
      expect(useAppStore.getState().showSidebar).toBe(true);

      toggleSidebar();
      expect(useAppStore.getState().showSidebar).toBe(false);
    });

    it('forces showSidebar to true when called with true', () => {
      useAppStore.setState({ showSidebar: false });

      useAppStore.getState().toggleSidebar(true);

      expect(useAppStore.getState().showSidebar).toBe(true);
    });

    it('forces showSidebar to false when called with false', () => {
      useAppStore.getState().toggleSidebar(false);

      expect(useAppStore.getState().showSidebar).toBe(false);
    });

    it('keeps showSidebar when forced to current value', () => {
      useAppStore.getState().toggleSidebar(true);

      expect(useAppStore.getState().showSidebar).toBe(true);
    });
  });

  describe('togglePreview', () => {
    it('toggles showPreview from true to false', () => {
      expect(useAppStore.getState().showPreview).toBe(true);

      useAppStore.getState().togglePreview();

      expect(useAppStore.getState().showPreview).toBe(false);
    });

    it('toggles showPreview from false to true', () => {
      useAppStore.setState({ showPreview: false });

      useAppStore.getState().togglePreview();

      expect(useAppStore.getState().showPreview).toBe(true);
    });

    it('forces showPreview to true when called with true', () => {
      useAppStore.setState({ showPreview: false });

      useAppStore.getState().togglePreview(true);

      expect(useAppStore.getState().showPreview).toBe(true);
    });

    it('forces showPreview to false when called with false', () => {
      useAppStore.getState().togglePreview(false);

      expect(useAppStore.getState().showPreview).toBe(false);
    });

    it('keeps showPreview when forced to current value', () => {
      useAppStore.getState().togglePreview(true);

      expect(useAppStore.getState().showPreview).toBe(true);
    });
  });

  describe('persistence', () => {
    beforeEach(() => {
      localStorage.clear();
      useAppStore.setState(initialState);
    });

    it('persists whitelisted keys after mutation', () => {
      useAppStore.getState().setGamut('srgb');
      useAppStore.getState().setExportColorFormat('hex');
      useAppStore.getState().setColorSpacing('golden');
      useAppStore.getState().toggleSidebar();

      const persisted = readPersistedState();

      expect(persisted?.state.gamut).toBe('srgb');
      expect(persisted?.state.exportColorFormat).toBe('hex');
      expect(persisted?.state.colorSpacing).toBe('golden');
      expect(persisted?.state.showSidebar).toBe(false);
    });

    it('excludes transient keys from storage', () => {
      useAppStore.getState().openLoginModal();
      useAppStore.getState().requestPreviewScroll();
      useAppStore.getState().requestColorScroll('color-a');
      useAppStore.getState().toggleBottomBar();

      const persisted = readPersistedState();
      const keys = Object.keys(persisted?.state ?? {});

      expect(keys).not.toContain('showLoginModal');
      expect(keys).not.toContain('previewScrollNonce');
      expect(keys).not.toContain('colorScrollRequest');
      expect(keys).not.toContain('showBottomBar');
    });

    it('does not persist sessionPalettePath', () => {
      useAppStore.getState().setSessionPalettePath('/p/Primary-FF0000?id=palette-123');

      const persisted = readPersistedState();

      expect(persisted?.state).not.toHaveProperty('sessionPalettePath');
    });

    it('does not persist paletteName, paletteId, or lastSavedUrl', () => {
      useAppStore
        .getState()
        .setPalette('palette-123', 'My Palette', '/p/Primary-FF0000?id=palette-123');

      const persisted = readPersistedState();

      expect(persisted?.state).not.toHaveProperty('paletteName');
      expect(persisted?.state).not.toHaveProperty('paletteId');
      expect(persisted?.state).not.toHaveProperty('lastSavedUrl');
    });

    it('writes envelope with version 1 and only whitelisted keys', () => {
      useAppStore.getState().setGamut('srgb');

      const persisted = readPersistedState();

      expect(persisted?.version).toBe(1);
      expect(Object.keys(persisted?.state ?? {}).sort()).toEqual(PERSISTED_KEYS);
    });
  });
});
