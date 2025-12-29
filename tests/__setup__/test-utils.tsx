/* eslint-disable import-x/export, react-refresh/only-export-components */
import { type ReactElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { render, type RenderOptions } from '@testing-library/react';

import ThemeProvider from '~/providers/ThemeProvider';

interface WrapperProps {
  children: ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  return (
    <MemoryRouter>
      <ThemeProvider>{children}</ThemeProvider>
    </MemoryRouter>
  );
}

const customRender = (ui: ReactElement, options?: RenderOptions): ReturnType<typeof render> =>
  render(ui, {
    wrapper: AllProviders,
    ...options,
  });

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
