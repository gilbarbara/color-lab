'use client';

import { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { SignInIcon, SignOutIcon, UserIcon } from '@phosphor-icons/react';

import useApp from '~/hooks/useApp';
import useAuth from '~/hooks/useAuth';
import { trackEvent } from '~/utils/analytics';

const providerIdMap: Record<string, string> = { google: 'google.com', github: 'github.com' };

export default function UserMenu() {
  const { isAuthenticated, isLoading, logout, provider, user } = useAuth();
  const { closeLoginModal, openLoginModal } = useApp('closeLoginModal', 'openLoginModal');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render the Sign In button on the server and the first client paint (mounted === false),
  // so the markup matches before Firebase restores the session client-side. Checking !mounted
  // first keeps it immune to auth state flipping during concurrent hydration. isLoading is also
  // gated on mounted: it is auth-derived and differs between server (idle) and client, so the
  // loading state is only reflected after mount to keep the button's markup identical.
  if (!mounted || !isAuthenticated) {
    const loading = mounted && isLoading;

    return (
      <Button
        aria-label="Sign In"
        isIconOnly
        isLoading={loading}
        onPress={openLoginModal}
        size="sm"
        startContent={!loading && <SignInIcon className="h-5 w-5" />}
        variant="light"
      />
    );
  }

  const providerPhoto =
    provider && user?.providerData.find(p => p.providerId === providerIdMap[provider])?.photoURL;
  const imageUrl = providerPhoto ?? user?.photoURL ?? undefined;

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
}
