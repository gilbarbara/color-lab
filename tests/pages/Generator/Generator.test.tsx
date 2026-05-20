import { CRIMSON } from '~/test-fixtures';
import { render, screen } from '~/test-utils';

import Generator from '~/pages/Generator';

// Mock random color for deterministic snapshots.
// Inline OKLCH literal (vi.mock factory cannot reference module-scope vars due to hoisting).
// Equivalent to RED fixture (ex-#FF0044).
vi.mock('~/utils/color', async importOriginal => {
  const actual = await importOriginal<typeof import('~/utils/color')>();

  return {
    ...actual,
    getRandomColor: () => CRIMSON,
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
