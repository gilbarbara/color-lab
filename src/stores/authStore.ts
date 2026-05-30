import type { AuthCredential } from 'firebase/auth';
import { create } from 'zustand';

import type { AppUser, OAuthProvider } from '~/contexts/auth';

interface AuthState {
  error: string | null;
  pendingCredential: AuthCredential | null;
  provider: OAuthProvider | null;
  status: AuthStatus;
  user: AppUser | null;
}

interface AuthStateWithActions extends AuthState {
  setError: (error: string | null) => void;
  setPendingCredential: (credential: AuthCredential | null) => void;
  setProvider: (provider: OAuthProvider | null) => void;
  setStatus: (status: AuthStatus) => void;
  setUser: (user: AppUser | null) => void;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

const initialState: AuthState = {
  error: null,
  pendingCredential: null,
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

  setPendingCredential: (pendingCredential): void => set({ pendingCredential }),

  setProvider: (provider): void => set({ provider }),

  setStatus: (status): void => set({ status }),

  setError: (error): void => set({ error }),
}));
