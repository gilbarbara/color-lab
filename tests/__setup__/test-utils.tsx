/* eslint-disable import-x/export */
import { type ReactElement, type ReactNode, useMemo } from 'react';
import { render, type RenderOptions } from '@testing-library/react';

import AuthContext, { type AuthContextType } from '~/contexts/auth';
import ThemeProvider from '~/providers/ThemeProvider';

import { setMockRoute } from './mocks';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authState?: MockAuthState;
  initialEntries?: string[];
}

export interface MockAuthState {
  error?: string | null;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  overrides?: Partial<AuthContextType>;
  provider?: AuthContextType['provider'];
  user?: MockAuthUser | null;
}

export interface MockAuthUser {
  displayName?: string;
  email?: string;
  photoURL?: string | null;
  providerData?: AuthContextType['user'] extends infer U
    ? U extends { providerData: infer P }
      ? P
      : never
    : never;
  uid?: string;
}

const defaultAuthState: MockAuthState = {
  error: null,
  isAuthenticated: false,
  isLoading: false,
  provider: null,
  user: null,
};

interface MockAuthProviderProps {
  authState?: MockAuthState;
  children: ReactNode;
}

function createWrapper(authState?: MockAuthState, initialEntries?: string[]) {
  if (initialEntries && initialEntries.length > 0) {
    setMockRoute(initialEntries[0]);
  } else {
    setMockRoute('/');
  }

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider>
        <MockAuthProvider authState={authState}>{children}</MockAuthProvider>
      </ThemeProvider>
    );
  };
}

function MockAuthProvider(props: MockAuthProviderProps) {
  const { authState, children } = props;

  const mergedState = useMemo(() => ({ ...defaultAuthState, ...authState }), [authState]);

  const value = useMemo<AuthContextType>(
    () => ({
      error: mergedState.error ?? null,
      isAuthenticated: mergedState.isAuthenticated ?? false,
      isLoading: mergedState.isLoading ?? false,
      loginWithEmail: vi.fn(),
      loginWithOAuth: vi.fn(),
      logout: vi.fn(),
      provider: mergedState.provider ?? null,
      sendMagicLink: vi.fn(),
      signupWithEmail: vi.fn(),
      user: mergedState.user as AuthContextType['user'],
      ...mergedState.overrides,
    }),
    [mergedState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions,
): ReturnType<typeof render> => {
  const { authState, initialEntries, ...renderOptions } = options ?? {};

  return render(ui, {
    wrapper: createWrapper(authState, initialEntries),
    ...renderOptions,
  });
};

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
