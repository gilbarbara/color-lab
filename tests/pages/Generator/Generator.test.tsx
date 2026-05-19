import { render, screen } from '~/test-utils';

import Generator from '~/pages/Generator';

// Mock random color for deterministic snapshots.
// Inline OKLCH literal (vi.mock factory cannot reference module-scope vars due to hoisting).
// Equivalent to RED fixture (ex-#FF0044).
vi.mock('~/utils/color', async importOriginal => {
  const actual = await importOriginal<typeof import('~/utils/color')>();

  return {
    ...actual,
    getRandomColor: () => 'oklch(63.269% 0.25404 19.902)',
  };
});

vi.mock('~/components/Preview', () => ({
  default: () => <div data-testid="Preview" />,
}));

describe('Generator', () => {
  it('renders correctly', () => {
    render(<Generator />);

    expect(screen.getByTestId('Generator')).toMatchSnapshot();
  });
});
