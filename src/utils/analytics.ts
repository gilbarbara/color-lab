import * as Sentry from '@sentry/nextjs';

declare global {
  interface Window {
    umami?: { track: (...arguments_: any[]) => void };
  }
}

let isReady = false;
const queue: Array<() => void> = [];

function run(call: () => void): void {
  // Umami loads afterInteractive; calls made before it exists would be
  // silently dropped (notably the initial landing pageview). Queue until ready.
  if (isReady && window.umami) {
    call();
  } else {
    queue.push(call);
  }
}

export function flushAnalyticsQueue(): void {
  isReady = true;

  while (queue.length) {
    queue.shift()?.();
  }
}

export function trackEvent(name: string, data?: Record<string, string | number | boolean>): void {
  run(() => {
    try {
      window.umami?.track(name, data);
    } catch (error_) {
      Sentry.captureException(error_, { tags: { source: 'umami', call: 'trackEvent' } });
    }
  });
}

export function trackPage(url: string): void {
  run(() => {
    try {
      window.umami?.track((props: Record<string, unknown>) => ({ ...props, url }));
    } catch (error_) {
      Sentry.captureException(error_, { tags: { source: 'umami', call: 'trackPage' } });
    }
  });
}
