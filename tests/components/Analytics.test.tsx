import { mockIsP3Supported } from '~/test-mocks';
import { render } from '~/test-utils';
import { initAnalytics, trackEvent } from '~/utils/analytics';

import Analytics from '~/components/Analytics';

vi.mock('~/utils/analytics', () => ({
  initAnalytics: vi.fn(),
  trackEvent: vi.fn(),
}));

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes analytics and tracks app:display on mount', () => {
    render(<Analytics />);

    expect(initAnalytics).toHaveBeenCalledOnce();
    expect(trackEvent).toHaveBeenCalledWith('app:display', { p3_supported: true });
  });

  it('reports p3_supported: false when Display P3 is unavailable', () => {
    mockIsP3Supported.mockReturnValue(false);

    render(<Analytics />);

    expect(trackEvent).toHaveBeenCalledWith('app:display', { p3_supported: false });
  });

  it('does not re-fire on re-render (empty deps)', () => {
    const { rerender } = render(<Analytics />);

    rerender(<Analytics />);

    expect(initAnalytics).toHaveBeenCalledOnce();
    expect(trackEvent).toHaveBeenCalledOnce();
  });
});
