import Generator from '~/containers/Generator';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lab.colormeup.co';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ColorMeUp LAB',
  url: SITE_URL,
  description:
    'A design tool for creating and fine-tuning perceptual color scales. Precise control over lightness, chroma, and scale behavior in OKLCH.',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const jsonLdHtml = JSON.stringify(jsonLd);

export default function HomePage() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: jsonLdHtml }} type="application/ld+json" />
      <Generator />
    </>
  );
}
