import type { Metadata } from 'next';

import { getPaletteMeta } from '~/utils/metadata';
import { buildUrl, canonicalizeUrl, parsePaletteFromUrl } from '~/utils/url';

import Generator from '~/containers/Generator';

interface PalettePageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PalettePageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const url = buildUrl(slug, sp);
  const parsed = parsePaletteFromUrl(url);

  if (!parsed) {
    return {
      title: 'Palette',
      alternates: { canonical: url },
    };
  }

  const { description, title } = getPaletteMeta(parsed.state.colors);
  const fullTitle = `${title} — ColorMeUp LAB`;
  const canonical = canonicalizeUrl(url);
  const ogImage = `/og/${slug.join('/')}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

export const dynamic = 'force-dynamic';

export default function PalettePage() {
  return <Generator />;
}
