import { trackEvent, trackPage } from '~/utils/analytics';

const mockCaptureException = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  captureException: (...arguments_: unknown[]) => mockCaptureException(...arguments_),
}));

describe('utils/analytics', () => {
  const originalUmami = window.umami;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.umami = originalUmami;
  });

  describe('trackEvent', () => {
    it('forwards to window.umami.track when present', () => {
      const track = vi.fn();

      window.umami = { track };

      trackEvent('clicked', { value: 1 });

      expect(track).toHaveBeenCalledWith('clicked', { value: 1 });
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('captures to Sentry when umami throws', () => {
      window.umami = {
        track: () => {
          throw new Error('umami down');
        },
      };

      trackEvent('clicked');

      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
        tags: { source: 'umami', call: 'trackEvent' },
      });
    });

    it('is a no-op when umami is absent', () => {
      window.umami = undefined;

      expect(() => trackEvent('clicked')).not.toThrow();
      expect(mockCaptureException).not.toHaveBeenCalled();
    });
  });

  describe('trackPage', () => {
    it('forwards a function to window.umami.track', () => {
      const track = vi.fn();

      window.umami = { track };

      trackPage('/about');

      expect(track).toHaveBeenCalledTimes(1);
      const callback = track.mock.calls[0][0] as (
        props: Record<string, unknown>,
      ) => Record<string, unknown>;

      expect(callback({ existing: 1 })).toEqual({ existing: 1, url: '/about' });
    });

    it('captures to Sentry when umami throws', () => {
      window.umami = {
        track: () => {
          throw new Error('umami down');
        },
      };

      trackPage('/about');

      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
        tags: { source: 'umami', call: 'trackPage' },
      });
    });
  });
});
