import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import * as Sentry from '@sentry/react';

import AuthProvider from '~/providers/AuthProvider';
import ThemeProvider from '~/providers/ThemeProvider';

import ErrorFallback from '~/components/ErrorFallback';

import App from './App';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'https://741e6611f536afcbb507dc8ff10c4553@o23412.ingest.us.sentry.io/4510694826508288',
    environment: import.meta.env.MODE,
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
