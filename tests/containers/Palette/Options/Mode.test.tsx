import { fireEvent, render, screen } from '~/test-utils';

import Mode from '~/containers/Palette/Options/Mode';

const mockOnChange = vi.fn();

describe('Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders default state', () => {
      const { container } = render(<Mode mode="light" onChange={mockOnChange} />);

      expect(container).toMatchSnapshot();
    });

    it('reflects the selected mode', () => {
      render(<Mode mode="dark" onChange={mockOnChange} />);

      expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'Light' })).not.toBeChecked();
    });
  });

  describe('Behavior', () => {
    it('calls onChange with the selected mode via click', () => {
      render(<Mode mode="light" onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));
      expect(mockOnChange).toHaveBeenCalledWith('dark');

      fireEvent.click(screen.getByRole('radio', { name: 'Reversed' }));
      expect(mockOnChange).toHaveBeenCalledWith('reversed');
    });
  });
});
