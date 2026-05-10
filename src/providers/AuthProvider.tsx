import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import * as Sentry from '@sentry/react';
import {
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import type { AuthError, User } from 'firebase/auth';

import AuthContext, { type AppUser, type OAuthProvider } from '~/contexts/auth';
import { useAuthStore } from '~/stores/authStore';
import { auth } from '~/utils/firebase';

interface AuthProviderProps {
  children: ReactNode;
}

const PROVIDER_STORAGE_KEY = 'colorLabAuthProvider';

function toAppUser(user: User): AppUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    providerData: user.providerData.map(p => ({
      providerId: p.providerId,
      photoURL: p.photoURL,
    })),
  };
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const {
    error,
    provider,
    setError,
    setPendingCredential,
    setProvider,
    setStatus,
    setUser,
    status,
    user,
  } = useAuthStore();

  // Listen for auth state changes (handles session restore + all sign-in/out)
  useEffect(() => {
    setStatus('loading');

    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        setUser(toAppUser(firebaseUser));
        setProvider(localStorage.getItem(PROVIDER_STORAGE_KEY) as OAuthProvider | null);
      } else {
        setUser(null);
        setProvider(null);
        localStorage.removeItem(PROVIDER_STORAGE_KEY);
      }
    });

    return unsubscribe;
  }, [setProvider, setStatus, setUser]);

  // Email/Password Login
  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setStatus('loading');

      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error_) {
        setStatus('unauthenticated');
        setError(error_ instanceof Error ? error_.message : 'Login failed');
        throw error_;
      }
    },
    [setStatus, setError],
  );

  // Email/Password Signup
  const signupWithEmail = useCallback(
    async (email: string, password: string, name?: string) => {
      setError(null);
      setStatus('loading');

      try {
        const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

        if (name) {
          await updateProfile(newUser, { displayName: name });
          setUser(toAppUser(newUser));
        }
      } catch (error_) {
        setStatus('unauthenticated');
        setError(error_ instanceof Error ? error_.message : 'Signup failed');
        throw error_;
      }
    },
    [setStatus, setError, setUser],
  );

  // OAuth Login (Google/GitHub)
  const loginWithOAuth = useCallback(
    async (oauthProvider: OAuthProvider) => {
      const authProvider =
        oauthProvider === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();

      localStorage.setItem(PROVIDER_STORAGE_KEY, oauthProvider);

      try {
        const result = await signInWithPopup(auth, authProvider);

        // If there's a pending credential from a prior linking attempt, link it now
        const credential = useAuthStore.getState().pendingCredential;

        if (credential) {
          try {
            await linkWithCredential(result.user, credential);
          } catch (error_) {
            Sentry.captureException(error_, { tags: { auth: 'link-credential' } });
          }

          setPendingCredential(null);
          setError(null);
        }
      } catch (error_: unknown) {
        const authError = error_ as AuthError;

        if (authError.code === 'auth/account-exists-with-different-credential') {
          const credential =
            oauthProvider === 'google'
              ? GoogleAuthProvider.credentialFromError(authError)
              : GithubAuthProvider.credentialFromError(authError);

          if (credential) {
            setPendingCredential(credential);
            const existing = oauthProvider === 'google' ? 'GitHub' : 'Google';

            setError(
              `This email is already linked to ${existing}. Sign in with ${existing} now to link both accounts.`,
            );

            return;
          }
        }

        localStorage.removeItem(PROVIDER_STORAGE_KEY);
        setError(error_ instanceof Error ? error_.message : 'OAuth login failed');
      }
    },
    [setError, setPendingCredential],
  );

  // Magic Link
  const sendMagicLink = useCallback(
    async (email: string) => {
      setError(null);

      try {
        const actionCodeSettings = {
          url: `${window.location.origin}/auth/callback`,
          handleCodeInApp: true,
        };

        sessionStorage.setItem('authReturnUrl', window.location.pathname + window.location.search);
        localStorage.setItem('emailForSignIn', email);
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
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
      await signOut(auth);
    } finally {
      localStorage.removeItem(PROVIDER_STORAGE_KEY);
      setUser(null);
    }
  }, [setUser]);

  const contextValue = useMemo(
    () => ({
      error,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading' || status === 'idle',
      loginWithEmail,
      loginWithOAuth,
      logout,
      provider,
      sendMagicLink,
      signupWithEmail,
      user,
    }),
    [
      error,
      loginWithEmail,
      loginWithOAuth,
      logout,
      provider,
      sendMagicLink,
      signupWithEmail,
      status,
      user,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
