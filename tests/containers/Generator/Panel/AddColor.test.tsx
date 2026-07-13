import { COLOR_SPACING, MAX_COLORS } from '~/config/globals';
import { useAppStore } from '~/stores/appStore';
import { createTestPalette, CRIMSON } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { fireEvent, render, screen } from '~/test-utils';
import { trackEvent } from '~/utils/analytics';
import { generateOklchColor } from '~/utils/color';

import PanelAddColor from '~/containers/Generator/Panel/AddColor';

vi.mock('~/utils/analytics', () => ({ trackEvent: vi.fn() }));

vi.mock('~/utils/color', async importOriginal => {
  const actual = await importOriginal<typeof import('~/utils/color')>();

  return {
    ...actual,
    getRandomColor: () => CRIMSON,
  };
});

describe('PanelAddColor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGeneratorStore().setState(createTestPalette(2));
    useAppStore.setState({ colorSpacing: 'tight' });
  });

  describe('Render', () => {
    it('renders correctly', () => {
      const { container } = render(<PanelAddColor />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('adds a color', () => {
      render(<PanelAddColor />);

      const initial = getGeneratorStore().getState().colors.length;

      fireEvent.click(screen.getByRole('button', { name: /add color/i }));

      expect(getGeneratorStore().getState().colors).toHaveLength(initial + 1);
    });

    // The new color is ungrouped, so an active filter would exclude it from the palette view.
    it('clears an active group filter without collapsing the preview', () => {
      useAppStore.setState({ groupFilter: ['brand'], showPreview: true });
      render(<PanelAddColor />);

      fireEvent.click(screen.getByRole('button', { name: /add color/i }));

      expect(useAppStore.getState().groupFilter).toEqual([]);
      expect(useAppStore.getState().showPreview).toBe(true);
    });

    it('rotates the last color by the selected spacing angle', () => {
      useAppStore.setState({ colorSpacing: 'wide' });
      render(<PanelAddColor />);

      const { colors } = getGeneratorStore().getState();
      const last = colors[colors.length - 1];
      const expected = generateOklchColor(last.value, COLOR_SPACING.wide.angle);

      fireEvent.click(screen.getByRole('button', { name: /add color/i }));

      const next = getGeneratorStore().getState().colors;

      expect(next[next.length - 1].value).toBe(expected);
    });

    it('uses a random color for the first color', () => {
      getGeneratorStore().setState(createTestPalette(0));
      render(<PanelAddColor />);

      fireEvent.click(screen.getByRole('button', { name: /add color/i }));

      const { colors } = getGeneratorStore().getState();

      expect(colors[0].value).toBe(CRIMSON);
    });

    it('updates the spacing and tracks the change on selection', async () => {
      render(<PanelAddColor />);

      fireEvent.click(screen.getByRole('button', { name: /^Color Spacing/ }));
      fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Wide' }));

      expect(useAppStore.getState().colorSpacing).toBe('wide');
      expect(trackEvent).toHaveBeenCalledWith('palette:color_spacing', { value: 'wide' });
    });

    it('reflects the current spacing on the trigger', () => {
      useAppStore.setState({ colorSpacing: 'golden' });
      render(<PanelAddColor />);

      expect(screen.getByRole('button', { name: /Golden - 137\.5°/ })).toBeInTheDocument();
    });

    it('exposes an accessible name combining the label and value', () => {
      render(<PanelAddColor />);

      // aria-labelledby wires the "Color Spacing" span + the trigger's own value.
      expect(screen.getByRole('button', { name: 'Color Spacing Tight - 30°' })).toBeInTheDocument();
    });

    it('disables Add Color and the spacing trigger at MAX_COLORS', () => {
      getGeneratorStore().setState(createTestPalette(MAX_COLORS));
      render(<PanelAddColor />);

      expect(screen.getByRole('button', { name: /add color/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /^Color Spacing/ })).toBeDisabled();
    });
  });
});
