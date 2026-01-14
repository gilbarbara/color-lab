/* eslint-disable import-x/export, react-refresh/only-export-components */
import { type ReactElement, type ReactNode, useMemo } from 'react';
import { MemoryRouter } from 'react-router';
import { render, type RenderOptions } from '@testing-library/react';

import AuthContext, { type AuthContextType } from '~/contexts/auth';
import ThemeProvider from '~/providers/ThemeProvider';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authState?: MockAuthState;
  initialEntries?: string[];
}

export interface MockAuthState {
  error?: string | null;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  user?: { $id?: string; email?: string; name?: string } | null;
}

const defaultAuthState: MockAuthState = {
  error: null,
  isAuthenticated: false,
  isLoading: false,
  user: null,
};

interface MockAuthProviderProps {
  authState?: MockAuthState;
  children: ReactNode;
}

function createWrapper(authState?: MockAuthState, initialEntries?: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeProvider>
          <MockAuthProvider authState={authState}>{children}</MockAuthProvider>
        </ThemeProvider>
      </MemoryRouter>
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
      sendMagicLink: vi.fn(),
      signupWithEmail: vi.fn(),
      user: mergedState.user as AuthContextType['user'],
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
