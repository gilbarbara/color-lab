import type { Metadata } from 'next';

import { DEFAULT_PALETTE_NAME } from '~/config/globals';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '~/config/metadata';
import { getPaletteMeta } from '~/utils/metadata';
import { buildUrl, parsePaletteFromUrl } from '~/utils/url';

import Generator from '~/containers/Generator';

interface PalettePageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#webapp`,
      name: SITE_NAME,
      url: `${SITE_URL}/p`,
      description: SITE_DESCRIPTION,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      creator: { '@id': `${SITE_URL}/#creator` },
      publisher: { '@id': `${SITE_URL}/#creator` },
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#creator`,
      name: 'Gil Barbara',
      url: 'https://gilbarbara.dev',
      sameAs: ['https://github.com/gilbarbara'],
    },
  ],
};

const jsonLdHtml = JSON.stringify(jsonLd);

export async function generateMetadata({
  params,
  searchParams,
}: PalettePageProps): Promise<Metadata> {
  // `<title>`, `description`, and `robots` are intentionally NOT set here — every
  // generator URL inherits the root layout's brand title + description + `index`. Keeping
  // them identical across `/p` and `/p/...` means the client flip changes nothing
  // indexable → no duplicated head tags, no `noindex` injected onto the homepage. Only the
  // per-palette `og:*` differs (rich share cards); those stack harmlessly in the live DOM.
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return { alternates: { canonical: '/p' }, openGraph: { url: '/p' } };
  }

  const sp = await searchParams;
  const parsed = parsePaletteFromUrl(buildUrl(slug, sp));

  if (!parsed) {
    return { alternates: { canonical: '/p' }, openGraph: { url: '/p' } };
  }

  const { name } = parsed.state;
  const { description, title } = getPaletteMeta(parsed.state.colors, name);
  const fullTitle = `${title} — ColorMeUp LAB`;
  // Carry the optional palette name in the path (not a query param) so the OG route never
  // reads the Request and can stay statically cacheable.
  const ogImage =
    name && name !== DEFAULT_PALETTE_NAME
      ? `/og/${slug.join('/')}/~/${encodeURIComponent(name)}`
      : `/og/${slug.join('/')}`;

  return {
    alternates: { canonical: '/p' },
    openGraph: {
      title: fullTitle,
      description,
      url: '/p',
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
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: jsonLdHtml }} type="application/ld+json" />
      <Generator />
    </>
  );
}
