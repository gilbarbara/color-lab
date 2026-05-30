import { render, screen } from '~/test-utils';

import Terms from '../../app/terms/Terms';

describe('pages/Terms', () => {
  it('renders correctly', () => {
    render(<Terms />);

    expect(screen.getByTestId('Terms')).toMatchSnapshot();
  });
});
