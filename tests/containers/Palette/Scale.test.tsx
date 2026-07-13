import { createColorEntry, CRIMSON } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { fireEvent, render, screen } from '~/test-utils';
import { getDefaultGlobalOptions } from '~/utils/generator';

import Scale from '~/containers/Palette/Scale';

const { mockScrollToColor } = vi.hoisted(() => ({ mockScrollToColor: vi.fn() }));

vi.mock('~/hooks/useScrollToColor', () => ({
  default: () => mockScrollToColor,
}));

// Swatch renders one button per scale step, so this counts the generated steps.
function countSwatches(): number {
  return screen.getAllByRole('button').filter(button => /^\d+$/.test(button.textContent ?? ''))
    .length;
}

describe('Scale', () => {
  const colorEntry = createColorEntry('Primary', CRIMSON);
  const options = getDefaultGlobalOptions(CRIMSON);

  beforeEach(() => {
    vi.clearAllMocks();
    getGeneratorStore().setState({ chartColorIds: new Set() });
  });

  describe('Render', () => {
    it('renders correctly', () => {
      render(<Scale colorEntry={colorEntry} options={options} />);

      expect(screen.getByTestId('Scale')).toMatchSnapshot();
    });

    it('renders with group', () => {
      render(<Scale colorEntry={{ ...colorEntry, group: 'brand' }} options={options} />);

      expect(screen.getByTestId('Scale')).toMatchSnapshot();
    });

    it('renders the charts when the color is toggled on', () => {
      getGeneratorStore().setState({ chartColorIds: new Set([colorEntry.id]) });

      render(<Scale colorEntry={colorEntry} options={options} />);

      expect(screen.getByTestId('ColorCharts')).toBeInTheDocument();
    });

    it('hides the charts when the color is toggled off', () => {
      render(<Scale colorEntry={colorEntry} options={options} />);

      expect(screen.queryByTestId('ColorCharts')).not.toBeInTheDocument();
    });
  });

  describe('Behavior', () => {
    it('scrolls to the color when the color box is clicked', () => {
      render(<Scale colorEntry={colorEntry} options={options} />);

      fireEvent.click(screen.getByRole('button', { name: 'Select Primary' }));

      expect(mockScrollToColor).toHaveBeenCalledWith(colorEntry.id);
    });

    it('re-renders when the color entry changes', () => {
      const { rerender } = render(<Scale colorEntry={colorEntry} options={options} />);

      expect(screen.getByRole('heading', { name: 'Primary' })).toBeInTheDocument();

      rerender(<Scale colorEntry={createColorEntry('Secondary', CRIMSON)} options={options} />);

      expect(screen.getByRole('heading', { name: 'Secondary' })).toBeInTheDocument();
    });

    it('re-renders when an option value changes', () => {
      const { rerender } = render(<Scale colorEntry={colorEntry} options={options} />);
      const before = countSwatches();

      rerender(
        <Scale colorEntry={colorEntry} options={{ ...options, steps: options.steps + 3 }} />,
      );

      expect(countSwatches()).toBe(before + 3);
    });

    it('skips re-render when props are equal by value', () => {
      const { rerender } = render(<Scale colorEntry={colorEntry} options={options} />);
      const before = countSwatches();

      rerender(<Scale colorEntry={colorEntry} options={{ ...options }} />);

      expect(countSwatches()).toBe(before);
      expect(screen.getByRole('heading', { name: 'Primary' })).toBeInTheDocument();
    });
  });
});
