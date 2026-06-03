import { DEFAULT_PALETTE_NAME } from '~/config/globals';

import type { ColorEntry } from '~/types';

/**
 * Derive the raw SEO title + description for a palette from its colors.
 * Uses the palette `name` as the title when set (non-default); otherwise falls
 * back to the joined color names. The title omits any branding suffix — callers
 * add it where needed.
 */
export function getPaletteMeta(
  colors: ColorEntry[],
  name?: string,
): { description: string; title: string } {
  const names = colors.map(color => color.name).join(', ');
  const title = name && name !== DEFAULT_PALETTE_NAME ? name : names || 'Palette';
  const description = `Color palette with ${colors.length} ${colors.length === 1 ? 'color' : 'colors'}: ${names}.`;

  return { description, title };
}
