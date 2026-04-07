import { fireEvent, render, screen } from '~/test-utils';

import SliderInput from '~/components/SliderInput';

const mockOnChange = vi.fn();

function createDefaultProps(overrides: Partial<Parameters<typeof SliderInput>[0]> = {}) {
  return {
    max: 360,
    min: 0,
    onChange: mockOnChange,
    value: '180',
    ...overrides,
  };
}

describe('SliderInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders value and suffix', () => {
      const { container } = render(<SliderInput {...createDefaultProps({ suffix: '°' })} />);

      expect(container).toMatchSnapshot();
    });

    it('renders invisible spacer suffix', () => {
      const { container } = render(<SliderInput {...createDefaultProps({ suffix: ' ' })} />);

      expect(container).toMatchSnapshot();
    });

    it('renders without suffix', () => {
      const { container } = render(<SliderInput {...createDefaultProps()} />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('displays the value', () => {
      render(<SliderInput {...createDefaultProps()} />);

      expect(screen.getByDisplayValue('180')).toBeInTheDocument();
    });

    it('filters non-numeric characters', () => {
      render(<SliderInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: 'abc' } });

      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    it('allows decimal point', () => {
      render(<SliderInput {...createDefaultProps({ value: '0.5' })} />);

      const input = screen.getByDisplayValue('0.5');

      fireEvent.change(input, { target: { value: '0.75' } });

      expect(mockOnChange).toHaveBeenCalledWith(0.75);
    });

    it('replaces comma with period', () => {
      render(<SliderInput {...createDefaultProps({ value: '0.5' })} />);

      const input = screen.getByDisplayValue('0.5');

      fireEvent.change(input, { target: { value: '0,75' } });

      expect(mockOnChange).toHaveBeenCalledWith(0.75);
    });

    it('skips commit when value ends with period', () => {
      render(<SliderInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '1.' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('clamps value to max', () => {
      render(<SliderInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '782' } });

      expect(mockOnChange).toHaveBeenCalledWith(360);
    });

    it('clamps value to min', () => {
      render(<SliderInput {...createDefaultProps({ min: 10 })} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '5' } });

      expect(mockOnChange).toHaveBeenCalledWith(10);
    });

    it('increments on ArrowUp', () => {
      render(<SliderInput {...createDefaultProps({ step: 1 })} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(mockOnChange).toHaveBeenCalledWith(181);
    });

    it('decrements on ArrowDown', () => {
      render(<SliderInput {...createDefaultProps({ step: 1 })} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(mockOnChange).toHaveBeenCalledWith(179);
    });

    it('increments by 10 on Shift+ArrowUp', () => {
      render(<SliderInput {...createDefaultProps({ step: 1 })} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true });

      expect(mockOnChange).toHaveBeenCalledWith(190);
    });

    it('clamps ArrowUp at max', () => {
      render(<SliderInput {...createDefaultProps({ value: '359' })} />);

      const input = screen.getByDisplayValue('359');

      fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true });

      expect(mockOnChange).toHaveBeenCalledWith(360);
    });

    it('reverts to prop value on blur with invalid input', () => {
      render(<SliderInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(screen.getByDisplayValue('180')).toBeInTheDocument();
    });

    it('commits clamped value on blur', () => {
      render(<SliderInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '500' } });
      fireEvent.blur(input);

      expect(mockOnChange).toHaveBeenCalledWith(360);
    });
  });
});
