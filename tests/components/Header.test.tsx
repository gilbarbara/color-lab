import { render } from '~/test-utils';

import Header from '~/components/Header';

describe('Header', () => {
  it('should render properly', () => {
    const { container } = render(<Header />);

    expect(container).toMatchSnapshot();
  });
});
