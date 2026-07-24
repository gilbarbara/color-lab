import { setReducedMotion } from '~/test-mocks';
import { prefersReducedMotion } from '~/utils/motion';

describe('utils/motion', () => {
  describe('prefersReducedMotion', () => {
    it('returns false by default', () => {
      expect(prefersReducedMotion()).toBe(false);
    });

    it('returns true when the OS preference is set', () => {
      setReducedMotion(true);

      expect(prefersReducedMotion()).toBe(true);
    });

    // Pins the literal. The e2e harness drives the same preference through Playwright's
    // emulateMedia, which only lines up if this query string stays exact.
    it('queries the reduced-motion media feature', () => {
      prefersReducedMotion();

      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('ignores unrelated media queries', () => {
      setReducedMotion(true);

      expect(window.matchMedia('(color-gamut: p3)').matches).toBe(false);
    });
  });
});
