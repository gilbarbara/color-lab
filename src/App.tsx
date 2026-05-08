import { Route, Routes, useLocation } from 'react-router';
import * as Sentry from '@sentry/react';

import useAuth from '~/hooks/useAuth';
import usePageTracking from '~/hooks/usePageTracking';

import ErrorFallback from '~/components/ErrorFallback';
import Header from '~/components/Header';
import Login from '~/components/Login';
import About from '~/pages/About';
import AuthCallback from '~/pages/AuthCallback';
import Generator from '~/pages/Generator';
import Palettes from '~/pages/Palettes';
import Privacy from '~/pages/Privacy';
import Terms from '~/pages/Terms';

export default function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  usePageTracking();

  const routeKey =
    location.pathname === '/' || location.pathname.startsWith('/p/')
      ? 'generator'
      : location.pathname;

  return (
    <div className="flex flex-col items-stretch min-h-screen">
      <Header />
      <main className="flex flex-col pt-16 items-stretch flex-1">
        <Sentry.ErrorBoundary
          key={routeKey}
          fallback={({ error, eventId, resetError }) => (
            <ErrorFallback error={error} eventId={eventId} resetError={resetError} />
          )}
        >
          <Routes>
            <Route element={<Generator />} path="/" />
            <Route element={<Generator />} path="/p/*" />
            <Route element={<About />} path="/about" />
            <Route element={<Palettes />} path="/palettes" />
            <Route element={<Privacy />} path="/privacy" />
            <Route element={<Terms />} path="/terms" />
            <Route element={<AuthCallback />} path="/auth/callback" />
          </Routes>
        </Sentry.ErrorBoundary>
      </main>
      {!isAuthenticated && <Login />}
    </div>
  );
}
