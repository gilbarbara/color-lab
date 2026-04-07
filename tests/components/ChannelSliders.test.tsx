import { fireEvent, render, screen } from '~/test-utils';

import ChannelSliders from '~/components/ChannelSliders';

const mockOnChangeColor = vi.fn();
const originalRAF = globalThis.requestAnimationFrame;

beforeAll(() => {
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
    callback(0);

    return 0;
  };
});

afterAll(() => {
  globalThis.requestAnimationFrame = originalRAF;
});

const TEST_OKLCH = 'oklch(0.62 0.16 241)';

function createDefaultProps(overrides: Partial<Parameters<typeof ChannelSliders>[0]> = {}) {
  return {
    color: TEST_OKLCH,
    mode: 'hsl' as const,
    onChangeColor: mockOnChangeColor,
    ...overrides,
  };
}

describe('ChannelSliders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HSL mode', () => {
    it('renders H, S, L sliders', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'hsl' })} />);

      expect(screen.getByRole('slider', { name: /hue/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /saturation/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /lightness/i })).toBeInTheDocument();
    });

    it('disables saturation slider when disableSaturation is true', () => {
      render(<ChannelSliders {...createDefaultProps({ disableSaturation: true, mode: 'hsl' })} />);

      expect(screen.getByRole('slider', { name: /saturation/i })).toBeDisabled();
    });

    it('slider change calls onChangeColor with OKLCH value', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'hsl' })} />);

      const hueSlider = screen.getByRole('slider', { name: /hue/i });

      fireEvent.change(hueSlider, { target: { value: '180' } });

      expect(mockOnChangeColor).toHaveBeenCalled();

      const call = mockOnChangeColor.mock.calls[0][0];

      expect(call).toMatch(/^oklch\(/);
    });
  });

  describe('RGB mode', () => {
    it('renders R, G, B sliders', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'rgb' })} />);

      expect(screen.getByRole('slider', { name: /red/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /green/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /blue/i })).toBeInTheDocument();
    });

    it('does not have disabled sliders regardless of disableSaturation', () => {
      render(<ChannelSliders {...createDefaultProps({ disableSaturation: true, mode: 'rgb' })} />);

      expect(screen.getByRole('slider', { name: /red/i })).not.toBeDisabled();
      expect(screen.getByRole('slider', { name: /green/i })).not.toBeDisabled();
      expect(screen.getByRole('slider', { name: /blue/i })).not.toBeDisabled();
    });

    it('slider change calls onChangeColor with OKLCH value', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'rgb' })} />);

      const redSlider = screen.getByRole('slider', { name: /red/i });

      fireEvent.change(redSlider, { target: { value: '200' } });

      expect(mockOnChangeColor).toHaveBeenCalled();

      const call = mockOnChangeColor.mock.calls[0][0];

      expect(call).toMatch(/^oklch\(/);
    });
  });

  describe('OKLCH mode', () => {
    it('renders L, C, H sliders', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'oklch' })} />);

      expect(screen.getByRole('slider', { name: /lightness/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /chroma/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /hue/i })).toBeInTheDocument();
    });

    it('disables chroma slider when disableSaturation is true', () => {
      render(
        <ChannelSliders {...createDefaultProps({ disableSaturation: true, mode: 'oklch' })} />,
      );

      expect(screen.getByRole('slider', { name: /chroma/i })).toBeDisabled();
    });

    it('slider change calls onChangeColor with OKLCH value', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'oklch' })} />);

      const hueSlider = screen.getByRole('slider', { name: /hue/i });

      fireEvent.change(hueSlider, { target: { value: '120' } });

      expect(mockOnChangeColor).toHaveBeenCalled();

      const call = mockOnChangeColor.mock.calls[0][0];

      expect(call).toMatch(/^oklch\(/);
    });
  });
});
