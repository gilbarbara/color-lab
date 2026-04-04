import { createContext } from 'react';

export type OAuthProvider = 'google' | 'github';

export interface AppUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerData: Array<{ photoURL: string | null; providerId: string }>;
  uid: string;
}

export interface AuthContextType {
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => void;
  logout: () => Promise<void>;
  provider: OAuthProvider | null;
  sendMagicLink: (email: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  user: AppUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
