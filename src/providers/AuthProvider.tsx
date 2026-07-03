import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import * as Sentry from '@sentry/nextjs';
import type { Auth, AuthError, User } from 'firebase/auth';

import AuthContext, { type AppUser, type OAuthProvider } from '~/contexts/auth';
import { useAuthStore } from '~/stores/authStore';
import { identifyUser, resetUser } from '~/utils/analytics';
import { getAuthErrorMessage } from '~/utils/auth-errors';

interface AuthProviderProps {
  children: ReactNode;
}

const PROVIDER_STORAGE_KEY = 'colorLabAuthProvider';

// Load the Firebase auth SDK + our auth instance lazily, off the first-load
// bundle. Memoized so every consumer (session-restore effect + each sign-in
// callback) shares one import. `firebase/auth` and `~/utils/firebase` are only
// ever reached through this dynamic import on the generator path.
type AuthSdk = typeof import('firebase/auth');
let authBundle: Promise<{ auth: Auth; sdk: AuthSdk }> | undefined;

function loadAuth() {
  authBundle ??= Promise.all([import('firebase/auth'), import('~/utils/firebase')])
    .then(([sdk, { getFirebaseAuth }]) => ({ sdk, auth: getFirebaseAuth() }))
    .catch((error: unknown) => {
      // Don't cache a transient failure (offline / ad-block / chunk load) — clear the
      // memo so the next consumer retries instead of inheriting the rejection forever.
      authBundle = undefined;
      throw error;
    });

  return authBundle;
}

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

  // Listen for auth state changes (handles session restore + all sign-in/out).
  // Firebase is dynamic-imported after paint (requestIdleCallback) to keep it
  // off the first-load path. `setStatus('loading')` stays synchronous so the
  // saved-palette id flow (usePaletteIdSync) keeps waiting — status must never
  // read `unauthenticated` before onAuthStateChanged has run once.
  useEffect(() => {
    setStatus('loading');

    let unsubscribe = () => {};

    let cancelled = false;

    const start = () => {
      loadAuth()
        .then(({ auth, sdk }) => {
          if (cancelled) {
            return;
          }

          unsubscribe = sdk.onAuthStateChanged(auth, firebaseUser => {
            if (firebaseUser) {
              setUser(toAppUser(firebaseUser));
              setProvider(localStorage.getItem(PROVIDER_STORAGE_KEY) as OAuthProvider | null);
              identifyUser(firebaseUser.uid, {
                email: firebaseUser.email,
                name: firebaseUser.displayName,
              });
            } else {
              setUser(null);
              setProvider(null);
              localStorage.removeItem(PROVIDER_STORAGE_KEY);
              resetUser();
            }
          });
        })
        .catch(() => {
          // Firebase failed to load (offline / ad-blocker). Treat as signed out
          // so the UI settles instead of spinning forever.
          if (!cancelled) {
            setUser(null);
          }
        });
    };

    const canIdle = typeof window !== 'undefined' && 'requestIdleCallback' in window;
    const idleId = canIdle ? window.requestIdleCallback(start) : undefined;
    const timeoutId = canIdle ? undefined : setTimeout(start, 200);

    return () => {
      cancelled = true;

      if (idleId !== undefined) {
        window.cancelIdleCallback(idleId);
      }

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      unsubscribe();
    };
  }, [setProvider, setStatus, setUser]);

  // Email/Password Login
  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setStatus('loading');

      try {
        const { auth, sdk } = await loadAuth();

        await sdk.signInWithEmailAndPassword(auth, email, password);
      } catch (error_) {
        setStatus('unauthenticated');
        setError(getAuthErrorMessage(error_, 'Login failed'));
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
        const { auth, sdk } = await loadAuth();
        const { user: newUser } = await sdk.createUserWithEmailAndPassword(auth, email, password);

        if (name) {
          await sdk.updateProfile(newUser, { displayName: name });
          setUser(toAppUser(newUser));
        }
      } catch (error_) {
        setStatus('unauthenticated');
        setError(getAuthErrorMessage(error_, 'Signup failed'));
        throw error_;
      }
    },
    [setStatus, setError, setUser],
  );

  // OAuth Login (Google/GitHub)
  const loginWithOAuth = useCallback(
    async (oauthProvider: OAuthProvider) => {
      localStorage.setItem(PROVIDER_STORAGE_KEY, oauthProvider);

      let sdk: AuthSdk;
      let auth: Auth;

      try {
        ({ auth, sdk } = await loadAuth());
      } catch (error_) {
        localStorage.removeItem(PROVIDER_STORAGE_KEY);
        setError(getAuthErrorMessage(error_, 'OAuth login failed'));

        return;
      }

      const authProvider =
        oauthProvider === 'google' ? new sdk.GoogleAuthProvider() : new sdk.GithubAuthProvider();

      try {
        const result = await sdk.signInWithPopup(auth, authProvider);

        // If there's a pending credential from a prior linking attempt, link it now
        const credential = useAuthStore.getState().pendingCredential;

        if (credential) {
          try {
            await sdk.linkWithCredential(result.user, credential);
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
              ? sdk.GoogleAuthProvider.credentialFromError(authError)
              : sdk.GithubAuthProvider.credentialFromError(authError);

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
        setError(getAuthErrorMessage(error_, 'OAuth login failed'));
      }
    },
    [setError, setPendingCredential],
  );

  // Magic Link
  const sendMagicLink = useCallback(
    async (email: string) => {
      setError(null);

      try {
        const { auth, sdk } = await loadAuth();
        const actionCodeSettings = {
          url: `${window.location.origin}/auth/callback`,
          handleCodeInApp: true,
        };

        sessionStorage.setItem('authReturnUrl', window.location.pathname + window.location.search);
        localStorage.setItem('emailForSignIn', email);
        await sdk.sendSignInLinkToEmail(auth, email, actionCodeSettings);
      } catch (error_) {
        setError(getAuthErrorMessage(error_, 'Failed to send magic link'));
        throw error_;
      }
    },
    [setError],
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      const { auth, sdk } = await loadAuth();

      await sdk.signOut(auth);
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
