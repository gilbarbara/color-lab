import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { ID, OAuthProvider } from 'appwrite';

import AuthContext, { type OAuthProvider as Provider } from '~/contexts/auth';
import { useAuthStore } from '~/stores/authStore';
import { account } from '~/utils/appwrite';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { error, setError, setStatus, setUser, status, user } = useAuthStore();

  // Session restoration on mount
  useEffect(() => {
    const restoreSession = async () => {
      setStatus('loading');

      try {
        const currentUser = await account.get();

        setUser(currentUser);
      } catch {
        // No valid session
        setUser(null);
      }
    };

    restoreSession();
  }, [setUser, setStatus]);

  // Email/Password Login
  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setStatus('loading');

      try {
        await account.createEmailPasswordSession({ email, password });
        const currentUser = await account.get();

        setUser(currentUser);
      } catch (error_) {
        setStatus('unauthenticated');
        setError(error_ instanceof Error ? error_.message : 'Login failed');
        throw error_;
      }
    },
    [setUser, setStatus, setError],
  );

  // Email/Password Signup
  const signupWithEmail = useCallback(
    async (email: string, password: string, name?: string) => {
      setError(null);
      setStatus('loading');

      try {
        await account.create({ userId: ID.unique(), email, password, name });
        // Auto-login after signup
        await account.createEmailPasswordSession({ email, password });
        const currentUser = await account.get();

        setUser(currentUser);
      } catch (error_) {
        setStatus('unauthenticated');
        setError(error_ instanceof Error ? error_.message : 'Signup failed');
        throw error_;
      }
    },
    [setUser, setStatus, setError],
  );

  // OAuth Login (Google/GitHub)
  const loginWithOAuth = useCallback((provider: Provider) => {
    const oauthProvider = provider === 'google' ? OAuthProvider.Google : OAuthProvider.Github;
    const successUrl = `${window.location.origin}/auth/callback`;
    const failureUrl = `${window.location.origin}/auth/callback?error=oauth_failed`;

    // This redirects the browser - no return value
    account.createOAuth2Session({
      provider: oauthProvider,
      success: successUrl,
      failure: failureUrl,
    });
  }, []);

  // Magic Link
  const sendMagicLink = useCallback(
    async (email: string) => {
      setError(null);

      try {
        const callbackUrl = `${window.location.origin}/auth/callback`;

        await account.createMagicURLToken({ userId: ID.unique(), email, url: callbackUrl });
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to send magic link');
        throw error_;
      }
    },
    [setError],
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await account.deleteSession({ sessionId: 'current' });
    } finally {
      setUser(null);
    }
  }, [setUser]);

  const contextValue = useMemo(
    () => ({
      user,
      isLoading: status === 'loading' || status === 'idle',
      isAuthenticated: status === 'authenticated',
      error,
      loginWithEmail,
      signupWithEmail,
      loginWithOAuth,
      sendMagicLink,
      logout,
    }),
    [user, status, error, loginWithEmail, signupWithEmail, loginWithOAuth, sendMagicLink, logout],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
