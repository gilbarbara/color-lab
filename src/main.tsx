import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import * as Sentry from '@sentry/react';

import AuthProvider from '~/providers/AuthProvider';
import ThemeProvider from '~/providers/ThemeProvider';

import ErrorFallback from '~/components/ErrorFallback';

import App from './App';

declare const __APP_VERSION__: string;

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'https://741e6611f536afcbb507dc8ff10c4553@o23412.ingest.us.sentry.io/4510694826508288',
    environment: import.meta.env.MODE,
    release: `v${__APP_VERSION__}`,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 0.1,
    // Only record replay when an error happens; keep session sample at 0 so we
    // don't burn the 50/mo free quota on uneventful sessions.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Drop known browser noise that isn't actionable.
      if (
        error instanceof Error &&
        (error.message.includes('ResizeObserver loop') ||
          error.message.includes('Non-Error promise rejection captured'))
      ) {
        return null;
      }

      // Drop errors originating in browser extensions.
      const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];

      if (frames.some(frame => frame.filename?.includes('extension://'))) {
        return null;
      }

      return event;
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Sentry.ErrorBoundary
          fallback={({ error, eventId, resetError }) => (
            <ErrorFallback error={error} eventId={eventId} resetError={resetError} />
          )}
        >
          <AuthProvider>
            <App />
          </AuthProvider>
        </Sentry.ErrorBoundary>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
