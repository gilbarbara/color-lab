import { SITE_URL } from '~/config/metadata';
import { SCHEMA_ID, SHARED_NODES } from '~/config/schema';

interface ArticleSchemaInput {
  /** ISO date, e.g. `2026-07-20`. */
  dateModified: string;
  datePublished: string;
  description: string;
  /** Extra `@graph` siblings, e.g. a `FAQPage`. */
  extraNodes?: object[];
  headline: string;
  /** OG image path, e.g. `/og-oklch-vs-hsl.png`. Absolutised against `SITE_URL`. */
  image: string;
  keywords: string[];
  /** Canonical path, e.g. `/oklch-vs-hsl`. */
  path: string;
}

/**
 * Build the complete `@graph` for a content article.
 *
 * `about` points at the app node rather than holding keyword strings — schema.org `about`
 * expects a Thing, and this is the statement that ties each article to the product it
 * documents. The keyword strings move to `keywords`, where they belong.
 */
export function buildArticleSchema({
  dateModified,
  datePublished,
  description,
  extraNodes = [],
  headline,
  image,
  keywords,
  path,
}: ArticleSchemaInput) {
  const pageUrl = `${SITE_URL}${path}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${pageUrl}#article`,
        headline,
        description,
        keywords,
        about: { '@id': SCHEMA_ID.webapp },
        image: `${SITE_URL}${image}`,
        mainEntityOfPage: pageUrl,
        url: pageUrl,
        author: { '@id': SCHEMA_ID.creator },
        publisher: { '@id': SCHEMA_ID.org },
        isPartOf: { '@id': SCHEMA_ID.website },
        inLanguage: 'en',
        datePublished,
        dateModified,
      },
      ...extraNodes,
      ...SHARED_NODES,
    ],
  };
}
