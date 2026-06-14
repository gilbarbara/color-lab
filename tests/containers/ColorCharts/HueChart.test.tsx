import { scale } from 'colorizr';

import { createColorEntry, CRIMSON } from '~/test-fixtures';
import { render, screen } from '~/test-utils';
import { getDefaultGlobalOptions } from '~/utils/generator';

import HueChart from '~/containers/ColorCharts/HueChart';

describe('ColorCharts/HueChart', () => {
  const colorEntry = createColorEntry('Primary', CRIMSON);
  const options = getDefaultGlobalOptions(CRIMSON);
  const steps = scale(colorEntry.value, options);

  it('renders correctly', () => {
    const { container } = render(
      <HueChart colorEntry={colorEntry} options={options} steps={steps} />,
    );

    expect(container.firstChild).toMatchSnapshot();
    expect(screen.getByText(/base/)).toBeInTheDocument();
  });
});
