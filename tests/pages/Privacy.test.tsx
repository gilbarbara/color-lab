import { render, screen } from '~/test-utils';

import Privacy from '~/pages/Privacy';

describe('pages/Privacy', () => {
  it('renders correctly', () => {
    render(<Privacy />);

    expect(screen.getByTestId('Privacy')).toMatchSnapshot();
  });
});
