const mockCaptureException = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  captureException: (...arguments_: unknown[]) => mockCaptureException(...arguments_),
}));

// The module keeps queue/ready state at module scope, so each test loads a fresh
// copy (vi.resetModules in beforeEach) to control readiness in isolation.
async function loadAnalytics() {
  return import('~/utils/analytics');
}

describe('utils/analytics', () => {
  const originalUmami = window.umami;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.umami = originalUmami;
  });

  describe('queue', () => {
    it('buffers calls made before flush and replays them in order', async () => {
      const track = vi.fn();

      window.umami = { track };

      const { flushAnalyticsQueue, trackEvent, trackPage } = await loadAnalytics();

      // Not ready yet — calls are queued, nothing forwarded.
      trackPage('/');
      trackEvent('add-color');

      expect(track).not.toHaveBeenCalled();

      flushAnalyticsQueue();

      expect(track).toHaveBeenCalledTimes(2);

      const pageCallback = track.mock.calls[0][0] as (
        props: Record<string, unknown>,
      ) => Record<string, unknown>;

      expect(pageCallback({})).toEqual({ url: '/' });
      expect(track.mock.calls[1]).toEqual(['add-color', undefined]);
    });

    it('sends the entry url captured at call time even when flushed later', async () => {
      const track = vi.fn();

      window.umami = { track };

      const { flushAnalyticsQueue, trackPage } = await loadAnalytics();

      trackPage('/generator');
      flushAnalyticsQueue();

      const callback = track.mock.calls[0][0] as (
        props: Record<string, unknown>,
      ) => Record<string, unknown>;

      expect(callback({ existing: 1 })).toEqual({ existing: 1, url: '/generator' });
    });
  });

  describe('trackEvent', () => {
    it('forwards to window.umami.track once ready', async () => {
      const track = vi.fn();

      window.umami = { track };

      const { flushAnalyticsQueue, trackEvent } = await loadAnalytics();

      flushAnalyticsQueue();
      trackEvent('clicked', { value: 1 });

      expect(track).toHaveBeenCalledWith('clicked', { value: 1 });
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('captures to Sentry when umami throws', async () => {
      window.umami = {
        track: () => {
          throw new Error('umami down');
        },
      };

      const { flushAnalyticsQueue, trackEvent } = await loadAnalytics();

      flushAnalyticsQueue();
      trackEvent('clicked');

      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
        tags: { source: 'umami', call: 'trackEvent' },
      });
    });

    it('buffers without throwing when umami is absent', async () => {
      window.umami = undefined;

      const { flushAnalyticsQueue, trackEvent } = await loadAnalytics();

      flushAnalyticsQueue();

      expect(() => trackEvent('clicked')).not.toThrow();
      expect(mockCaptureException).not.toHaveBeenCalled();
    });
  });

  describe('trackPage', () => {
    it('forwards a function to window.umami.track once ready', async () => {
      const track = vi.fn();

      window.umami = { track };

      const { flushAnalyticsQueue, trackPage } = await loadAnalytics();

      flushAnalyticsQueue();
      trackPage('/about');

      expect(track).toHaveBeenCalledTimes(1);

      const callback = track.mock.calls[0][0] as (
        props: Record<string, unknown>,
      ) => Record<string, unknown>;

      expect(callback({ existing: 1 })).toEqual({ existing: 1, url: '/about' });
    });

    it('captures to Sentry when umami throws', async () => {
      window.umami = {
        track: () => {
          throw new Error('umami down');
        },
      };

      const { flushAnalyticsQueue, trackPage } = await loadAnalytics();

      flushAnalyticsQueue();
      trackPage('/about');

      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
        tags: { source: 'umami', call: 'trackPage' },
      });
    });
  });
});
