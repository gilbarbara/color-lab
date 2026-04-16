import { fireEvent, render, screen } from '~/test-utils';

import NumericInput from '~/components/ChannelSliders/NumericInput';

const mockOnChange = vi.fn();

function createDefaultProps(overrides: Partial<Parameters<typeof NumericInput>[0]> = {}) {
  return {
    max: 360,
    min: 0,
    onChange: mockOnChange,
    value: '180',
    ...overrides,
  };
}

describe('NumericInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders value and suffix', () => {
      const { container } = render(<NumericInput {...createDefaultProps({ suffix: '°' })} />);

      expect(container).toMatchSnapshot();
    });

    it('renders invisible spacer suffix', () => {
      const { container } = render(<NumericInput {...createDefaultProps({ suffix: ' ' })} />);

      expect(container).toMatchSnapshot();
    });

    it('renders without suffix', () => {
      const { container } = render(<NumericInput {...createDefaultProps()} />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('displays the value', () => {
      render(<NumericInput {...createDefaultProps()} />);

      expect(screen.getByDisplayValue('180')).toBeInTheDocument();
    });

    it('filters non-numeric characters', () => {
      render(<NumericInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'abc' } });

      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    it('allows decimal point', () => {
      render(<NumericInput {...createDefaultProps({ value: '0.5' })} />);

      const input = screen.getByDisplayValue('0.5');

      fireEvent.change(input, { target: { value: '0.75' } });

      expect(mockOnChange).toHaveBeenCalledWith(0.75);
    });

    it('replaces comma with period', () => {
      render(<NumericInput {...createDefaultProps({ value: '0.5' })} />);

      const input = screen.getByDisplayValue('0.5');

      fireEvent.change(input, { target: { value: '0,75' } });

      expect(mockOnChange).toHaveBeenCalledWith(0.75);
    });

    it('skips commit when value ends with period', () => {
      render(<NumericInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '1.' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('clamps value to max', () => {
      render(<NumericInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '782' } });

      expect(mockOnChange).toHaveBeenCalledWith(360);
    });

    it('clamps value to min', () => {
      render(<NumericInput {...createDefaultProps({ min: 10 })} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '5' } });

      expect(mockOnChange).toHaveBeenCalledWith(10);
    });

    it('increments on ArrowUp', () => {
      render(<NumericInput {...createDefaultProps({ step: 1 })} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(mockOnChange).toHaveBeenCalledWith(181);
    });

    it('decrements on ArrowDown', () => {
      render(<NumericInput {...createDefaultProps({ step: 1 })} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(mockOnChange).toHaveBeenCalledWith(179);
    });

    it('increments by 10 on Shift+ArrowUp', () => {
      render(<NumericInput {...createDefaultProps({ step: 1 })} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true });

      expect(mockOnChange).toHaveBeenCalledWith(190);
    });

    it('clamps ArrowUp at max', () => {
      render(<NumericInput {...createDefaultProps({ value: '359' })} />);

      const input = screen.getByDisplayValue('359');

      fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true });

      expect(mockOnChange).toHaveBeenCalledWith(360);
    });

    it('reverts to prop value on blur with invalid input', () => {
      render(<NumericInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(screen.getByDisplayValue('180')).toBeInTheDocument();
    });

    it('commits clamped value on blur', () => {
      render(<NumericInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '500' } });
      fireEvent.blur(input);

      expect(mockOnChange).toHaveBeenCalledWith(360);
    });
  });
});
