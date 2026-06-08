import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { convertCSS } from 'colorizr';
import { ImageResponse } from 'next/og';

import { parsePaletteFromUrl } from '~/utils/url';

export const runtime = 'nodejs';
// Read only `params` (never the Request) below, so the route is static-eligible and Next
// caches it instead of re-rendering (Satori + resvg) on every social unfurl.
export const dynamic = 'force-static';

const size = { width: 1200, height: 630 };

const logoDataUrl = `data:image/svg+xml;base64,${readFileSync(
  join(process.cwd(), 'public/brand/logo.svg'),
).toString('base64')}`;

interface RouteContext {
  params: Promise<{ slug: string[] }>;
}

function toHexSafe(value: string): string {
  try {
    return convertCSS(value, 'hex');
  } catch {
    return '#cccccc';
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;

  // Optional name is a trailing `~/<name>` path pair (see the /p page's generateMetadata).
  // Reading it from params instead of the query is what keeps this route static-cacheable.
  let segments = slug;
  let paletteName: string | null = null;
  const sep = slug.length - 2;

  if (sep >= 0 && slug[sep] === '~') {
    paletteName = slug[slug.length - 1];
    segments = slug.slice(0, sep);
  }

  const parsed = parsePaletteFromUrl(`/p/${segments.join('/')}`);

  const logo = (
    <div
      style={{
        display: 'flex',
        color: '#ccc',
        fontSize: '14px',
        gap: '1px',
      }}
    >
      <img alt="ColorMeUp" height={48} src={logoDataUrl} width={274} />
      <span>LAB</span>
    </div>
  );

  if (!parsed || parsed.state.colors.length === 0) {
    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#0a0a0a',
          color: '#fafafa',
          fontSize: 64,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {logo}
      </div>,
      size,
    );
  }

  const colors = parsed.state.colors.map(c => ({
    name: c.name,
    hexColor: toHexSafe(c.value),
  }));

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#0a0a0a',
      }}
    >
      <div style={{ display: 'flex', flex: 1 }}>
        {colors.map(color => (
          <div
            key={color.hexColor}
            style={{
              display: 'flex',
              flex: 1,
              background: color.hexColor,
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: 32,
              color: '#0a0a0a',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            <span>{color.name}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          padding: '16px',
          color: '#fafafa',
          fontSize: 36,
          fontWeight: 700,
          width: '100%',
        }}
      >
        {paletteName}
        {logo}
      </div>
    </div>,
    size,
  );
}
