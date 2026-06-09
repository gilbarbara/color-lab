import { render, screen } from '~/test-utils';

import OklchVsHsl from '../../app/oklch-vs-hsl/OklchVsHsl';

describe('pages/OklchVsHsl', () => {
  it('renders correctly', () => {
    render(<OklchVsHsl />);

    expect(screen.getByTestId('OklchVsHsl')).toMatchSnapshot();
  });
});
