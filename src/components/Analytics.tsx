'use client';

import Script from 'next/script';

import { flushAnalyticsQueue } from '~/utils/analytics';

export default function Analytics() {
  return (
    <Script
      data-auto-track="false"
      data-website-id="f44523f9-b201-4aa8-bc42-7600dcbf643d"
      onReady={flushAnalyticsQueue}
      src="https://cloud.umami.is/script.js"
      strategy="afterInteractive"
    />
  );
}
