'use client';

import { Divider } from '@heroui/react';

import usePaletteIdSync from '~/hooks/usePaletteIdSync';
import useUrlSync from '~/hooks/useUrlSync';

import AppIntro from '~/components/AppIntro';

import Palette from '../Palette';

import Panel from './Panel';

export default function Generator() {
  useUrlSync();
  usePaletteIdSync();

  return (
    <div
      className="flex flex-col md:flex-row flex-1 w-full max-w-432 mx-auto md:pb-18"
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
