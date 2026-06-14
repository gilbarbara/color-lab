import { scale } from 'colorizr';

import { createColorEntry, CRIMSON } from '~/test-fixtures';
import { fireEvent, render, screen } from '~/test-utils';
import { getDefaultGlobalOptions } from '~/utils/generator';

import ColorCharts from '~/containers/ColorCharts';

describe('ColorCharts', () => {
  const colorEntry = createColorEntry('Primary', CRIMSON);
  const options = getDefaultGlobalOptions(CRIMSON);
  const steps = scale(colorEntry.value, options);

  describe('Render', () => {
    it('renders the Chroma chart by default', () => {
      render(<ColorCharts colorEntry={colorEntry} options={options} steps={steps} />);

      expect(screen.getByTestId('ColorCharts')).toMatchSnapshot();
      expect(screen.getByText(/gamut ceiling/)).toBeInTheDocument();
    });
  });

  describe('Behavior', () => {
    it('switches to the Lightness chart', () => {
      render(<ColorCharts colorEntry={colorEntry} options={options} steps={steps} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Lightness' }));

      expect(screen.getByText(/even/)).toBeInTheDocument();
      expect(screen.queryByText(/gamut ceiling/)).not.toBeInTheDocument();
    });

    it('switches to the Hue chart', () => {
      render(<ColorCharts colorEntry={colorEntry} options={options} steps={steps} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Hue' }));

      expect(screen.getByText(/base/)).toBeInTheDocument();
      expect(screen.queryByText(/gamut ceiling/)).not.toBeInTheDocument();
    });
  });
});
