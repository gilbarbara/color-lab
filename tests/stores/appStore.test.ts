import { useAppStore } from '~/stores/appStore';

describe('stores/appStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      exportColorFormat: 'oklch',
      exportFormatType: 'tailwind4',
      showBottomBar: false,
    });
  });

  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useAppStore.getState();

      expect(state.exportColorFormat).toBe('oklch');
      expect(state.exportFormatType).toBe('tailwind4');
      expect(state.showBottomBar).toBe(false);
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
});
