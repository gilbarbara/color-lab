import { render, screen } from '~/test-utils';

import Header from '~/components/Header';

vi.mock('~/hooks/usePalette', () => ({
  default: () => ({
    generatorUrl: '/',
  }),
}));

describe('Header', () => {
  it('should render properly when unauthenticated', () => {
    render(<Header />);

    expect(screen.getByTestId('Header')).toMatchSnapshot();
  });

  it('should render properly when authenticated', () => {
    render(<Header />, {
      authState: {
        isAuthenticated: true,
        user: { displayName: 'Test User', email: 'test@example.com' },
      },
    });

    expect(screen.getByTestId('Header')).toMatchSnapshot();
  });
});
