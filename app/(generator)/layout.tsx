import type { ReactNode } from 'react';

import GeneratorStoreProvider from '~/providers/GeneratorStoreProvider';
import { createPalette } from '~/utils/generator';

import ScrollLock from '~/containers/Generator/ScrollLock';

export default function GeneratorLayout({ children }: { children: ReactNode }) {
  // Generate the fallback palette once on the server so the client reuses the same
  // serialized value during hydration. Generating it independently on both sides
  // (random color + uuid) is what caused the hydration mismatch on routes without a
  // palette in the URL. Scoped to the generator routes (`/`, `/p/*`); static pages
  // never mount the provider, so they prerender without `useSearchParams`.
  const fallbackPalette = createPalette();

  return (
    <GeneratorStoreProvider fallbackPalette={fallbackPalette}>
      <ScrollLock />
      {children}
      {/* Viewport-fixed portal target for HeroUI overlays (patched default in
          @react-aria/overlays). Keeps overlay flip math viewport-relative while
          ScrollLock pins `body`, which would otherwise offset it. See docs/palette.md. */}
      <div className="overlay-root" id="overlay-root" />
    </GeneratorStoreProvider>
  );
}
