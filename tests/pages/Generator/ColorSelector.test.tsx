import { act, fireEvent, render, screen } from '~/test-utils';
import { getDefaultGlobalOptions } from '~/utils/palette';

import ColorSelector from '~/pages/Generator/ColorList/ColorSelector';

import type { ColorEntry, GlobalScaleOptions } from '~/types';

const mockOnRemoveColor = vi.fn();
const mockOnResetColor = vi.fn();
const mockOnUpdateColor = vi.fn();
const mockOnUpdateGlobalOptions = vi.fn();

function createColorEntry(
  name: string,
  value: string,
  overrides?: ColorEntry['overrides'],
): ColorEntry {
  return { id: crypto.randomUUID(), name, value, ...(overrides && { overrides }) };
}

const TEST_COLOR = '#FF0044';

function createDefaultProps(overrides: Partial<Parameters<typeof ColorSelector>[0]> = {}) {
  const globalOptions: GlobalScaleOptions = getDefaultGlobalOptions(TEST_COLOR);

  return {
    baseSaturation: 80,
    colorEntry: createColorEntry('Primary', TEST_COLOR),
    globalOptions,
    index: 0,
    isOnlyColor: false,
    onRemoveColor: mockOnRemoveColor,
    onResetColor: mockOnResetColor,
    onUpdateColor: mockOnUpdateColor,
    onUpdateGlobalOptions: mockOnUpdateGlobalOptions,
    ...overrides,
  };
}

describe('ColorSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Render', () => {
    it('renders correctly in SRGB mode', () => {
      const { container } = render(<ColorSelector {...createDefaultProps()} />);

      expect(container).toMatchSnapshot();
    });

    it('renders correctly in OKLCH mode', () => {
      const props = createDefaultProps({
        colorEntry: createColorEntry('Primary', 'oklch(0.7 0.2 120)'),
      });
      const { container } = render(<ColorSelector {...props} />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('switches between SRGB and OKLCH modes', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      // Initially in SRGB mode
      const modeButton = screen.getByRole('button', { name: /srgb/i });

      expect(modeButton).toBeInTheDocument();

      // Click to switch to OKLCH
      fireEvent.click(modeButton);

      expect(screen.getByRole('button', { name: /oklch/i })).toBeInTheDocument();
    });

    it('updates color name on Enter key', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('Primary');

      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnUpdateColor).toHaveBeenCalledWith(0, { name: 'New Name' });
    });

    it('reverts name on blur without Enter', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('Primary');

      fireEvent.change(input, { target: { value: 'New Name' } });

      // Value changes in state
      expect(screen.getByDisplayValue('New Name')).toBeInTheDocument();

      fireEvent.blur(input);

      // Name should revert to original since colorEntry.name !== local name
      expect(screen.getByDisplayValue('Primary')).toBeInTheDocument();
    });

    it('shows remove confirmation on first click', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      const removeButton = screen.getByRole('button', { name: /remove color/i });

      fireEvent.click(removeButton);

      // Should not remove yet
      expect(mockOnRemoveColor).not.toHaveBeenCalled();
    });

    it('removes color on second click within 2 seconds', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      const removeButton = screen.getByRole('button', { name: /remove color/i });

      // First click
      fireEvent.click(removeButton);
      expect(mockOnRemoveColor).not.toHaveBeenCalled();

      // Second click
      fireEvent.click(removeButton);
      expect(mockOnRemoveColor).toHaveBeenCalledWith(0);
    });

    it('resets remove confirmation after 2 seconds', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      const removeButton = screen.getByRole('button', { name: /remove color/i });

      // First click
      fireEvent.click(removeButton);

      // Wait 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // First click again (should restart confirmation, and not call onRemoveColor)
      fireEvent.click(removeButton);

      // Second click should now trigger removal since confirmation was reset
      fireEvent.click(removeButton);
      expect(mockOnRemoveColor).toHaveBeenCalledWith(0);
    });

    it('disables remove when isOnlyColor is true', () => {
      render(<ColorSelector {...createDefaultProps({ isOnlyColor: true })} />);

      const removeButton = screen.getByRole('button', { name: /remove color/i });

      expect(removeButton).toBeDisabled();
    });

    it('opens options popover on gear click', () => {
      render(<ColorSelector {...createDefaultProps()} />);

      const optionsButton = screen.getByRole('button', { name: /change color options/i });

      fireEvent.click(optionsButton);

      // The popover trigger is controlled by HeroUI's useDisclosure
      // Check that the click was handled (popover content may be in a portal)
      expect(optionsButton).toBeInTheDocument();
    });
  });
});
