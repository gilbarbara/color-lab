import { redirect } from 'next/navigation';

import { createPalette } from '~/utils/generator';
import { serializePaletteToUrl } from '~/utils/url';

export const dynamic = 'force-dynamic';

// `/` has no content of its own. Generate a random palette and redirect to its URL on the
// server (307 — temporary, since the target changes each visit) before any HTML renders.
// The browser lands directly on `/p/Primary-…` as a single clean SSR render → no client
// flip, no duplicated head tags. Bare `/p` stays a real 200 page (the indexable anchor);
// every palette URL canonicals back to it.
export default function HomePage() {
  redirect(serializePaletteToUrl(createPalette()));
}
