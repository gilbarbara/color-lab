import { redirect } from 'next/navigation';

import { PALETTE_PATH_PREFIX } from '~/config/globals';

export const dynamic = 'force-dynamic';

// `/` has no content of its own — send every visitor to the stable `/p` (the indexable anchor).
// The concrete, shareable palette URL (`/p/<slug>`) is written client-side by `useUrlSync` once the
// server-seeded random palette is on screen, so the server never manufactures a fresh palette URL per
// crawl (which is what flooded Search Console). Bare `/p` renders a random palette and canonicals to
// itself; every shared palette URL canonicals back to it.
export default function HomePage() {
  redirect(PALETTE_PATH_PREFIX);
}
