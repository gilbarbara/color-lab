import { fireEvent, render, screen, waitFor } from '~/test-utils';

import SRGB from '~/pages/Generator/ColorList/SRGB';

const mockOnChangeColor = vi.fn();
const mockOnChangeHex = vi.fn();
const mockChromeOnChange = vi.fn();

vi.mock('@uiw/react-color-chrome', () => ({
  default: (props: { onChange?: (color: { hex: string }) => void }) => {
    mockChromeOnChange.mockImplementation(() => props.onChange?.({ hex: '#00AABB' }));

    return <div data-uid="chrome-picker" />;
  },
  ChromeInputType: { HEXA: 'hexa' },
}));

vi.mock('~/utils/color', async importOriginal => {
  const actual = await importOriginal<typeof import('~/utils/color')>();

  return {
    ...actual,
    getRandomColor: () => '#FF8800',
  };
});

const TEST_HEX = '#FF0044';

function createDefaultProps(overrides: Partial<Parameters<typeof SRGB>[0]> = {}) {
  return {
    baseSaturation: 80,
    disableSaturation: false,
    hex: TEST_HEX,
    onChangeColor: mockOnChangeColor,
    onChangeHex: mockOnChangeHex,
    ...overrides,
  };
}

describe('SRGB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders correctly', () => {
      const { container } = render(<SRGB {...createDefaultProps()} />);

      expect(container).toMatchSnapshot();
    });

    it('renders with disabled saturation', () => {
      const { container } = render(<SRGB {...createDefaultProps({ disableSaturation: true })} />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('displays hex value in input', () => {
      render(<SRGB {...createDefaultProps()} />);

      expect(screen.getByDisplayValue(TEST_HEX)).toBeInTheDocument();
    });

    it('has hue slider', () => {
      render(<SRGB {...createDefaultProps()} />);

      const hueSlider = screen.getByRole('slider', { name: /hue/i });

      expect(hueSlider).toBeInTheDocument();
    });

    it('has saturation slider', () => {
      render(<SRGB {...createDefaultProps()} />);

      const saturationSlider = screen.getByRole('slider', { name: /saturation/i });

      expect(saturationSlider).toBeInTheDocument();
    });

    it('has lightness slider', () => {
      render(<SRGB {...createDefaultProps()} />);

      const lightnessSlider = screen.getByRole('slider', { name: /lightness/i });

      expect(lightnessSlider).toBeInTheDocument();
    });

    it('saturation slider is present when disabled', () => {
      render(<SRGB {...createDefaultProps({ disableSaturation: true })} />);

      const saturationSlider = screen.getByRole('slider', { name: /saturation/i });

      // Slider should still be in DOM when disabled (disabled state verified via snapshot)
      expect(saturationSlider).toBeInTheDocument();
    });

    it('hex input updates color', async () => {
      render(<SRGB {...createDefaultProps()} />);

      const hexInput = screen.getByDisplayValue(TEST_HEX);

      fireEvent.change(hexInput, { target: { value: '#00FF00' } });

      await waitFor(() => {
        expect(mockOnChangeHex).toHaveBeenCalledWith('#00FF00');
        expect(mockOnChangeColor).toHaveBeenCalledWith('#00FF00');
      });
    });

    it('randomize button generates new color', () => {
      render(<SRGB {...createDefaultProps()} />);

      // Find the randomize button (has ArrowsClockwiseIcon)
      const buttons = screen.getAllByRole('button');
      const randomizeButton = buttons.find(button => button.querySelector('svg'));

      expect(randomizeButton).toBeDefined();
      fireEvent.click(randomizeButton!);

      expect(mockOnChangeHex).toHaveBeenCalledWith('#FF8800');
      expect(mockOnChangeColor).toHaveBeenCalledWith('#FF8800');
    });

    it('hue slider change calls callbacks', () => {
      render(<SRGB {...createDefaultProps()} />);

      const hueSlider = screen.getByRole('slider', { name: /hue/i });

      fireEvent.change(hueSlider, { target: { value: '180' } });

      expect(mockOnChangeHex).toHaveBeenCalled();
      expect(mockOnChangeColor).toHaveBeenCalled();
    });

    it('saturation slider change calls callbacks', () => {
      render(<SRGB {...createDefaultProps()} />);

      const saturationSlider = screen.getByRole('slider', { name: /saturation/i });

      fireEvent.change(saturationSlider, { target: { value: '50' } });

      expect(mockOnChangeHex).toHaveBeenCalled();
      expect(mockOnChangeColor).toHaveBeenCalled();
    });

    it('lightness slider change calls callbacks', () => {
      render(<SRGB {...createDefaultProps()} />);

      const lightnessSlider = screen.getByRole('slider', { name: /lightness/i });

      fireEvent.change(lightnessSlider, { target: { value: '70' } });

      expect(mockOnChangeHex).toHaveBeenCalled();
      expect(mockOnChangeColor).toHaveBeenCalled();
    });

    it('color picker button is present', () => {
      render(<SRGB {...createDefaultProps()} />);

      expect(screen.getByRole('button', { name: /color picker/i })).toBeInTheDocument();
    });

    it('color picker onChange calls callbacks', async () => {
      render(<SRGB {...createDefaultProps()} />);

      const pickerButton = screen.getByRole('button', { name: /color picker/i });

      fireEvent.click(pickerButton);

      await waitFor(() => {
        expect(screen.getByTestId('chrome-picker')).toBeInTheDocument();
      });

      mockChromeOnChange();

      await waitFor(() => {
        expect(mockOnChangeHex).toHaveBeenCalledWith('#00AABB');
        expect(mockOnChangeColor).toHaveBeenCalledWith('#00AABB');
      });
    });
  });
});
