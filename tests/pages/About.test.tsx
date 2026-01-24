import { render, screen } from '~/test-utils';

import About from '~/pages/About';

describe('pages/About', () => {
  it('renders correctly', () => {
    render(<About />);

    expect(screen.getByTestId('About')).toMatchSnapshot();
  });
});
