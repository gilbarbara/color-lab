import { renderHook } from '@testing-library/react';

import usePageTracking from '~/hooks/usePageTracking';
import { setMockRoute } from '~/test-mocks';
import { trackPage } from '~/utils/analytics';

// Keep the real normalizePathname (drives the fire/skip + dedup logic); only
// stub trackPage so we can assert when a pageview is sent.
vi.mock('~/utils/analytics', async importOriginal => {
  const actual = await importOriginal<typeof import('~/utils/analytics')>();

  return {
    ...actual,
    trackPage: vi.fn(),
  };
});

describe('hooks/usePageTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    '/',
    '/about',
    '/palettes',
    '/privacy',
    '/terms',
    '/custom-color-scales',
    '/oklch-vs-hsl',
    '/unknown',
    '/p/Primary-FF0044',
    '/p/anything',
  ])('fires a pageview on %s', pathname => {
    setMockRoute(pathname);
    renderHook(() => usePageTracking());

    expect(trackPage).toHaveBeenCalledTimes(1);
    expect(trackPage).toHaveBeenCalledWith();
  });

  it.each(['/auth/callback'])('does not track %s', pathname => {
    setMockRoute(pathname);
    renderHook(() => usePageTracking());

    expect(trackPage).not.toHaveBeenCalled();
  });

  it('fires once across palette path changes', () => {
    setMockRoute('/p/Primary-71_0.2_143');
    const { rerender } = renderHook(() => usePageTracking());

    setMockRoute('/p/Primary-72_0.2_143');
    rerender();

    expect(trackPage).toHaveBeenCalledTimes(1);
  });

  it('fires again when the normalized page changes', () => {
    setMockRoute('/p/Primary-71_0.2_143');
    const { rerender } = renderHook(() => usePageTracking());

    setMockRoute('/about');
    rerender();

    expect(trackPage).toHaveBeenCalledTimes(2);
  });
});
