import * as Sentry from '@sentry/nextjs';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://741e6611f536afcbb507dc8ff10c4553@o23412.ingest.us.sentry.io/4510694826508288',
    environment: process.env.NODE_ENV,
    release: APP_VERSION ? `v${APP_VERSION}` : undefined,
    tracesSampleRate: 0.1,
  });
}
