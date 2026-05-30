import type { ColorEntry } from '~/types';

/**
 * Derive the raw SEO title + description for a palette from its colors.
 * The title omits any branding suffix — callers add it where needed.
 */
export function getPaletteMeta(colors: ColorEntry[]): { description: string; title: string } {
  const names = colors.map(color => color.name).join(', ');
  const title = names || 'Palette';
  const description = `Color palette with ${colors.length} ${colors.length === 1 ? 'color' : 'colors'}: ${names}.`;

  return { description, title };
}
