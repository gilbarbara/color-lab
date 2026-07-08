import * as Sentry from '@sentry/nextjs';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

// Crawlers (Googlebot, GSC's Google-InspectionTool, Lighthouse/PSI, headless Chrome) execute
// page JS during rendering. Initializing Sentry for them fires beacons to ingest.sentry.io that
// get blocked and surface as CORS errors in Search Console, while burning quota on bot traffic.
const isBot =
  typeof navigator !== 'undefined' &&
  /bot|crawl|spider|inspectiontool|lighthouse|headless|pagespeed|google-/i.test(
    navigator.userAgent,
  );

// Firebase magic-link callbacks put a single-use `oobCode` in the query string.
// Strip query + hash from any /auth/* URL so that credential never reaches Sentry
// via `event.request.url` — which, unlike `request.query_string`/breadcrumbs/spans,
// is NOT covered by Sentry's server-side scrubbing. The structured surfaces (and
// Session Replay) are handled by the `oobCode` entry in the project's
// Additional Sensitive Fields (Sentry → Security & Privacy → Data Scrubbing).
function scrubAuthUrl(url: string | undefined): string | undefined {
  if (!url) {
    return url;
  }

  try {
    const isAbsolute = /^https?:\/\//.test(url);
    const parsed = new URL(url, 'http://placeholder');

    if (parsed.pathname.startsWith('/auth')) {
      return isAbsolute ? parsed.origin + parsed.pathname : parsed.pathname;
    }
  } catch {
    // Unparseable value — leave it untouched.
  }

  return url;
}

if (process.env.NODE_ENV === 'production' && !isBot) {
  Sentry.init({
    dsn: 'https://741e6611f536afcbb507dc8ff10c4553@o23412.ingest.us.sentry.io/4510694826508288',
    environment: process.env.NODE_ENV,
    release: APP_VERSION ? `v${APP_VERSION}` : undefined,
    // Replay is loaded lazily after init (see below) to keep rrweb off the
    // initial bundle / hydration path.
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    // Only record replay when an error happens; keep session sample at 0 so we
    // don't burn the 50/mo free quota on uneventful sessions.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      const error = hint.originalException;

      if (
        error instanceof Error &&
        (error.message.includes('ResizeObserver loop') ||
          error.message.includes('Non-Error promise rejection captured'))
      ) {
        return null;
      }

      const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];

      if (frames.some(frame => frame.filename?.includes('extension://'))) {
        return null;
      }

      if (event.request?.url) {
        event.request.url = scrubAuthUrl(event.request.url);
      }

      return event;
    },
  });

  // Lazy-load Session Replay off the initial hydration path. It only records on
  // error (replaysOnErrorSampleRate), so a brief delay before it starts buffering
  // is acceptable. Dynamic import lets the bundler split rrweb into a separate
  // chunk loaded when the browser is idle.
  const loadReplay = () => {
    import('@sentry/nextjs')
      .then(({ replayIntegration }) => {
        Sentry.addIntegration(replayIntegration());
      })
      .catch(() => {
        // Replay is best-effort; ignore load failures (ad-blockers, offline).
      });
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(loadReplay);
  } else {
    setTimeout(loadReplay, 2000);
  }
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
