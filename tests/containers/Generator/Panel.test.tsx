import { useAppStore } from '~/stores/appStore';
import { createTestPalette, CRIMSON } from '~/test-fixtures';
import { getPaletteStore } from '~/test-mocks';
import { fireEvent, render, screen, within } from '~/test-utils';
import { MAX_COLORS } from '~/utils/palette';

import Panel from '~/containers/Generator/Panel';

vi.mock('~/utils/color', async importOriginal => {
  const actual = await importOriginal<typeof import('~/utils/color')>();

  return {
    ...actual,
    getRandomColor: () => CRIMSON,
  };
});

const mockScrollToColor = vi.fn();

vi.mock('~/hooks/useScrollToColor', () => ({
  default: () => mockScrollToColor,
}));

describe('Panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPaletteStore().setState(createTestPalette(2));
    useAppStore.setState({ showBottomBar: false, showSidebar: true });
  });

  describe('Render', () => {
    it('renders correctly with panel closed', () => {
      render(<Panel />);

      expect(screen.getByTestId('GeneratorPanel')).toMatchSnapshot();
    });

    it('renders correctly with panel open', () => {
      useAppStore.setState({ showSidebar: true });
      render(<Panel />);

      expect(screen.getByTestId('GeneratorPanel')).toMatchSnapshot();
    });
  });

  describe('BottomBar', () => {
    beforeAll(() => {
      window.innerWidth = 375;
      window.innerHeight = 667;

      window.dispatchEvent(new Event('resize'));
    });

    it('toggles bottom bar open/closed on handle click', () => {
      render(<Panel />);

      const handle = screen.getByTestId('GeneratorPanel-Handle');

      fireEvent.click(handle);

      expect(useAppStore.getState().showBottomBar).toBe(true);

      fireEvent.click(handle);

      expect(useAppStore.getState().showBottomBar).toBe(false);
    });

    it('toggles bottom bar on Enter key', () => {
      render(<Panel />);

      fireEvent.keyDown(screen.getByTestId('GeneratorPanel-Handle'), { key: 'Enter' });

      expect(useAppStore.getState().showBottomBar).toBe(true);
    });

    it('toggles bottom bar on Space key', () => {
      render(<Panel />);

      fireEvent.keyDown(screen.getByTestId('GeneratorPanel-Handle'), { key: ' ' });

      expect(useAppStore.getState().showBottomBar).toBe(true);
    });

    it('displays a color box per color in the handle', () => {
      getPaletteStore().setState(createTestPalette(3));
      render(<Panel />);

      const handle = screen.getByTestId('GeneratorPanel-Handle');

      expect(within(handle).getAllByTestId('ColorBox')).toHaveLength(3);
    });

    it('toggle the bottom bar when clicking a color box', () => {
      getPaletteStore().setState(createTestPalette(3));
      render(<Panel />);

      const handle = screen.getByTestId('GeneratorPanel-Handle');

      fireEvent.click(within(handle).getAllByTestId('ColorBox')[0]);

      expect(mockScrollToColor).toHaveBeenCalledOnce();
    });
  });

  describe('Sidebar', () => {
    beforeAll(() => {
      window.innerWidth = 1024;
      window.innerHeight = 768;

      window.dispatchEvent(new Event('resize'));
    });

    it('toggles sidebar on Toggle Sidebar button click', () => {
      render(<Panel />);

      const toggle = screen.getByRole('button', { name: 'Toggle Sidebar' });

      fireEvent.click(toggle);

      expect(useAppStore.getState().showSidebar).toBe(false);

      fireEvent.click(toggle);

      expect(useAppStore.getState().showSidebar).toBe(true);
    });

    it('toggles Advanced Color Options', async () => {
      const spy = vi.spyOn(getPaletteStore().getState(), 'updateGlobalOptions');

      render(<Panel />);

      const toggle = screen.getByRole('button', { name: 'Advanced Options' });

      fireEvent.click(toggle);

      expect(spy).not.toHaveBeenCalledOnce();

      fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

      expect(spy).toHaveBeenCalledOnce();
    });

    it('Add Color button adds a new color', () => {
      render(<Panel />);

      const initialColors = getPaletteStore().getState().colors.length;

      fireEvent.click(screen.getByRole('button', { name: /add color/i }));

      expect(getPaletteStore().getState().colors).toHaveLength(initialColors + 1);
    });

    it('Add Color is disabled at MAX_COLORS', () => {
      getPaletteStore().setState(createTestPalette(MAX_COLORS));
      render(<Panel />);

      expect(screen.getByRole('button', { name: /add color/i })).toBeDisabled();
    });
  });
});
