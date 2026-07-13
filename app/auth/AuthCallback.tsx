'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@heroui/react';
import * as Sentry from '@sentry/nextjs';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { AUTH_RETURN_URL_KEY, EMAIL_FOR_SIGN_IN_KEY } from '~/config/globals';
import { useAuthStore } from '~/stores/authStore';
import { getFirebaseAuth } from '~/utils/firebase';

export default function AuthCallback() {
  const router = useRouter();
  const { setError } = useAuthStore();
  const [message, setMessage] = useState('Completing authentication...');

  useEffect(() => {
    const navigateBack = () => {
      const stored = sessionStorage.getItem(AUTH_RETURN_URL_KEY);
      const safe = stored && stored.startsWith('/') && !stored.startsWith('//') ? stored : '/';

      router.replace(safe);
    };

    const handleCallback = async () => {
      const auth = getFirebaseAuth();

      // Handle Magic Link verification
      if (isSignInWithEmailLink(auth, window.location.href)) {
        setMessage('Verifying magic link...');

        const email = localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);

        if (!email) {
          setError('Please enter your email to complete sign-in');
          navigateBack();

          return;
        }

        try {
          await signInWithEmailLink(auth, email, window.location.href);
          localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
        } catch (error_) {
          Sentry.captureException(error_, { tags: { auth: 'magic-link' } });
          setError(error_ instanceof Error ? error_.message : 'Magic link verification failed');
        }

        navigateBack();

        return;
      }

      // No magic link — just redirect back
      navigateBack();
    };

    handleCallback();
  }, [router, setError]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Spinner size="lg" />
      <p className="text-default-500">{message}</p>
    </div>
  );
}
