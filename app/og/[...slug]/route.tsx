import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { convertCSS } from 'colorizr';
import { ImageResponse } from 'next/og';

import { parsePaletteFromUrl } from '~/utils/url';

export const runtime = 'nodejs';

const size = { width: 1200, height: 630 };

// OG output is deterministic per palette URL, so let browsers and social scrapers cache it
// instead of re-rendering (Satori + resvg) on every unfurl.
const imageOptions = {
  ...size,
  headers: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
};

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

export async function GET({ url: requestUrl }: Request, { params }: RouteContext) {
  const { slug } = await params;
  const { searchParams } = new URL(requestUrl);
  const url = `/p/${slug.join('/')}`;
  const parsed = parsePaletteFromUrl(url);

  const paletteName = searchParams.get('name');

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
      imageOptions,
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
