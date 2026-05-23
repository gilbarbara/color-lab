import { Link, NavLink, type NavLinkRenderProps } from 'react-router';
import { useBreakpoint } from '@gilbarbara/hooks';
import {
  Avatar,
  Button,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import {
  CaretDownIcon,
  MoonIcon,
  PlusIcon,
  SignInIcon,
  SignOutIcon,
  SunIcon,
  UserIcon,
} from '@phosphor-icons/react';

import { BREAKPOINTS } from '~/config/globals';
import useApp from '~/hooks/useApp';
import useAuth from '~/hooks/useAuth';
import usePalette from '~/hooks/usePalette';
import useTheme from '~/hooks/useTheme';
import { trackEvent } from '~/utils/analytics';

function navLinkClassName({ isActive }: NavLinkRenderProps) {
  return cn('text-sm text-foreground-500', { 'text-foreground': isActive });
}

export default function Header() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { isAuthenticated, isLoading, logout, provider, user } = useAuth();
  const { generatorUrl } = usePalette('generatorUrl');
  const { clearPalette, closeLoginModal, openLoginModal } = useApp(
    'clearPalette',
    'closeLoginModal',
    'openLoginModal',
  );
  const { min } = useBreakpoint(BREAKPOINTS);

  const handleClickDarkMode = () => {
    trackEvent('dark-mode', { enabled: !isDarkMode });
    toggleDarkMode();
  };

  const isMedium = min('md');
  const isSmall = min('sm');

  const providerIdMap: Record<string, string> = { google: 'google.com', github: 'github.com' };

  const providerPhoto =
    provider && user?.providerData.find(p => p.providerId === providerIdMap[provider])?.photoURL;
  const imageUrl = providerPhoto ?? user?.photoURL ?? undefined;

  const renderNavigation = () => (
    <div className="flex items-center gap-2 md:gap-4 ml-4 md:ml-8">
      <Button
        as={NavLink}
        className="text-sm"
        isIconOnly={!isSmall}
        onPress={() => {
          clearPalette();
          trackEvent('new-palette');
        }}
        size="sm"
        startContent={<PlusIcon />}
        to="/"
        variant="flat"
      >
        <span className="hidden xs:inline-flex">{isMedium ? 'New Palette' : 'New'}</span>
      </Button>
      {isMedium ? (
        <>
          <NavLink className={navLinkClassName} to="/palettes">
            My Palettes
          </NavLink>
          <NavLink className={navLinkClassName} to="/about">
            About
          </NavLink>
        </>
      ) : (
        <Dropdown placement="bottom">
          <DropdownTrigger>
            <Button
              className="text-sm text-foreground-500"
              endContent={<CaretDownIcon />}
              size="sm"
              variant="light"
            >
              Menu
            </Button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem key="palettes" href="/palettes">
              My Palettes
            </DropdownItem>
            <DropdownItem key="about" href="/about">
              About
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      )}
    </div>
  );

  const renderUserMenu = () => {
    if (!isAuthenticated) {
      return (
        <Button
          aria-label="Sign In"
          isIconOnly
          isLoading={isLoading}
          onPress={openLoginModal}
          startContent={!isLoading && <SignInIcon className="h-5 w-5" />}
          variant="light"
        />
      );
    }

    return (
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar
            aria-label="User Menu"
            as="button"
            className="transition-transform"
            name={user?.displayName ?? undefined}
            showFallback
            size="sm"
            src={imageUrl}
          />
        </DropdownTrigger>
        <DropdownMenu aria-label="User menu">
          <DropdownItem
            key="profile"
            className="h-14 gap-2"
            isReadOnly
            startContent={<UserIcon className="size-4" />}
            textValue="Profile"
          >
            <p className="font-semibold">{user?.displayName || 'User'}</p>
            <p className="text-sm text-default-500">{user?.email}</p>
          </DropdownItem>
          <DropdownItem
            key="logout"
            color="danger"
            onPress={() => {
              trackEvent('logout');
              closeLoginModal();
              logout();
            }}
            startContent={<SignOutIcon className="size-4" />}
          >
            Sign Out
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 h-16 z-20 flex items-center bg-background border-b border-default"
      data-testid="Header"
    >
      <div className="flex items-center w-full max-w-432 mx-auto px-4">
        <h1 aria-label="ColorMeUp LAB" className="flex shrink-0">
          <Link aria-label="Home" className="inline-flex items-start gap-1" to={generatorUrl}>
            <img
              alt="ColorMeUp"
              className="h-8"
              src={isMedium ? '/brand/logo.svg' : '/brand/icon.svg'}
            />
            <span className="font-bold text-sm">LAB</span>
          </Link>
        </h1>

        {renderNavigation()}

        <div className="flex items-center gap-2 ml-auto">
          <Button
            aria-label="Toggle dark mode"
            isIconOnly
            onPress={handleClickDarkMode}
            variant="light"
          >
            {isDarkMode ? <SunIcon className="size-6" /> : <MoonIcon className="size-6" />}
          </Button>
          {renderUserMenu()}
        </div>
      </div>
    </header>
  );
}
