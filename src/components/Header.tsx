import type { ReactNode } from 'react';
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
  BookmarksIcon,
  MoonIcon,
  SignInIcon,
  SignOutIcon,
  SunIcon,
  UserIcon,
} from '@phosphor-icons/react';

import useAuth from '~/hooks/useAuth';
import usePalette from '~/hooks/usePalette';
import useTheme from '~/hooks/useTheme';
import { useAppStore } from '~/stores/appStore';

function className({ isActive }: NavLinkRenderProps) {
  return cn('text-foreground-500', { 'text-foreground': isActive });
}

export default function Header() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const { generatorUrl } = usePalette();
  const { openLoginModal } = useAppStore();
  const { min } = useBreakpoint();

  let inlineMenu: ReactNode = null;

  if (min('md')) {
    inlineMenu = (
      <div className="flex items-center gap-4 ml-8">
        <NavLink className={className} to="/palettes">
          My Palettes
        </NavLink>
        <NavLink className={className} to="/about">
          About
        </NavLink>
      </div>
    );
  }

  let menu = (
    <Button
      aria-label="Sign In"
      isIconOnly
      isLoading={isLoading}
      onPress={openLoginModal}
      startContent={!isLoading && <SignInIcon className="h-5 w-5" />}
      variant="light"
    />
  );

  if (isAuthenticated) {
    menu = (
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar
            as="button"
            className="transition-transform"
            name={user?.name || user?.email}
            showFallback
            size="sm"
          />
        </DropdownTrigger>
        <DropdownMenu aria-label="User menu">
          <DropdownItem
            key="profile"
            className="h-14 gap-2"
            isReadOnly
            startContent={<UserIcon className="h-4 w-4" />}
            textValue="Profile"
          >
            <p className="font-semibold">{user?.name || 'User'}</p>
            <p className="text-sm text-default-500">{user?.email}</p>
          </DropdownItem>
          {isDarkMode ? (
            <DropdownItem
              key="palettes"
              href="/palettes"
              startContent={<BookmarksIcon className="h-4 w-4" />}
            >
              My Palettes
            </DropdownItem>
          ) : null}
          <DropdownItem
            key="logout"
            color="danger"
            onPress={logout}
            startContent={<SignOutIcon className="h-4 w-4" />}
          >
            Sign Out
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 h-16 z-10 flex items-center bg-background border-b border-default"
      data-uid="Header"
    >
      <div className="flex items-center w-full max-w-7xl mx-auto px-4">
        <Link to={generatorUrl}>
          <h1 aria-label="ColorMeUp LAB" className="flex items-start gap-1">
            <img alt="Lab" className="h-6 md:h-8" src="/brand/logo.svg" />
            <span className="font-bold text-sm">LAB</span>
          </h1>
        </Link>
        {inlineMenu}
        <div className="flex items-center gap-2 ml-auto">
          <Button aria-label="Toggle dark mode" isIconOnly onPress={toggleDarkMode} variant="light">
            {isDarkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
          </Button>

          {menu}
        </div>
      </div>
    </header>
  );
}
