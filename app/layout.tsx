import '~/index.css';

import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_TITLE,
  SITE_URL,
} from '~/config/metadata';

import Analytics from '~/components/Analytics';

import Providers from './providers';

const inter = Inter({
  axes: ['opsz'],
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s — ColorMeUp LAB',
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  icons: {
    icon: { url: '/favicon.svg', type: 'image/svg+xml' },
    apple: '/brand/icon-192.png',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: '/',
    images: [
      {
        url: SITE_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'ColorMeUp LAB — perceptual color scale generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#cccccc' },
    { media: '(prefers-color-scheme: dark)', color: '#343434' },
  ],
};

const gamutBootstrap = `(function(){try{var p3=window.matchMedia('(color-gamut: p3)').matches;var state=null;var raw=localStorage.getItem('color-lab');if(raw){try{state=JSON.parse(raw)?.state;}catch(e){}}var root=document.documentElement;var gamut=(state&&state.gamut)||(p3?'p3':'srgb');root.setAttribute('data-gamut',gamut);root.setAttribute('data-p3-supported',p3?'true':'false');function flag(v,d){return (typeof v==='boolean'?v:d)?'open':'closed';}root.setAttribute('data-sidebar',flag(state&&state.showSidebar,true));root.setAttribute('data-preview',flag(state&&state.showPreview,true));root.setAttribute('data-color-options',flag(state&&state.showColorOptionsPanel,false));root.setAttribute('data-palette-options',flag(state&&state.showPaletteOptionsPanel,false));}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: gamutBootstrap }} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
