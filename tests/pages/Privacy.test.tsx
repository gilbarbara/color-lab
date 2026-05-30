import { render, screen } from '~/test-utils';

import Privacy from '../../app/privacy/Privacy';

describe('pages/Privacy', () => {
  it('renders correctly', () => {
    render(<Privacy />);

    expect(screen.getByTestId('Privacy')).toMatchSnapshot();
  });
});
