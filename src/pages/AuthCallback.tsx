import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Spinner } from '@heroui/react';

import { useAuthStore } from '~/stores/authStore';
import { account } from '~/utils/appwrite';
import { syncUserAvatar } from '~/utils/oauth';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setError, setProvider, setStatus, setUser } = useAuthStore();
  const [message, setMessage] = useState('Completing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error');
      const userId = searchParams.get('userId');
      const secret = searchParams.get('secret');

      // Handle OAuth failure
      if (error) {
        setError('Authentication failed');
        navigate('/', { replace: true });

        return;
      }

      // Handle Magic Link verification
      if (userId && secret) {
        setMessage('Verifying magic link...');

        try {
          await account.createSession({ userId, secret });
          const currentUser = await account.get();

          setUser(currentUser);
          navigate('/', { replace: true });

          return;
        } catch (error_) {
          setError(error_ instanceof Error ? error_.message : 'Magic link verification failed');
          navigate('/', { replace: true });

          return;
        }
      }

      // Handle OAuth success (session already created by Appwrite)
      try {
        const currentUser = await account.get();

        setUser(currentUser);

        const session = await account.getSession({ sessionId: 'current' });

        if (session.provider === 'google' || session.provider === 'github') {
          setProvider(session.provider);
        }

        // Sync avatar in background (don't block navigation)
        syncUserAvatar(account)
          .then(async () => {
            const updatedUser = await account.get();

            setUser(updatedUser);
          })
          .catch(() => {});
      } catch {
        setStatus('unauthenticated');
      }

      navigate('/', { replace: true });
    };

    handleCallback();
  }, [searchParams, navigate, setError, setProvider, setStatus, setUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Spinner size="lg" />
      <p className="text-default-500">{message}</p>
    </div>
  );
}
