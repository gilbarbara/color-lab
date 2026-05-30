import { render, screen } from '~/test-utils';

import About from '../../app/about/About';

describe('pages/About', () => {
  it('renders correctly', () => {
    render(<About />);

    expect(screen.getByTestId('About')).toMatchSnapshot();
  });
});
