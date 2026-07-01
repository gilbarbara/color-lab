import { readFileSync } from 'node:fs';
import path from 'node:path';

import { withSentryConfig } from '@sentry/nextjs';
import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';

const packageJSON = JSON.parse(readFileSync('./package.json', 'utf8'));
const ROOT = path.resolve(import.meta.dirname);

// NEXT_PUBLIC_FIREBASE_* are inlined into the client bundle at build time, so
// they must be present for `next build` (in Dokploy, as Build Args — not just
// runtime Environment). Firebase init is now lazy/client-side, so a missing key
// no longer fails the build on its own; assert here to fail loudly instead of
// shipping a bundle whose Firebase config is empty.
const REQUIRED_FIREBASE_ENV = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: ROOT,
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJSON.version,
  },
  // PostHog uses trailing slashes on its API (e.g. /e/); Next.js would otherwise
  // redirect and break event capture through the proxy below.
  skipTrailingSlashRedirect: true,
  // Reverse-proxy PostHog through our own domain so ad blockers don't drop
  // analytics. api_host is set to '/ingest' in src/utils/analytics.ts.
  // Specific rules must precede the catch-all — Next.js matches in order.
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/array/:path*',
        destination: 'https://us-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
};

const sentryConfig = withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  // Source map upload requires SENTRY_AUTH_TOKEN in env. Without it, build
  // succeeds but maps are not uploaded.
  org: 'kollectiv',
  project: 'color-lab',
  // Pin the release to the app version so it matches the runtime release in
  // sentry.*.config.ts (`v${APP_VERSION}`). Without this the plugin names the
  // release by git SHA, minting a fresh, event-less release on every build.
  release: { name: `v${packageJSON.version}` },
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});

export default phase => {
  if (phase === PHASE_PRODUCTION_BUILD) {
    const missing = REQUIRED_FIREBASE_ENV.filter(key => !process.env[key]);

    if (missing.length) {
      throw new Error(
        `Missing required Firebase build env: ${missing.join(', ')}. In Dokploy these must be set as Build Args (not just Environment).`,
      );
    }
  }

  return sentryConfig;
};
