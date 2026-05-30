import type { JSX } from 'react';
import { Button } from '@heroui/react';

import { trackEvent } from '~/utils/analytics';

import Feedback from '~/components/Feedback';

interface ErrorFallbackProps {
  error: unknown;
  eventId?: string;
  resetError: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}

export default function ErrorFallback({
  error,
  eventId,
  resetError,
}: ErrorFallbackProps): JSX.Element {
  const handleReset = (): void => {
    trackEvent('error-action', { action: 'reset' });
    resetError();
  };

  const handleReload = (): void => {
    trackEvent('error-action', { action: 'reload' });
    window.location.reload();
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4" data-testid="ErrorFallback">
      <Feedback
        description="An unexpected error occurred. Try again or reload the page."
        title="Something went wrong"
        type="error"
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button color="primary" onPress={handleReset}>
            Try again
          </Button>
          <Button onPress={handleReload} variant="flat">
            Reload page
          </Button>
        </div>
        {eventId && (
          <p className="mt-4 text-xs text-default-500" data-testid="ErrorFallback-reference">
            Reference: <code className="font-mono">{eventId}</code>
          </p>
        )}
        {process.env.NODE_ENV !== 'production' && (
          <pre
            className="mt-4 max-h-64 overflow-auto rounded-md bg-default-100 p-3 text-left text-xs whitespace-pre-wrap"
            data-testid="ErrorFallback-details"
          >
            {getErrorMessage(error)}
          </pre>
        )}
      </Feedback>
    </div>
  );
}
