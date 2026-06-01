import userEvent from '@testing-library/user-event';

import { useAppStore } from '~/stores/appStore';
import { createTestPalette } from '~/test-fixtures';
import { getGeneratorStore, mockRouter } from '~/test-mocks';
import { fireEvent, render, screen } from '~/test-utils';
import { trackEvent } from '~/utils/analytics';

import Header from '~/components/Header';

const breakpointMock = vi.hoisted(() => ({
  min: vi.fn<(key: string) => boolean>(),
}));

vi.mock('@gilbarbara/hooks', async () => {
  const actual = await vi.importActual<typeof import('@gilbarbara/hooks')>('@gilbarbara/hooks');

  return {
    ...actual,
    useBreakpoint: () => ({ min: breakpointMock.min, max: vi.fn() }),
  };
});

const themeState = vi.hoisted(() => ({
  isDarkMode: false,
  toggleDarkMode: vi.fn(),
}));

vi.mock('~/hooks/useTheme', () => ({
  default: () => themeState,
}));

vi.mock('~/utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

function setDesktop() {
  breakpointMock.min.mockImplementation(() => true);
}

function setMobile() {
  breakpointMock.min.mockImplementation(() => false);
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    themeState.isDarkMode = false;
    setDesktop();
    getGeneratorStore().setState(createTestPalette(1));
    useAppStore.setState({
      paletteId: 'p1',
      paletteName: 'Saved',
      showLoginModal: false,
    });
  });

  describe('Render', () => {
    it('renders unauthenticated state at desktop breakpoint', () => {
      render(<Header />);

      expect(screen.getByTestId('Header')).toMatchSnapshot();
    });

    it('renders authenticated state at desktop breakpoint', () => {
      render(<Header />, {
        authState: {
          isAuthenticated: true,
          user: {
            displayName: 'Test User',
            email: 'test@example.com',
            providerData: [],
          },
        },
      });

      expect(screen.getByTestId('Header')).toMatchSnapshot();
    });

    it('renders mobile breakpoint with Menu dropdown', () => {
      setMobile();
      render(<Header />);

      expect(screen.getByTestId('Header')).toMatchSnapshot();
    });

    it('renders dark mode sun icon when isDarkMode is true', () => {
      themeState.isDarkMode = true;
      render(<Header />);

      expect(screen.getByRole('button', { name: 'Toggle dark mode' })).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('toggles dark mode and tracks event', () => {
      render(<Header />);

      fireEvent.click(screen.getByRole('button', { name: 'Toggle dark mode' }));

      expect(themeState.toggleDarkMode).toHaveBeenCalledOnce();
      expect(trackEvent).toHaveBeenCalledWith('dark-mode', { enabled: true });
    });

    it('mints a fresh palette URL on New Palette click and tracks event', () => {
      render(<Header />);

      // eslint-disable-next-line testing-library/no-node-access
      const button = screen.getByTestId('NewPalette').closest('button');

      fireEvent.click(button!);

      expect(useAppStore.getState().paletteId).toBeNull();
      expect(trackEvent).toHaveBeenCalledWith('new-palette');
      expect(mockRouter.push).toHaveBeenCalledWith(expect.stringMatching(/^\/p\//));
    });

    it('opens login modal on Sign In click when unauthenticated', () => {
      render(<Header />);

      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      expect(useAppStore.getState().showLoginModal).toBe(true);
    });

    it('logs out via user menu Sign Out item', async () => {
      const user = userEvent.setup();
      const mockLogout = vi.fn();

      render(<Header />, {
        authState: {
          isAuthenticated: true,
          user: { displayName: 'Test', email: 'a@b.c', providerData: [] },
          overrides: { logout: mockLogout },
        },
      });

      await user.click(screen.getByRole('button', { name: 'User Menu' }));

      const signOut = await screen.findByRole('menuitem', { name: /sign out/i });

      await user.click(signOut);

      expect(mockLogout).toHaveBeenCalledOnce();
      expect(trackEvent).toHaveBeenCalledWith('logout');
    });

    it('resolves provider photo when provider matches providerData entry', () => {
      render(<Header />, {
        authState: {
          isAuthenticated: true,
          provider: 'google',
          user: {
            displayName: 'Test',
            email: 'a@b.c',
            photoURL: 'https://fallback/avatar.png',
            providerData: [{ providerId: 'google.com', photoURL: 'https://google/avatar.png' }],
          },
        },
      });

      const avatar = screen.getByRole('button', { name: 'User Menu' });
      // eslint-disable-next-line testing-library/no-node-access
      const image = avatar.querySelector('img');

      expect(image).toHaveAttribute('src', 'https://google/avatar.png');
    });

    it('falls back to user.photoURL when provider has no matching providerData entry', () => {
      render(<Header />, {
        authState: {
          isAuthenticated: true,
          provider: 'google',
          user: {
            displayName: 'Test',
            email: 'a@b.c',
            photoURL: 'https://fallback/avatar.png',
            providerData: [],
          },
        },
      });

      const avatar = screen.getByRole('button', { name: 'User Menu' });
      // eslint-disable-next-line testing-library/no-node-access
      const image = avatar.querySelector('img');

      expect(image).toHaveAttribute('src', 'https://fallback/avatar.png');
    });
  });
});
