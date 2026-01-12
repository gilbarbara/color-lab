import { fireEvent, render, screen } from '~/test-utils';

import OKLCH from '~/pages/Generator/ColorList/OKLCH';

const mockOnChangeColor = vi.fn();

vi.mock('~/utils/color', async importOriginal => {
  const actual = await importOriginal<typeof import('~/utils/color')>();

  return {
    ...actual,
    getRandomColor: () => 'oklch(0.65 0.15 180)',
  };
});

const TEST_OKLCH = { l: 0.7, c: 0.2, h: 120 };

function createDefaultProps(overrides: Partial<Parameters<typeof OKLCH>[0]> = {}) {
  return {
    baseSaturation: 80,
    disableChroma: false,
    oklch: TEST_OKLCH,
    onChangeColor: mockOnChangeColor,
    value: 'oklch(0.7 0.2 120)',
    ...overrides,
  };
}

describe('OKLCH', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders correctly', () => {
      const { container } = render(<OKLCH {...createDefaultProps()} />);

      expect(container).toMatchSnapshot();
    });

    it('renders with disabled chroma', () => {
      const { container } = render(<OKLCH {...createDefaultProps({ disableChroma: true })} />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('displays L, C, H values', () => {
      render(<OKLCH {...createDefaultProps()} />);

      // Lightness is displayed as percentage
      expect(screen.getByDisplayValue('70')).toBeInTheDocument();
      // Chroma
      expect(screen.getByDisplayValue('0.20')).toBeInTheDocument();
      // Hue - check within the OKLCH component
      const hueInput = screen.getAllByDisplayValue('120')[0];

      expect(hueInput).toBeInTheDocument();
    });

    it('has lightness slider', () => {
      render(<OKLCH {...createDefaultProps()} />);

      const lightnessSlider = screen.getByRole('slider', { name: /lightness/i });

      expect(lightnessSlider).toBeInTheDocument();
    });

    it('has chroma slider', () => {
      render(<OKLCH {...createDefaultProps()} />);

      const chromaSlider = screen.getByRole('slider', { name: /chroma/i });

      expect(chromaSlider).toBeInTheDocument();
    });

    it('has hue slider', () => {
      render(<OKLCH {...createDefaultProps()} />);

      const hueSlider = screen.getByRole('slider', { name: /hue/i });

      expect(hueSlider).toBeInTheDocument();
    });

    it('chroma slider is present when disabled', () => {
      render(<OKLCH {...createDefaultProps({ disableChroma: true })} />);

      const chromaSlider = screen.getByRole('slider', { name: /chroma/i });

      // Slider should still be in DOM when disabled (disabled state verified via snapshot)
      expect(chromaSlider).toBeInTheDocument();
    });

    it('randomize button generates new color', () => {
      render(<OKLCH {...createDefaultProps()} />);

      // Find the randomize button (has ArrowsClockwiseIcon)
      const buttons = screen.getAllByRole('button');
      const randomizeButton = buttons.find(button => button.querySelector('svg'));

      expect(randomizeButton).toBeDefined();
      fireEvent.click(randomizeButton!);

      expect(mockOnChangeColor).toHaveBeenCalledWith('oklch(0.65 0.15 180)');
    });
  });
});
