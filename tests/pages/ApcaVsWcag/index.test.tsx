import { render, screen } from '~/test-utils';

import ApcaVsWcag from '../../../app/apca-vs-wcag/ApcaVsWcag';

describe('pages/ApcaVsWcag', () => {
  beforeAll(() => {
    // jsdom has no canvas; the OKLCH panel skips drawing when the context is null.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly', () => {
    render(<ApcaVsWcag />);

    expect(screen.getByTestId('ApcaVsWcag')).toMatchSnapshot();
  });

  it('shows each method’s pick on the hook button', () => {
    render(<ApcaVsWcag />);

    expect(screen.getByTestId('hook-wcag')).toHaveStyle({ color: 'rgb(0, 0, 0)' });
    expect(screen.getByTestId('hook-apca')).toHaveStyle({ color: 'rgb(255, 255, 255)' });
  });

  it('disagrees on every hue in the comparison rows', () => {
    render(<ApcaVsWcag />);

    expect(screen.getAllByRole('img', { name: /black text$/ })).toHaveLength(9);
    expect(screen.getAllByRole('img', { name: /white text$/ })).toHaveLength(9);
  });

  it('draws the disagreement band', () => {
    render(<ApcaVsWcag />);

    const overlay = screen.getByTestId('band-overlay');
    const paths = overlay.querySelectorAll('path');

    // The hatched band; the flip lines are labels only.
    expect(paths).toHaveLength(1);
    paths.forEach(path => expect(path.getAttribute('d')).toMatch(/^M/));
    expect(overlay).toHaveTextContent('WCAG flips');
    expect(overlay).toHaveTextContent('APCA flips');
  });
});
