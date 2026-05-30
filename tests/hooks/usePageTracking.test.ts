import { renderHook } from '@testing-library/react';

import usePageTracking from '~/hooks/usePageTracking';
import { setMockRoute } from '~/test-mocks';
import { trackPage } from '~/utils/analytics';

vi.mock('~/utils/analytics', () => ({
  trackPage: vi.fn(),
}));

describe('hooks/usePageTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['/', '/'],
    ['/about', '/about'],
    ['/palettes', '/palettes'],
    ['/privacy', '/privacy'],
    ['/terms', '/terms'],
    ['/p/Primary-FF0044', '/generator'],
    ['/p/anything', '/generator'],
  ])('tracks %s as %s', (pathname, tracked) => {
    setMockRoute(pathname);
    renderHook(() => usePageTracking());

    expect(trackPage).toHaveBeenCalledWith(tracked);
  });

  it.each(['/auth/callback', '/unknown'])('does not track %s', pathname => {
    setMockRoute(pathname);
    renderHook(() => usePageTracking());

    expect(trackPage).not.toHaveBeenCalled();
  });
});
