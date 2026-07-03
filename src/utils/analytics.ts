import * as Sentry from '@sentry/nextjs';
import type { PostHog } from 'posthog-js';

type Status = 'idle' | 'starting' | 'ready' | 'disabled';

let client: PostHog | null = null;
let status: Status = 'idle';
const queue: Array<() => void> = [];

function run(call: () => void): void {
  // Drop calls once analytics can never be ready (no key, or init failed) —
  // otherwise the queue grows unbounded for the whole session.
  if (status === 'disabled') {
    return;
  }

  // PostHog is lazy-loaded after hydration; calls made before it exists would be
  // dropped (notably the initial landing pageview). Queue until ready.
  if (status === 'ready' && client) {
    call();
  } else {
    queue.push(call);
  }
}

export function identifyUser(
  distinctId: string,
  properties?: Record<string, string | number | boolean | null>,
): void {
  run(() => {
    try {
      client?.identify(distinctId, properties);
    } catch (error_) {
      Sentry.captureException(error_, { tags: { source: 'posthog', call: 'identifyUser' } });
    }
  });
}

export async function initAnalytics(): Promise<void> {
  // 'starting' is set synchronously below, so a re-entrant call (e.g. React
  // StrictMode's dev double-mount) short-circuits before it can init twice.
  if (status !== 'idle' || typeof window === 'undefined') {
    return;
  }

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!key) {
    status = 'disabled';

    return;
  }

  status = 'starting';

  try {
    const { default: posthog } = await import('posthog-js');

    posthog.init(key, {
      // PostHog persists debug mode in localStorage (`ph_debug`); passing false
      // explicitly clears a stuck flag so verbose logging can't linger in a dev's
      // browser after a one-off `debug: true` session.
      debug: false,
      // Reverse-proxied through our own domain (see next.config.mjs rewrites) to
      // dodge ad blockers. ui_host must stay PostHog's real host for toolbar links.
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      // Cookieless: avoids a GDPR consent banner at the cost of cross-session
      // identity. Fine for an anonymous tool.
      persistence: 'memory',
      person_profiles: 'identified_only',
      // We send pageviews manually (usePageTracking); before_send handles URL
      // normalization for all events.
      capture_pageview: false,
      // Pageleave powers accurate bounce rate / visit duration.
      capture_pageleave: true,
      // Product events are instrumented explicitly via trackEvent; skip the
      // heavier DOM autocapture.
      autocapture: false,
      // Normalize the URL on EVERY event (custom, $pageview, $web_vitals,
      // $pageleave, ...) so palette variants don't explode URL cardinality.
      before_send: event => {
        if (!event) {
          return event;
        }

        const currentUrl = event.properties.$current_url;

        if (typeof currentUrl !== 'string') {
          return event;
        }

        try {
          const parsed = new URL(currentUrl);
          const normalized = normalizePathname(parsed.pathname);

          // Auth routes carry no analytics value — drop the event, matching
          // usePageTracking which suppresses their pageviews.
          if (normalized === null) {
            return null;
          }

          if (normalized !== parsed.pathname) {
            return {
              ...event,
              properties: {
                ...event.properties,
                $pathname: normalized,
                $current_url: parsed.origin + normalized,
              },
            };
          }
        } catch {
          // Leave the event untouched if the URL can't be parsed.
        }

        return event;
      },
    });

    client = posthog;
    status = 'ready';

    while (queue.length) {
      queue.shift()?.();
    }
  } catch (error_) {
    status = 'disabled';
    Sentry.captureException(error_, { tags: { source: 'posthog', call: 'init' } });
  }
}

/**
 * Collapse high-cardinality palette URLs into a single page and drop routes with
 * no analytics value. Returns null for skipped routes. Shared by usePageTracking
 * (decides when to fire a pageview) and the PostHog before_send hook below
 * (rewrites the URL on every event, including PostHog's own $web_vitals /
 * $pageleave).
 */
export function normalizePathname(pathname: string): string | null {
  if (pathname === '/p' || pathname.startsWith('/p/')) {
    return '/generator';
  }

  // Auth routes are robots-disallowed and carry no analytics value.
  if (pathname.startsWith('/auth/')) {
    return null;
  }

  return pathname;
}

export function resetUser(): void {
  run(() => {
    try {
      client?.reset();
    } catch (error_) {
      Sentry.captureException(error_, { tags: { source: 'posthog', call: 'resetUser' } });
    }
  });
}

export function trackEvent(name: string, data?: Record<string, string | number | boolean>): void {
  run(() => {
    try {
      client?.capture(name, data);
    } catch (error_) {
      Sentry.captureException(error_, { tags: { source: 'posthog', call: 'trackEvent' } });
    }
  });
}

export function trackPage(): void {
  run(() => {
    try {
      // URL normalization is handled centrally by before_send.
      client?.capture('$pageview');
    } catch (error_) {
      Sentry.captureException(error_, { tags: { source: 'posthog', call: 'trackPage' } });
    }
  });
}
