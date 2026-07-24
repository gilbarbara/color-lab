import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '~/config/metadata';

/**
 * Stable JSON-LD node identifiers. The `#fragment` matters: `SITE_URL` names the *page*,
 * `SITE_URL/#webapp` names the *app the page describes*. Reusing the bare URL would assert
 * that the web page is the software.
 *
 * Every page emits the nodes it references so no `@id` dangles for a consumer that only sees
 * that page; consumers merge nodes sharing an `@id` across the site.
 */
export const SCHEMA_ID = {
  creator: `${SITE_URL}/#creator`,
  org: `${SITE_URL}/#org`,
  webapp: `${SITE_URL}/#webapp`,
  website: `${SITE_URL}/#website`,
} as const;

export const CREATOR_NODE = {
  '@type': 'Person',
  '@id': SCHEMA_ID.creator,
  name: 'Gil Barbara',
  url: 'https://gilbarbara.dev/',
  sameAs: ['https://github.com/gilbarbara'],
};

export const ORGANIZATION_NODE = {
  '@type': 'Organization',
  '@id': SCHEMA_ID.org,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/icon-512.png`,
};

export const WEBSITE_NODE = {
  '@type': 'WebSite',
  '@id': SCHEMA_ID.website,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { '@id': SCHEMA_ID.org },
  inLanguage: 'en',
};

/**
 * The product itself. `/p` and `/about` both emit this so they describe one entity instead of
 * two. `url` is `SITE_URL` rather than `/p` because Google canonicalised the cluster to `/`.
 * `sameAs` lists only the color-lab repo — colormeup.co and colorizr are different products,
 * and `sameAs` asserts identity, not affiliation.
 */
export const WEBAPP_NODE = {
  '@type': 'WebApplication',
  '@id': SCHEMA_ID.webapp,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  softwareVersion: process.env.NEXT_PUBLIC_APP_VERSION,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author: { '@id': SCHEMA_ID.creator },
  publisher: { '@id': SCHEMA_ID.org },
  sameAs: ['https://github.com/gilbarbara/color-lab'],
};

/**
 * Nodes every page includes so its `@id` references resolve locally. The app node is emitted
 * in full rather than as a bare `@id` stub: a partial `WebApplication` missing `offers` and
 * `applicationCategory` trips Google's software-app validation on any page read in isolation.
 */
export const SHARED_NODES = [WEBAPP_NODE, CREATOR_NODE, ORGANIZATION_NODE, WEBSITE_NODE];
