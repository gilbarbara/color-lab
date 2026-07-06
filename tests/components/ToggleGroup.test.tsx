import { fireEvent, render, screen } from '~/test-utils';

import ToggleGroup from '~/components/ToggleGroup';

type TestValue = 'one' | 'two' | 'three';

const ITEMS: Array<{ label: string; value: TestValue }> = [
  { label: 'One', value: 'one' },
  { label: 'Two', value: 'two' },
  { label: 'Three', value: 'three' },
];

function setup(value: TestValue = 'one') {
  const onChange = vi.fn();

  render(<ToggleGroup items={ITEMS} label="Test" onChange={onChange} value={value} />);

  return { group: screen.getByRole('radiogroup', { name: 'Test' }), onChange };
}

describe('ToggleGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders default state', () => {
      const { container } = render(
        <ToggleGroup items={ITEMS} label="Test" onChange={vi.fn()} value="one" />,
      );

      expect(container).toMatchSnapshot();
    });

    it('marks the selected item as checked', () => {
      setup('two');

      expect(screen.getByRole('radio', { name: 'Two' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'One' })).not.toBeChecked();
    });

    it('renders the info node when provided', () => {
      render(
        <ToggleGroup
          info={<span>info-slot</span>}
          items={ITEMS}
          label="Test"
          onChange={vi.fn()}
          value="one"
        />,
      );

      expect(screen.getByText('info-slot')).toBeInTheDocument();
    });
  });

  describe('Behavior', () => {
    it('calls onChange with the clicked value', () => {
      const { onChange } = setup();

      fireEvent.click(screen.getByRole('radio', { name: 'Two' }));
      expect(onChange).toHaveBeenCalledWith('two');

      fireEvent.click(screen.getByRole('radio', { name: 'Three' }));
      expect(onChange).toHaveBeenCalledWith('three');
    });

    it('moves selection with arrow keys (roving focus)', () => {
      const { group, onChange } = setup();

      fireEvent.keyDown(group, { key: 'ArrowRight' });
      expect(onChange).toHaveBeenCalledWith('two');

      fireEvent.keyDown(group, { key: 'ArrowDown' });
      expect(onChange).toHaveBeenCalledWith('two');
    });

    it('wraps selection at the ends', () => {
      const { group, onChange } = setup('one');

      fireEvent.keyDown(group, { key: 'ArrowLeft' });
      expect(onChange).toHaveBeenCalledWith('three');

      onChange.mockClear();
      fireEvent.keyDown(group, { key: 'ArrowUp' });
      expect(onChange).toHaveBeenCalledWith('three');
    });

    it('jumps to ends with Home and End', () => {
      const { group, onChange } = setup('two');

      fireEvent.keyDown(group, { key: 'End' });
      expect(onChange).toHaveBeenCalledWith('three');

      fireEvent.keyDown(group, { key: 'Home' });
      expect(onChange).toHaveBeenCalledWith('one');
    });

    it('ignores other keys', () => {
      const { group, onChange } = setup();

      fireEvent.keyDown(group, { key: 'Enter' });
      fireEvent.keyDown(group, { key: 'a' });

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
