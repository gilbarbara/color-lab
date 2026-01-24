import type { Models } from 'appwrite';
import { create } from 'zustand';

import type { OAuthProvider } from '~/contexts/auth';

interface AuthState {
  error: string | null;
  provider: OAuthProvider | null;
  status: AuthStatus;
  user: Models.User<Models.Preferences> | null;
}

interface AuthStateWithActions extends AuthState {
  reset: () => void;
  setError: (error: string | null) => void;
  setProvider: (provider: OAuthProvider | null) => void;
  setStatus: (status: AuthStatus) => void;
  setUser: (user: Models.User<Models.Preferences> | null) => void;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

const initialState: AuthState = {
  error: null,
  provider: null,
  status: 'idle',
  user: null,
};

export const useAuthStore = create<AuthStateWithActions>(set => ({
  ...initialState,

  setUser: (user): void =>
    set({
      user,
      status: user ? 'authenticated' : 'unauthenticated',
      error: null,
    }),

  setProvider: (provider): void => set({ provider }),

  setStatus: (status): void => set({ status }),

  setError: (error): void => set({ error }),

  reset: (): void => set(initialState),
}));
