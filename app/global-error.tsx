'use client';

// global-error replaces the root layout entirely, so it must render its own
// <html>/<body> and re-import the global stylesheet the root layout would have
// provided.
import '~/index.css';

import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';

import ErrorFallback from '~/components/ErrorFallback';
import Logo from '~/components/Logo';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [eventId, setEventId] = useState<string>();

  useEffect(() => {
    setEventId(Sentry.captureException(error));
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen flex-col items-center justify-center py-6">
          <Logo isGray={false} />
          <ErrorFallback error={error} eventId={eventId} resetError={reset} />
        </div>
      </body>
    </html>
  );
}
