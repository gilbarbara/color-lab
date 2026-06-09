import type { Metadata } from 'next';

import { DEFAULT_PALETTE_NAME } from '~/config/globals';
import { SITE_NAME, SITE_OG_IMAGE } from '~/config/metadata';

import type { ColorEntry } from '~/types';

interface StaticMetaInput {
  description: string;
  /** Canonical path, e.g. `/about`. */
  path: string;
  robots?: Metadata['robots'];
  /** Page title without the brand suffix, e.g. `About`. */
  title: string;
}

/**
 * Build a complete metadata block for a static page. Sets `openGraph`/`twitter`
 * explicitly because Next does not derive them from `title`/`description`, and a
 * page-level `openGraph` replaces the parent's wholesale — so the brand image
 * must be included here or it would be dropped.
 */
export function buildStaticMetadata({
  description,
  path,
  robots,
  title,
}: StaticMetaInput): Metadata {
  const fullTitle = `${title} — ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    ...(robots ? { robots } : {}),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url: path,
      images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [SITE_OG_IMAGE],
    },
  };
}

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
