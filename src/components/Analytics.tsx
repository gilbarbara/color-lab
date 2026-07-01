'use client';

import { useEffect } from 'react';

import { initAnalytics } from '~/utils/analytics';

export default function Analytics() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return null;
}
