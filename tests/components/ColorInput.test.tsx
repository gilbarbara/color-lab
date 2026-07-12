import userEvent from '@testing-library/user-event';

import { CRIMSON } from '~/test-fixtures';
import { fireEvent, render, screen } from '~/test-utils';

import ColorInput from '~/components/ColorInput';

const onChange = vi.fn();

function getInput() {
  return screen.getByLabelText('Color value for Primary');
}

function setup(props: Partial<Parameters<typeof ColorInput>[0]> = {}) {
  return render(
    <ColorInput color={CRIMSON} mode="oklch" name="Primary" onChange={onChange} {...props} />,
  );
}

describe('ColorInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders correctly', () => {
      const { container } = setup();

      expect(container).toMatchSnapshot();
    });

    it('shows 3-decimal chroma in OKLCH mode', () => {
      setup();

      expect(getInput()).toHaveValue(CRIMSON);
    });

    it('shows hex in HSL mode', () => {
      setup({ mode: 'hsl' });

      expect(getInput()).toHaveValue('#ff0044');
    });

    it('shows hex in RGB mode', () => {
      setup({ mode: 'rgb' });

      expect(getInput()).toHaveValue('#ff0044');
    });

    it('display follows mode prop when not editing', () => {
      const { rerender } = setup();

      expect(getInput()).toHaveValue(CRIMSON);

      rerender(<ColorInput color={CRIMSON} mode="hsl" name="Primary" onChange={vi.fn()} />);

      expect(getInput()).toHaveValue('#ff0044');
    });
  });

  describe('Behavior', () => {
    it('emits prefixed hex for bare hex', () => {
      setup();

      fireEvent.change(getInput(), { target: { value: 'ff0044' } });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('#ff0044');
    });

    it('emits prefixed hex unchanged', () => {
      setup();

      fireEvent.change(getInput(), { target: { value: '#ff0044' } });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('#ff0044');
    });

    it('emits raw OKLCH paste', () => {
      setup();

      fireEvent.change(getInput(), {
        target: { value: 'oklch(0.7 0.15 180)' },
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('oklch(0.7 0.15 180)');
    });

    it('does not emit for garbage input', () => {
      setup();

      fireEvent.change(getInput(), { target: { value: 'not-a-color' } });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not emit for 4-char hex (alpha channel)', () => {
      setup();

      fireEvent.change(getInput(), { target: { value: '#ff00' } });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not emit for 8-char hex (alpha channel)', () => {
      setup();

      fireEvent.change(getInput(), {
        target: { value: '#ff004400' },
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not emit for out-of-range OKLCH (L > 100%)', () => {
      setup();

      fireEvent.change(getInput(), {
        target: { value: 'oklch(164.9% 0.24196 300.54)' },
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('shows raw input while editing, formatted value after blur', async () => {
      // eslint-disable-next-line testing-library/render-result-naming-convention
      const user = userEvent.setup();

      setup();

      const input = getInput();

      await user.click(input);
      fireEvent.change(input, { target: { value: '#ff0044' } });

      expect(input).toHaveValue('#ff0044');

      await user.tab();

      expect(input).toHaveValue(CRIMSON);
    });
  });
});
