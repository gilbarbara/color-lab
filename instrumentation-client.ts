import * as Sentry from '@sentry/nextjs';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

if (process.env.NODE_ENV === 'production') {
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
