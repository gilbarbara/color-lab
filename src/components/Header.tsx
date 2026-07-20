'use client';

import { Button, cn, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { CaretDownIcon, MoonIcon, PlusIcon, SunIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import useApp from '~/hooks/useApp';
import useTheme from '~/hooks/useTheme';
import { trackEvent } from '~/utils/analytics';
import { createPalette } from '~/utils/generator';
import { serializePaletteToUrl } from '~/utils/url';

import Logo from '~/components/Logo';
import NavLink, { type NavLinkRenderProps } from '~/components/NavLink';
import UserMenu from '~/components/UserMenu';

function navLinkClassName({ isActive }: NavLinkRenderProps) {
  return cn('text-sm text-foreground-500', { 'text-foreground': isActive });
}

export default function Header() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { clearPalette, sessionPalettePath } = useApp('clearPalette', 'sessionPalettePath');

  const handleClickDarkMode = () => {
    trackEvent('app:theme', { value: isDarkMode ? 'light' : 'dark' });
    toggleDarkMode();
  };

  const handleNewPalette = () => {
    clearPalette();
    trackEvent('palette:create');
    // Mint a fresh palette and make its URL the source of truth; the generator route
    // hydrates the store from it. Works from any route, no reliance on `/`.
    router.push(serializePaletteToUrl(createPalette()));
  };

  const renderNavigation = () => (
    <div className="flex items-center gap-2 md:gap-4 ml-4 md:ml-8">
      <Button
        aria-label="New Palette"
        className="text-sm max-xs:button-menu-square"
        onPress={handleNewPalette}
        size="sm"
        startContent={<PlusIcon />}
        variant="flat"
      >
        <span className="hidden xs:inline-flex sm:hidden">New</span>
        <span className="hidden sm:inline-flex">New Palette</span>
      </Button>
      <nav aria-label="Main" className="contents">
        <div className="hidden sm:contents">
          <NavLink className={navLinkClassName} to="/palettes">
            My Palettes
          </NavLink>
          <NavLink className={navLinkClassName} to="/about">
            About
          </NavLink>
        </div>
        <div className="contents sm:hidden">
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
        </div>
      </nav>
    </div>
  );

  return (
    <header
      className="fixed top-0 left-0 right-0 h-16 z-20 flex items-center bg-background border-b border-default print:hidden"
      data-testid="Header"
    >
      <div className="flex items-center w-full max-w-432 mx-auto px-4">
        <Link className="inline-flex shrink-0" href={sessionPalettePath ?? '/'}>
          <Logo />
        </Link>

        {renderNavigation()}

        <div className="flex items-center gap-2 ml-auto">
          <Button
            aria-label="Toggle dark mode"
            isIconOnly
            onPress={handleClickDarkMode}
            variant="light"
          >
            <SunIcon className="size-6 hidden dark:block" />
            <MoonIcon className="size-6 block dark:hidden" />
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
