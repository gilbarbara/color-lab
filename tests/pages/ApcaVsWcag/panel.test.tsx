import { OKLCHPanel } from '@transience/color-picker';

import { render, screen } from '~/test-utils';

import { lcToPointer } from '../../../app/apca-vs-wcag/utils';

function getThumbPosition() {
  const thumb = screen.getByTestId('OKLCHPanel').lastElementChild as HTMLElement;

  return { x: Number.parseFloat(thumb.style.left), y: Number.parseFloat(thumb.style.top) };
}

describe('pages/ApcaVsWcag/panel', () => {
  beforeAll(() => {
    // jsdom has no canvas; the panel skips drawing when the context is null.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it.each([
    { h: 20, l: 0.633, c: 0.254 },
    { h: 140, l: 0.7, c: 0.1 },
    { h: 250, l: 0.45, c: 0.15 },
    { h: 320, l: 0.8, c: 0 },
  ])('matches the panel thumb at $l $c $h', ({ c, h, l }) => {
    render(<OKLCHPanel chroma={c} hue={h} lightness={l} />);

    const expected = lcToPointer(h, l, c);
    const actual = getThumbPosition();

    expect(actual.x).toBeCloseTo(expected.x, 6);
    expect(actual.y).toBeCloseTo(expected.y, 6);
  });

  it('puts neutrals on the left edge', () => {
    expect(lcToPointer(200, 0.5, 0).x).toBe(0);
  });
});
