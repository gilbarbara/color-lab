import { scale } from 'colorizr';

import { createColorEntry, CRIMSON } from '~/test-fixtures';
import { render, screen } from '~/test-utils';
import { getDefaultGlobalOptions } from '~/utils/generator';

import LightnessChart from '~/containers/ColorCharts/LightnessChart';

describe('ColorCharts/LightnessChart', () => {
  const colorEntry = createColorEntry('Primary', CRIMSON);
  const options = getDefaultGlobalOptions(CRIMSON);
  const steps = scale(colorEntry.value, options);

  it('renders correctly', () => {
    const { container } = render(
      <LightnessChart colorEntry={colorEntry} options={options} steps={steps} />,
    );

    expect(container.firstChild).toMatchSnapshot();
    expect(screen.getByText(/lightness/)).toBeInTheDocument();
  });
});
