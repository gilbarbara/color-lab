import { render, screen } from '~/test-utils';

import CustomColorScales from '../../app/custom-color-scales/CustomColorScales';

describe('pages/CustomColorScales', () => {
  it('renders correctly', () => {
    render(<CustomColorScales />);

    expect(screen.getByTestId('CustomColorScales')).toMatchSnapshot();
  });
});
