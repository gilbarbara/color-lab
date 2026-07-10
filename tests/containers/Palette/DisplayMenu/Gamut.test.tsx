import { useAppStore } from '~/stores/appStore';
import { fireEvent, render, screen } from '~/test-utils';

import Gamut from '~/containers/Palette/DisplayMenu/Gamut';

describe('Gamut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ gamut: 'p3' });
  });

  describe('Render', () => {
    it('renders default state', () => {
      const { container } = render(<Gamut />);

      expect(container).toMatchSnapshot();
    });

    it('renders the selected SRGB', () => {
      useAppStore.setState({ gamut: 'srgb' });
      render(<Gamut />);

      expect(screen.getByRole('radio', { name: 'SRGB' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'P3' })).not.toBeChecked();
    });
  });

  describe('Behavior', () => {
    it('switches gamut to SRGB', () => {
      render(<Gamut />);

      fireEvent.click(screen.getByRole('radio', { name: 'SRGB' }));
      expect(useAppStore.getState().gamut).toBe('srgb');
    });
  });
});
