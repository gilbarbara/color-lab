import { useAppStore } from '~/stores/appStore';
import { createTestPalette, CRIMSON } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { act, fireEvent, render, screen, within } from '~/test-utils';
import { MAX_COLORS } from '~/utils/generator';

import Panel from '~/containers/Generator/Panel';

const mockScrollToSelector = vi.fn();

vi.mock('~/utils/scroll', () => ({
  scrollToSelector: (...arguments_: unknown[]) => mockScrollToSelector(...arguments_),
}));

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
    getGeneratorStore().setState(createTestPalette(2));
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
      getGeneratorStore().setState(createTestPalette(3));
      render(<Panel />);

      const handle = screen.getByTestId('GeneratorPanel-Handle');

      expect(within(handle).getAllByTestId('ColorBox')).toHaveLength(3);
    });

    it('toggle the bottom bar when clicking a color box', () => {
      getGeneratorStore().setState(createTestPalette(3));
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
      const spy = vi.spyOn(getGeneratorStore().getState(), 'resetAdvancedOptions');

      render(<Panel />);

      const toggle = screen.getByRole('button', { name: 'Advanced Options' });

      fireEvent.click(toggle);

      expect(spy).not.toHaveBeenCalledOnce();

      // Reset is disabled until the curves differ from defaults.
      act(() => {
        getGeneratorStore().getState().updateGlobalOptions({ lightnessCurve: 2 });
      });

      fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

      expect(spy).toHaveBeenCalledOnce();
    });

    it('Add Color button adds a new color', () => {
      render(<Panel />);

      const initialColors = getGeneratorStore().getState().colors.length;

      fireEvent.click(screen.getByRole('button', { name: /add color/i }));

      expect(getGeneratorStore().getState().colors).toHaveLength(initialColors + 1);
    });

    it('Add Color is disabled at MAX_COLORS', () => {
      getGeneratorStore().setState(createTestPalette(MAX_COLORS));
      render(<Panel />);

      expect(screen.getByRole('button', { name: /add color/i })).toBeDisabled();
    });
  });

  describe('ColorScroll', () => {
    beforeEach(() => {
      // Run the scroll effect's rAF synchronously so a regression (replaying the
      // request on the settle re-run) would surface as an extra scrollToSelector call.
      vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        callback(0);

        return 0;
      });
      vi.stubGlobal('cancelAnimationFrame', () => {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      // This describe-local afterEach runs before RTL's auto-cleanup afterEach, so the
      // test's Panel is still mounted and subscribed to appStore. Wrap the reset in act()
      // so the resulting re-render isn't flagged as an update outside act().
      act(() => {
        useAppStore.setState({ collapseAnimationCount: 0, colorScrollRequest: null });
      });
    });

    it('services a pending scroll request once and ignores later collapse cycles', () => {
      const [first] = getGeneratorStore().getState().colors;

      useAppStore.setState({
        collapseAnimationCount: 0,
        colorScrollRequest: { id: first.id, nonce: 1 },
      });

      render(<Panel />);

      expect(mockScrollToSelector).toHaveBeenCalledTimes(1);

      // A ColorItem activation cycles collapseAnimationCount (Collapse open/close).
      // The already-serviced request must not scroll again.
      act(() => {
        useAppStore.getState().incrementCollapseAnimation();
      });
      act(() => {
        useAppStore.getState().decrementCollapseAnimation();
      });

      expect(mockScrollToSelector).toHaveBeenCalledTimes(1);
    });
  });
});
