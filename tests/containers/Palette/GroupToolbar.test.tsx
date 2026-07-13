import { initialState, useAppStore } from '~/stores/appStore';
import { BLUE, createColorEntry, CRIMSON, GRAY } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { fireEvent, render, screen, within } from '~/test-utils';
import { trackEvent } from '~/utils/analytics';

import GroupToolbar from '~/containers/Palette/GroupToolbar';

vi.mock('~/utils/analytics');

const BRAND = createColorEntry('Brand', CRIMSON, undefined, 'brand');
const NEUTRAL = createColorEntry('Neutral', GRAY, undefined, 'neutral');
const UNGROUPED = createColorEntry('Accent', BLUE);

function getToolbar() {
  return screen.getByRole('group', { name: 'Filter by color group' });
}

function setup(colors = [BRAND, NEUTRAL, UNGROUPED]) {
  getGeneratorStore().setState({ colors });

  return render(<GroupToolbar />);
}

describe('Palette/GroupToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState(initialState);
  });

  describe('Render', () => {
    it('renders correctly', () => {
      const { container } = setup();

      expect(container).toMatchSnapshot();
    });

    it('renders nothing when no color has a group', () => {
      setup([UNGROUPED]);

      expect(
        screen.queryByRole('group', { name: 'Filter by color group' }),
      ).not.toBeInTheDocument();
    });

    it('shows a chip only for groups actually used', () => {
      setup();

      const chips = within(getToolbar()).getAllByRole('button');

      expect(chips.map(chip => chip.textContent)).toEqual(['Brand', 'Neutral']);
    });

    // The chips are the only signal of what's filtered; without aria-pressed a screen
    // reader user can't tell an active filter from an inactive one.
    it('reports the active filter via aria-pressed', () => {
      useAppStore.setState({ groupFilter: ['brand'] });
      setup();

      expect(screen.getByRole('button', { name: 'Filter by Brand' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: 'Filter by Neutral' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('hides the clear button when no filter is active', () => {
      setup();

      expect(screen.queryByRole('button', { name: 'Clear group filters' })).not.toBeInTheDocument();
    });

    it('shows the clear button while a filter is active', () => {
      useAppStore.setState({ groupFilter: ['brand'] });
      setup();

      expect(screen.getByRole('button', { name: 'Clear group filters' })).toBeInTheDocument();
    });
  });

  describe('Behavior', () => {
    it('toggles a group filter on and off', () => {
      setup();

      fireEvent.click(screen.getByRole('button', { name: 'Filter by Brand' }));

      expect(useAppStore.getState().groupFilter).toEqual(['brand']);
      expect(trackEvent).toHaveBeenCalledWith('palette:group', { enabled: true, value: 'brand' });

      fireEvent.click(screen.getByRole('button', { name: 'Filter by Brand' }));

      expect(useAppStore.getState().groupFilter).toEqual([]);
      expect(trackEvent).toHaveBeenCalledWith('palette:group', { enabled: false, value: 'brand' });
    });

    it('accumulates multiple groups', () => {
      setup();

      fireEvent.click(screen.getByRole('button', { name: 'Filter by Brand' }));
      fireEvent.click(screen.getByRole('button', { name: 'Filter by Neutral' }));

      expect(useAppStore.getState().groupFilter).toEqual(['brand', 'neutral']);
    });

    it('clears every filter and tracks the event', () => {
      useAppStore.setState({ groupFilter: ['brand', 'neutral'] });
      setup();

      fireEvent.click(screen.getByRole('button', { name: 'Clear group filters' }));

      expect(useAppStore.getState().groupFilter).toEqual([]);
      expect(trackEvent).toHaveBeenCalledWith('palette:group_clear');
    });
  });
});
