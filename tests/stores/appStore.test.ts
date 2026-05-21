import { DEFAULT_PALETTE_NAME } from '~/config/globals';
import { initialState, useAppStore } from '~/stores/appStore';

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

  describe('clearLoadedPalette', () => {
    it('clears all loaded palette fields', () => {
      useAppStore.getState().setLoadedPalette('palette-123', 'My Palette', '/p/Primary-FF0000');
      useAppStore.getState().clearLoadedPalette();

      const state = useAppStore.getState();

      expect(state.loadedPaletteId).toBe(null);
      expect(state.loadedPaletteName).toBe(DEFAULT_PALETTE_NAME);
      expect(state.lastSavedUrl).toBe(null);
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

  describe('setLoadedPalette', () => {
    it('sets all loaded palette fields', () => {
      useAppStore.getState().setLoadedPalette('palette-123', 'My Palette', '/p/Primary-FF0000');

      const state = useAppStore.getState();

      expect(state.loadedPaletteId).toBe('palette-123');
      expect(state.loadedPaletteName).toBe('My Palette');
      expect(state.lastSavedUrl).toBe('/p/Primary-FF0000');
    });

    it('can set fields to null', () => {
      useAppStore.getState().setLoadedPalette('id', 'name', 'url');
      useAppStore.getState().setLoadedPalette(null, null, null);

      const state = useAppStore.getState();

      expect(state.loadedPaletteId).toBe(null);
      expect(state.loadedPaletteName).toBe(DEFAULT_PALETTE_NAME);
      expect(state.lastSavedUrl).toBe(null);
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
});
