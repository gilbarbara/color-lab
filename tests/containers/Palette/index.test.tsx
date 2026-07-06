import { useAppStore } from '~/stores/appStore';
import { createTestPalette } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { render, screen } from '~/test-utils';

import Palette from '~/containers/Palette';

// Header, Preview and Footer are covered by their own tests; stub them so these
// snapshots stay focused on the view-switching layout (List / Grid / Preview).
vi.mock('~/containers/Palette/Header', () => ({
  default: () => <div data-testid="Header" />,
}));

vi.mock('~/containers/Preview', () => ({
  default: () => <div data-testid="Preview" />,
}));

vi.mock('~/components/Footer', () => ({
  default: () => <div data-testid="Footer" />,
}));

vi.mock('~/containers/Palette/Options', () => ({
  default: () => <div data-testid="Options" />,
}));

vi.mock('~/hooks/useRafCallback', () => ({
  default: (callback: unknown) => callback,
}));

describe('Palette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ gamut: 'p3', showPaletteOptionsPanel: false });
    getGeneratorStore().setState(createTestPalette(2));
  });

  it('renders the list view', () => {
    useAppStore.setState({ view: 'list' });

    render(<Palette />);

    expect(screen.getByTestId('Palette')).toMatchSnapshot();
  });

  it('renders the grid view', () => {
    useAppStore.setState({ view: 'grid' });

    render(<Palette />);

    expect(screen.getByTestId('Palette')).toMatchSnapshot();
  });

  it('renders the preview view', () => {
    useAppStore.setState({ view: 'preview' });

    render(<Palette />);

    expect(screen.getByTestId('Palette')).toMatchSnapshot();
  });
});
