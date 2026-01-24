import { render, screen } from '~/test-utils';

import Generator from '~/pages/Generator';

// Mock random color for deterministic snapshots
vi.mock('~/utils/color', async importOriginal => {
  const actual = await importOriginal<typeof import('~/utils/color')>();

  return {
    ...actual,
    getRandomColor: () => '#FF0044',
  };
});

describe('Generator', () => {
  it('renders correctly', () => {
    render(<Generator />);

    expect(screen.getByTestId('Generator')).toMatchSnapshot();
  });
});
