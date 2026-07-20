'use client';

import type { ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { usePathname } from 'next/navigation';

import { PALETTE_PATH_PREFIX } from '~/config/globals';
import useAuth from '~/hooks/useAuth';
import usePageTracking from '~/hooks/usePageTracking';
import AuthProvider from '~/providers/AuthProvider';
import ThemeProvider from '~/providers/ThemeProvider';

import ErrorFallback from '~/components/ErrorFallback';
import Header from '~/components/Header';
import Login from '~/components/Login';
import AppStoreSync from '~/containers/AppStoreSync';

interface ProvidersProps {
  children: ReactNode;
}

function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  usePageTracking();

  const routeKey =
    pathname === PALETTE_PATH_PREFIX || pathname.startsWith(`${PALETTE_PATH_PREFIX}/`)
      ? 'generator'
      : pathname;

  return (
    <div className="flex flex-col items-stretch min-h-screen">
      <AppStoreSync />
      <Header />
      <main className="flex flex-col not-print:pt-16 items-stretch flex-1">
        <Sentry.ErrorBoundary
          key={routeKey}
          fallback={({ error, eventId, resetError }) => (
            <ErrorFallback error={error} eventId={eventId} resetError={resetError} />
          )}
        >
          {children}
        </Sentry.ErrorBoundary>
      </main>
      {!isAuthenticated && <Login />}
    </div>
  );
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell>{children}</AppShell>
      </AuthProvider>
    </ThemeProvider>
  );
}
