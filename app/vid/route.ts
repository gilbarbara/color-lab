import { createHmac } from 'node:crypto';

// Cookieless returning-visitor identity. We derive an anonymous distinct_id server-side from
// hash(secret, weekBucket + ip + userAgent) and hand it to posthog-js via bootstrap (see
// src/utils/analytics.ts). Nothing is stored on the device, so ePrivacy Art. 5(3) never triggers
// (no consent banner), and the /ingest proxy is untouched so PostHog GeoIP keeps working.
// Rotation is derived, not stored: the week number is part of the hashed input, so the id changes
// every 7 days with no salt store to rotate or delete.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 7-day bucket from epoch days. Boundary falls Thursday 00:00 UTC (epoch day 0 was a Thursday).
const weekBucket = () => Math.floor(Date.now() / 86_400_000 / 7);

export function GET(request: Request): Response {
  const secret = process.env.ANALYTICS_HASH_SECRET;
  // Cloudflare sets cf-connecting-ip with the real client IP; leftmost x-forwarded-for is the
  // Traefik fallback. With no real IP (e.g. local dev via portless) we return null so the client
  // keeps today's per-session behavior instead of bucketing every visitor into one shared hash.
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '';
  const userAgent = request.headers.get('user-agent') ?? '';

  const distinctID =
    secret && ip
      ? createHmac('sha256', secret)
          .update(`${weekBucket()}:${ip}:${userAgent}`)
          .digest('base64url')
      : null;

  return Response.json({ distinctID }, { headers: { 'cache-control': 'no-store' } });
}
