const mockCaptureException = vi.fn();
const mockCapture = vi.fn();
const mockInit = vi.fn();
const mockIdentify = vi.fn();
const mockReset = vi.fn();
const mockFetch = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  captureException: (...arguments_: unknown[]) => mockCaptureException(...arguments_),
}));

vi.mock('posthog-js', () => ({
  default: { init: mockInit, capture: mockCapture, identify: mockIdentify, reset: mockReset },
}));

async function getBeforeSend() {
  const { initAnalytics } = await loadAnalytics();

  await initAnalytics();

  return mockInit.mock.calls[0][1].before_send as (
    event: { properties: Record<string, unknown> } | null,
  ) => { properties: Record<string, unknown> } | null;
}

// The module keeps queue/ready state at module scope, so each test loads a fresh
// copy (vi.resetModules in beforeEach) to control readiness in isolation.
async function loadAnalytics() {
  return import('~/utils/analytics');
}

describe('utils/analytics', () => {
  const originalEnv = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    // Default: /vid resolves with no id, so init runs without bootstrap unless a test overrides it.
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ distinctID: null }) });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    } else {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = originalEnv;
    }
  });

  describe('normalizePathname', () => {
    it.each([
      ['/p', '/generator'],
      ['/p/Primary-50_0.1_120', '/generator'],
      ['/palettes', '/palettes'],
      ['/about', '/about'],
      ['/', '/'],
    ])('normalizes %s to %s', async (input, expected) => {
      const { normalizePathname } = await loadAnalytics();

      expect(normalizePathname(input)).toBe(expected);
    });

    it('returns null for auth routes', async () => {
      const { normalizePathname } = await loadAnalytics();

      expect(normalizePathname('/auth/callback')).toBeNull();
    });
  });

  describe('initAnalytics', () => {
    it('initializes PostHog with the reverse-proxy + cookieless config', async () => {
      const { initAnalytics } = await loadAnalytics();

      await initAnalytics();

      expect(mockInit).toHaveBeenCalledTimes(1);
      expect(mockInit).toHaveBeenCalledWith(
        'phc_test',
        expect.objectContaining({
          api_host: '/ingest',
          persistence: 'memory',
          capture_pageview: false,
        }),
      );
    });

    it('bootstraps the server-derived distinct id when /vid returns one', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ distinctID: 'hash-123' }) });

      const { initAnalytics } = await loadAnalytics();

      await initAnalytics();

      expect(mockFetch).toHaveBeenCalledWith('/vid', { cache: 'no-store' });
      expect(mockInit).toHaveBeenCalledWith(
        'phc_test',
        expect.objectContaining({
          bootstrap: { distinctID: 'hash-123', isIdentifiedID: false },
        }),
      );
    });

    it('initializes without bootstrap when /vid returns null', async () => {
      const { initAnalytics } = await loadAnalytics();

      await initAnalytics();

      expect(mockInit.mock.calls[0][1]).not.toHaveProperty('bootstrap');
    });

    it('initializes without bootstrap when the /vid fetch rejects', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network'));

      const { initAnalytics } = await loadAnalytics();

      await initAnalytics();

      expect(mockInit).toHaveBeenCalledTimes(1);
      expect(mockInit.mock.calls[0][1]).not.toHaveProperty('bootstrap');
    });

    it('is a no-op when the key is missing', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = '';

      const { initAnalytics } = await loadAnalytics();

      await initAnalytics();

      expect(mockInit).not.toHaveBeenCalled();
    });

    it('does not re-initialize on a second call', async () => {
      const { initAnalytics } = await loadAnalytics();

      await initAnalytics();
      await initAnalytics();

      expect(mockInit).toHaveBeenCalledTimes(1);
    });

    it('does not init twice when called concurrently', async () => {
      const { initAnalytics } = await loadAnalytics();

      await Promise.all([initAnalytics(), initAnalytics()]);

      expect(mockInit).toHaveBeenCalledTimes(1);
    });

    it('stops forwarding calls after a failed init', async () => {
      mockInit.mockImplementationOnce(() => {
        throw new Error('init failed');
      });

      const { initAnalytics, trackEvent } = await loadAnalytics();

      await initAnalytics();
      trackEvent('add-color');

      expect(mockCapture).not.toHaveBeenCalled();
      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
        tags: { source: 'posthog', call: 'init' },
      });
    });
  });

  describe('before_send', () => {
    it('collapses palette URLs to /generator on every event', async () => {
      const beforeSend = await getBeforeSend();

      const result = beforeSend({
        properties: {
          $current_url: 'https://color-lab.localhost/p/Primary-50_0.1_120/Secondary-40_0.2_260?x=1',
          $pathname: '/p/Primary-50_0.1_120/Secondary-40_0.2_260',
        },
      });

      expect(result?.properties.$pathname).toBe('/generator');
      expect(result?.properties.$current_url).toBe('https://color-lab.localhost/generator');
    });

    it('leaves non-palette URLs untouched', async () => {
      const beforeSend = await getBeforeSend();

      const result = beforeSend({
        properties: {
          $current_url: 'https://color-lab.localhost/palettes?sort=name',
          $pathname: '/palettes',
        },
      });

      expect(result?.properties.$pathname).toBe('/palettes');
      expect(result?.properties.$current_url).toBe(
        'https://color-lab.localhost/palettes?sort=name',
      );
    });

    it('drops auth-route events entirely', async () => {
      const beforeSend = await getBeforeSend();

      const result = beforeSend({
        properties: {
          $current_url: 'https://color-lab.localhost/auth/callback?code=abc',
          $pathname: '/auth/callback',
        },
      });

      expect(result).toBeNull();
    });

    it('passes through a null event', async () => {
      const beforeSend = await getBeforeSend();

      expect(beforeSend(null)).toBeNull();
    });
  });

  describe('queue', () => {
    it('buffers calls made before init and replays them in order', async () => {
      const { initAnalytics, trackEvent, trackPage } = await loadAnalytics();

      // Not ready yet — calls are queued, nothing forwarded.
      trackPage();
      trackEvent('add-color');

      expect(mockCapture).not.toHaveBeenCalled();

      await initAnalytics();

      expect(mockCapture).toHaveBeenCalledTimes(2);
      expect(mockCapture.mock.calls[0]).toEqual(['$pageview']);
      expect(mockCapture.mock.calls[1]).toEqual(['add-color', undefined]);
    });
  });

  describe('trackEvent', () => {
    it('forwards to posthog.capture once ready', async () => {
      const { initAnalytics, trackEvent } = await loadAnalytics();

      await initAnalytics();
      trackEvent('clicked', { value: 1 });

      expect(mockCapture).toHaveBeenCalledWith('clicked', { value: 1 });
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('captures to Sentry when posthog throws', async () => {
      mockCapture.mockImplementationOnce(() => {
        throw new Error('posthog down');
      });

      const { initAnalytics, trackEvent } = await loadAnalytics();

      await initAnalytics();
      trackEvent('clicked');

      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
        tags: { source: 'posthog', call: 'trackEvent' },
      });
    });
  });

  describe('identifyUser', () => {
    it('forwards the distinct id and properties to posthog.identify once ready', async () => {
      const { identifyUser, initAnalytics } = await loadAnalytics();

      await initAnalytics();
      identifyUser('uid-1', { email: 'a@b.co', name: 'Ada' });

      expect(mockIdentify).toHaveBeenCalledWith('uid-1', { email: 'a@b.co', name: 'Ada' });
    });

    it('captures to Sentry when posthog throws', async () => {
      mockIdentify.mockImplementationOnce(() => {
        throw new Error('posthog down');
      });

      const { identifyUser, initAnalytics } = await loadAnalytics();

      await initAnalytics();
      identifyUser('uid-1');

      expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
        tags: { source: 'posthog', call: 'identifyUser' },
      });
    });
  });

  describe('resetUser', () => {
    it('forwards to posthog.reset once ready', async () => {
      const { initAnalytics, resetUser } = await loadAnalytics();

      await initAnalytics();
      resetUser();

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('captures to Sentry when posthog throws', async () => {
      mockReset.mockImplementationOnce(() => {
        throw new Error('posthog down');
      });

      const { initAnalytics, resetUser } = await loadAnalytics();

      await initAnalytics();
      resetUser();

      expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
        tags: { source: 'posthog', call: 'resetUser' },
      });
    });
  });

  describe('trackPage', () => {
    it('sends a $pageview once ready', async () => {
      const { initAnalytics, trackPage } = await loadAnalytics();

      await initAnalytics();
      trackPage();

      expect(mockCapture).toHaveBeenCalledTimes(1);
      expect(mockCapture).toHaveBeenCalledWith('$pageview');
    });

    it('captures to Sentry when posthog throws', async () => {
      mockCapture.mockImplementationOnce(() => {
        throw new Error('posthog down');
      });

      const { initAnalytics, trackPage } = await loadAnalytics();

      await initAnalytics();
      trackPage();

      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
        tags: { source: 'posthog', call: 'trackPage' },
      });
    });
  });
});
