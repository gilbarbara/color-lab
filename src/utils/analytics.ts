import * as Sentry from '@sentry/nextjs';

declare global {
  interface Window {
    umami?: { track: (...arguments_: any[]) => void };
  }
}

export function trackEvent(name: string, data?: Record<string, string | number | boolean>): void {
  try {
    window.umami?.track(name, data);
  } catch (error_) {
    Sentry.captureException(error_, { tags: { source: 'umami', call: 'trackEvent' } });
  }
}

export function trackPage(url: string): void {
  try {
    window.umami?.track((props: Record<string, unknown>) => ({ ...props, url }));
  } catch (error_) {
    Sentry.captureException(error_, { tags: { source: 'umami', call: 'trackPage' } });
  }
}
