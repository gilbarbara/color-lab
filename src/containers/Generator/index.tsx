'use client';

import { Divider } from '@heroui/react';

import useGroupFilterSync from '~/hooks/useGroupFilterSync';
import usePaletteIdSync from '~/hooks/usePaletteIdSync';
import useUrlSync from '~/hooks/useUrlSync';

import AppIntro from '~/components/AppIntro';

import Palette from '../Palette';

import Panel from './Panel';

export default function Generator() {
  // Order matters: usePaletteIdSync must run before useUrlSync. On a fresh no-id
  // navigation it clears the stale in-memory palette identity first, so useUrlSync's
  // hydrate doesn't resurrect the previous palette's id onto the new URL. Its clear
  // is synchronous, so useUrlSync (next) reads the already-cleared appStore.
  usePaletteIdSync();
  useUrlSync();
  // Retires group filters whose group no longer exists — runs here, not in GroupToolbar,
  // because that unmounts in preview view and the filter would survive unpruned.
  useGroupFilterSync();

  return (
    <div
      className="flex flex-col md:flex-row flex-1 w-full max-w-432 mx-auto pb-18 md:pb-0"
      data-testid="Generator"
    >
      <div className="contents md:hidden">
        <AppIntro />
        <Divider />
      </div>
      <Panel />
      <Palette />
    </div>
  );
}
