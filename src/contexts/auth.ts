import { createContext } from 'react';
import type { Models } from 'appwrite';

export type OAuthProvider = 'google' | 'github';

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
  user: Models.User<Record<string, string>> | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
