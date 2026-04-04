import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Spinner } from '@heroui/react';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

import { useAuthStore } from '~/stores/authStore';
import { auth } from '~/utils/firebase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setError } = useAuthStore();
  const [message, setMessage] = useState('Completing authentication...');

  useEffect(() => {
    const navigateBack = () => {
      const returnUrl = sessionStorage.getItem('authReturnUrl') || '/';

      navigate(returnUrl, { replace: true });
    };

    const handleCallback = async () => {
      // Handle Magic Link verification
      if (isSignInWithEmailLink(auth, window.location.href)) {
        setMessage('Verifying magic link...');

        const email = localStorage.getItem('emailForSignIn');

        if (!email) {
          setError('Please enter your email to complete sign-in');
          navigateBack();

          return;
        }

        try {
          await signInWithEmailLink(auth, email, window.location.href);
          localStorage.removeItem('emailForSignIn');
        } catch (error_) {
          setError(error_ instanceof Error ? error_.message : 'Magic link verification failed');
        }

        navigateBack();

        return;
      }

      // No magic link — just redirect back
      navigateBack();
    };

    handleCallback();
  }, [navigate, setError]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Spinner size="lg" />
      <p className="text-default-500">{message}</p>
    </div>
  );
}
