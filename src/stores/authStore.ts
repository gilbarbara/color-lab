import type { Models } from 'appwrite';
import { create } from 'zustand';

interface AuthState {
  error: string | null;
  status: AuthStatus;
  user: Models.User<Models.Preferences> | null;
}

interface AuthStateWithActions extends AuthState {
  reset: () => void;
  setError: (error: string | null) => void;
  setStatus: (status: AuthStatus) => void;
  setUser: (user: Models.User<Models.Preferences> | null) => void;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

export const useAuthStore = create<AuthStateWithActions>(set => ({
  ...initialState,

  setUser: (user): void =>
    set({
      user,
      status: user ? 'authenticated' : 'unauthenticated',
      error: null,
    }),

  setStatus: (status): void => set({ status }),

  setError: (error): void => set({ error }),

  reset: (): void => set(initialState),
}));
