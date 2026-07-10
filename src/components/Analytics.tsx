'use client';

import { useEffect } from 'react';

import { initAnalytics, trackEvent } from '~/utils/analytics';
import { isP3Supported } from '~/utils/gamut';

export default function Analytics() {
  useEffect(() => {
    initAnalytics();
    trackEvent('app:display', { p3_supported: isP3Supported() });
  }, []);

  return null;
}
