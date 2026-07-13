import { createColorEntry, CRIMSON } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { fireEvent, render, screen } from '~/test-utils';
import { trackEvent } from '~/utils/analytics';

import ColorGroupMenu from '~/containers/ColorGroupMenu';

vi.mock('~/utils/analytics');

const PRIMARY = createColorEntry('Primary', CRIMSON);
const BRANDED = createColorEntry('Primary', CRIMSON, undefined, 'brand');

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: /color group/i }));
}

function setup(colorEntry = PRIMARY) {
  getGeneratorStore().setState({ colors: [colorEntry] });

  return render(<ColorGroupMenu colorEntry={colorEntry} source="color" />);
}

describe('ColorGroupMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders correctly', () => {
      const { container } = setup();

      expect(container).toMatchSnapshot();
    });

    // The trigger repeats per color, so the name must say which color it acts on.
    it('names the trigger with the color', () => {
      setup();

      expect(screen.getByRole('button')).toHaveAccessibleName('Color group for Primary');
    });

    it('appends the assigned group to the name', () => {
      setup(BRANDED);

      expect(screen.getByRole('button')).toHaveAccessibleName('Color group for Primary: Brand');
    });
  });

  describe('Behavior', () => {
    it('assigns a group and tracks the event', () => {
      setup();
      openMenu();

      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Brand' }));

      expect(getGeneratorStore().getState().colors[0].group).toBe('brand');
      expect(trackEvent).toHaveBeenCalledWith('color:group', { value: 'brand' });
    });

    it('offers None only once a group is assigned', () => {
      setup();
      openMenu();

      expect(screen.queryByRole('menuitemradio', { name: 'None' })).not.toBeInTheDocument();
    });

    it('unassigns via None and tracks the event', () => {
      setup(BRANDED);
      openMenu();

      fireEvent.click(screen.getByRole('menuitemradio', { name: 'None' }));

      expect(getGeneratorStore().getState().colors[0].group).toBeUndefined();
      expect(trackEvent).toHaveBeenCalledWith('color:group', { value: 'none' });
    });

    it('unassigns when the current group is picked again', () => {
      setup(BRANDED);
      openMenu();

      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Brand' }));

      expect(getGeneratorStore().getState().colors[0].group).toBeUndefined();
      expect(trackEvent).toHaveBeenCalledWith('color:group', { value: 'none' });
    });
  });
});
