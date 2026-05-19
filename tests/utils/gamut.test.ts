import { detectInitialGamut, isP3Supported } from '~/utils/gamut';

vi.unmock('~/utils/gamut');

function mockMatchMedia(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('utils/gamut', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe('isP3Supported', () => {
    it('returns true when matchMedia matches P3 query', () => {
      mockMatchMedia(true);

      expect(isP3Supported()).toBe(true);
      expect(window.matchMedia).toHaveBeenCalledWith('(color-gamut: p3)');
    });

    it('returns false when matchMedia does not match', () => {
      mockMatchMedia(false);

      expect(isP3Supported()).toBe(false);
    });
  });

  describe('detectInitialGamut', () => {
    it('returns p3 when display supports P3', () => {
      mockMatchMedia(true);

      expect(detectInitialGamut()).toBe('p3');
    });

    it('returns srgb when display does not support P3', () => {
      mockMatchMedia(false);

      expect(detectInitialGamut()).toBe('srgb');
    });
  });
});
