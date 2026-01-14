import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { MoonIcon, SignOutIcon, SunIcon, UserIcon } from '@phosphor-icons/react';

import { useAuth } from '~/hooks/useAuth';
import { useTheme } from '~/hooks/useTheme';

import Login from './Login';

export default function Header() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { isAuthenticated, logout, user } = useAuth();

  let menu = <Login />;

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
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4">
        <h1 aria-label="ColorMeUp LAB" className="flex items-start gap-1">
          <img alt="Lab" className="h-8" src="/brand/logo.svg" />
          <span className="font-bold text-sm">LAB</span>
        </h1>
        <div className="flex items-center gap-2">
          <Button aria-label="Toggle dark mode" isIconOnly onPress={toggleDarkMode} variant="light">
            {isDarkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
          </Button>

          {menu}
        </div>
      </div>
    </header>
  );
}
