import { render, screen } from '~/test-utils';

import Footer from '~/components/Footer';

vi.unmock('~/components/Footer');

describe('Footer', () => {
  it('renders correctly', () => {
    render(<Footer />);

    expect(screen.getByTestId('Footer')).toMatchSnapshot();
  });
});
