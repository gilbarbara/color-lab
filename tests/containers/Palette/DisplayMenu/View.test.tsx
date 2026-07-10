import { useAppStore } from '~/stores/appStore';
import { fireEvent, render, screen } from '~/test-utils';

import View from '~/containers/Palette/DisplayMenu/View';

describe('View', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ view: 'list', showPreview: true });
  });

  describe('Render', () => {
    it('renders default state', () => {
      const { container } = render(<View />);

      expect(container).toMatchSnapshot();
    });

    it('reflects the selected view', () => {
      useAppStore.setState({ view: 'grid' });
      render(<View />);

      expect(screen.getByRole('radio', { name: 'Grid' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'List' })).not.toBeChecked();
    });
  });

  describe('Behavior', () => {
    it('switches view via click', () => {
      render(<View />);

      fireEvent.click(screen.getByRole('radio', { name: 'Grid' }));
      expect(useAppStore.getState().view).toBe('grid');

      fireEvent.click(screen.getByRole('radio', { name: 'Preview' }));
      expect(useAppStore.getState().view).toBe('preview');
    });

    it('forces the preview open when switching view', () => {
      useAppStore.setState({ showPreview: false });
      render(<View />);

      fireEvent.click(screen.getByRole('radio', { name: 'Grid' }));

      expect(useAppStore.getState().showPreview).toBe(true);
    });
  });
});
