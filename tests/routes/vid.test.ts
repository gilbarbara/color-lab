import { GET } from '../../app/vid/route';

async function getBody(response: Response): Promise<{ distinctID: string | null }> {
  return (await response.json()) as { distinctID: string | null };
}

function makeRequest(headers: Record<string, string>): Request {
  return new Request('https://color-lab.localhost/vid', { headers });
}

describe('app/vid route', () => {
  const originalSecret = process.env.ANALYTICS_HASH_SECRET;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-09T12:00:00Z'));
    process.env.ANALYTICS_HASH_SECRET = 'test-secret';
  });

  afterEach(() => {
    vi.useRealTimers();

    if (originalSecret === undefined) {
      delete process.env.ANALYTICS_HASH_SECRET;
    } else {
      process.env.ANALYTICS_HASH_SECRET = originalSecret;
    }
  });

  it('returns a stable id within the same week for the same ip + user-agent', async () => {
    const headers = { 'cf-connecting-ip': '1.2.3.4', 'user-agent': 'UA' };

    const first = await getBody(GET(makeRequest(headers)));

    vi.setSystemTime(new Date('2026-07-11T09:00:00Z')); // later, same week bucket
    const second = await getBody(GET(makeRequest(headers)));

    expect(first.distinctID).toBeTruthy();
    expect(first.distinctID).toBe(second.distinctID);
  });

  it('rotates the id across the weekly boundary', async () => {
    const headers = { 'cf-connecting-ip': '1.2.3.4', 'user-agent': 'UA' };

    const before = await getBody(GET(makeRequest(headers)));

    vi.setSystemTime(new Date('2026-07-20T12:00:00Z')); // +11 days → different bucket
    const after = await getBody(GET(makeRequest(headers)));

    expect(after.distinctID).toBeTruthy();
    expect(after.distinctID).not.toBe(before.distinctID);
  });

  it('produces different ids for different ips', async () => {
    const a = await getBody(
      GET(makeRequest({ 'cf-connecting-ip': '1.2.3.4', 'user-agent': 'UA' })),
    );
    const b = await getBody(
      GET(makeRequest({ 'cf-connecting-ip': '5.6.7.8', 'user-agent': 'UA' })),
    );

    expect(a.distinctID).not.toBe(b.distinctID);
  });

  it('falls back to the leftmost x-forwarded-for when cf-connecting-ip is absent', async () => {
    const viaXff = await getBody(
      GET(makeRequest({ 'x-forwarded-for': '1.2.3.4, 9.9.9.9', 'user-agent': 'UA' })),
    );
    const viaCf = await getBody(
      GET(makeRequest({ 'cf-connecting-ip': '1.2.3.4', 'user-agent': 'UA' })),
    );

    expect(viaXff.distinctID).toBe(viaCf.distinctID);
  });

  it('returns null when the secret is unset', async () => {
    delete process.env.ANALYTICS_HASH_SECRET;

    const body = await getBody(GET(makeRequest({ 'cf-connecting-ip': '1.2.3.4' })));

    expect(body.distinctID).toBeNull();
  });

  it('returns null when there is no client ip', async () => {
    const body = await getBody(GET(makeRequest({ 'user-agent': 'UA' })));

    expect(body.distinctID).toBeNull();
  });

  it('marks the response no-store', () => {
    const response = GET(makeRequest({ 'cf-connecting-ip': '1.2.3.4' }));

    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
