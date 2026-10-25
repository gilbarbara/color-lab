'use client';

import { useId, useMemo, useState } from 'react';
import { HueSlider, OKLCHPanel } from '@transience/color-picker';
import { parseCSS } from 'colorizr';
import Link from 'next/link';

import { SITE_URL } from '~/config/metadata';
import { clampOklchToP3, toOklch } from '~/utils/color';
import { createPalette } from '~/utils/generator';
import { buildArticleSchema } from '~/utils/schema';
import { serializePaletteToUrl } from '~/utils/url';

import Page from '~/components/Page';

import {
  CONTRAST_COMPARE_CHROMA,
  CONTRAST_COMPARE_HUES,
  CONTRAST_COMPARE_LIGHTNESS,
  CONTRAST_HOOK_COLOR,
  type ContrastMethod,
  getDisagreementBand,
  lcToPointer,
  pickText,
  TEXT_HEX,
  type TextColor,
  type TextPick,
  toOklchCSS,
} from './utils';

interface Oklch {
  c: number;
  h: number;
  l: number;
}

const FAQ = [
  {
    question: 'Which text color should go on my button?',
    answer:
      'On light and dark backgrounds, WCAG and APCA give the same answer, so use it. On mid-tones, from about OKLCH lightness 0.55 to 0.75 depending on hue and chroma, they split: WCAG picks black and APCA picks white. Put both versions side by side, as on this page, and use the one that reads better at your button’s size and weight.',
  },
  {
    question: 'What does Lc mean?',
    answer:
      'Lc is APCA’s lightness contrast score. It runs from 0, no contrast, to about 106 for black text on white and 108 for white text on black. Higher reads easier. It isn’t a ratio of two light levels like the WCAG number; it models how strong text looks against its background.',
  },
  {
    question: 'Why can Lc be negative?',
    answer:
      'The sign is the polarity. Positive means dark text on a lighter background; negative means light text on a darker one. The size of the number is the contrast, so compare absolute values: on #ff0044, white text scores Lc −69 and black scores Lc 40, so white wins.',
  },
];

const PAGE_PATH = '/apca-vs-wcag';
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;

// JSON-LD for the page; keep headline/description in sync with the visible copy when editing.
const JSON_LD = buildArticleSchema({
  headline: 'APCA vs WCAG',
  description:
    'WCAG 2 and APCA pick different text colors for a wide band of mid-tone backgrounds. Both picks, side by side.',
  keywords: ['APCA', 'WCAG', 'text contrast', 'color contrast', 'OKLCH'],
  image: '/og-apca-vs-wcag.png',
  path: PAGE_PATH,
  datePublished: '2026-10-24',
  dateModified: '2026-10-24',
  extraNodes: [
    {
      '@type': 'FAQPage',
      '@id': `${PAGE_URL}#faq`,
      isPartOf: { '@id': `${PAGE_URL}#article` },
      mainEntity: FAQ.map(({ answer, question }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ],
});

const jsonLdHtml = JSON.stringify(JSON_LD);

const generatorHref = serializePaletteToUrl(createPalette(toOklch(CONTRAST_HOOK_COLOR)));

const hookPick = pickText(CONTRAST_HOOK_COLOR);

// Clamped to P3 like every color the app mints (`toOklch`).
const COMPARE_SWATCHES = CONTRAST_COMPARE_HUES.map(h => {
  const css = toOklchCSS(
    clampOklchToP3({ l: CONTRAST_COMPARE_LIGHTNESS, c: CONTRAST_COMPARE_CHROMA, h }),
  );

  return { css, h, pick: pickText(css) };
});

const INITIAL_COLOR: Oklch = parseCSS(CONTRAST_HOOK_COLOR, 'oklch');

const other = (color: TextColor): TextColor => (color === 'black' ? 'white' : 'black');

const FLIP_LABELS: Array<{ label: string; method: ContrastMethod }> = [
  { label: 'WCAG flips', method: 'wcag' },
  { label: 'APCA flips', method: 'apca' },
];

function BandOverlay({ hue }: { hue: number }) {
  const hatchId = useId();
  const { anchors, bandPath } = useMemo(() => {
    const { cusp, edges, rows } = getDisagreementBand(hue);
    // Each side of the band, ordered by chroma, with the point where its flip meets the P3
    // edge merged in, so the band closes along the panel edge instead of cutting a chord.
    const side = (index: 0 | 1, method: ContrastMethod) =>
      [
        ...rows.flatMap(row => (row.band ? [{ c: row.c, l: row.band[index] }] : [])),
        ...(edges[method] ? [edges[method]] : []),
      ]
        .sort((a, b) => a.c - b.c)
        .map(({ c, l }) => lcToPointer(hue, l, c));
    // When the edge points sit on both sides of the cusp (one on the panel's right side, one
    // on its top), the band wraps the top-right corner.
    const wrapsCusp =
      !!edges.wcag && !!edges.apca && edges.wcag.l < cusp.l && cusp.l < edges.apca.l;
    const band = [
      ...side(0, 'wcag'),
      ...(wrapsCusp ? [lcToPointer(hue, cusp.l, cusp.c)] : []),
      ...side(1, 'apca').reverse(),
    ];
    // Labels sit at each flip on the neutral (C = 0) row: the same spot at every hue.
    const neutral = rows[0];

    const anchor = (method: ContrastMethod) => {
      const l = neutral?.[method];

      return l === null || l === undefined ? null : lcToPointer(hue, l, 0);
    };

    return {
      anchors: { apca: anchor('apca'), wcag: anchor('wcag') },
      bandPath: band.length ? `${toPath(band)} Z` : '',
    };
  }, [hue]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" data-testid="band-overlay">
      <svg className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <pattern
            height="2"
            id={hatchId}
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
            width="2"
          >
            <rect fill="rgba(255, 255, 255, 0.35)" height="2" width="1" />
            <rect fill="rgba(0, 0, 0, 0.35)" height="2" width="1" x="1" />
          </pattern>
        </defs>
        <path d={bandPath} fill={`url(#${hatchId})`} />
      </svg>
      {FLIP_LABELS.map(({ label, method }) =>
        anchors[method] ? (
          <span
            key={method}
            className="absolute left-1.5 mt-1.5 rounded-sm bg-black/75 px-1.5 py-0.5 text-xs leading-none font-medium text-white whitespace-nowrap"
            style={{ top: `${anchors[method].y}%` }}
          >
            {label}
          </span>
        ) : null,
      )}
    </div>
  );
}

function CompareRow({ method }: { method: ContrastMethod }) {
  return (
    <div>
      <p className="text-sm font-semibold mb-2">{method === 'wcag' ? 'WCAG' : 'APCA'} picks</p>
      <div className="grid grid-cols-9 gap-1">
        {COMPARE_SWATCHES.map(({ css, h, pick }) => (
          <div
            key={h}
            aria-label={`${css}, ${pick[method]} text`}
            className="flex items-center justify-center aspect-square lg:aspect-video rounded-md text-sm sm:text-lg font-semibold"
            role="img"
            style={{ backgroundColor: css, color: TEXT_HEX[pick[method]] }}
          >
            Aa
          </div>
        ))}
      </div>
    </div>
  );
}

function HookButton({ method }: { method: ContrastMethod }) {
  const color = hookPick[method];

  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-sm font-semibold">{method === 'wcag' ? 'WCAG' : 'APCA'} picks</span>
      <span
        className="inline-flex items-center h-12 px-4 sm:px-6 rounded-medium text-base sm:text-lg font-semibold whitespace-nowrap"
        data-testid={`hook-${method}`}
        style={{ backgroundColor: CONTRAST_HOOK_COLOR, color: TEXT_HEX[color] }}
      >
        Get started
      </span>
      <Readout method={method} pick={hookPick} />
    </div>
  );
}

function LargeSwatch({
  background,
  method,
  pick,
}: {
  background: string;
  method: ContrastMethod;
  pick: TextPick;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{method === 'wcag' ? 'WCAG' : 'APCA'} picks</span>
      <div
        className="flex flex-col justify-center gap-2 p-4 aspect-square sm:aspect-video lg:aspect-square rounded-medium"
        data-testid={`swatch-${method}`}
        style={{ backgroundColor: background, color: TEXT_HEX[pick[method]] }}
      >
        <span className="text-5xl font-semibold">Aa</span>
        <span className="text-base">The quick brown fox jumps over the lazy dog.</span>
      </div>
      <Readout method={method} pick={pick} />
    </div>
  );
}

function Readout({ method, pick }: { method: ContrastMethod; pick: TextPick }) {
  const chosen = pick[method];
  const format = (color: TextColor) =>
    method === 'wcag'
      ? `${pick.wcagRatio[color].toFixed(2)}:1`
      : `Lc ${Math.round(pick.apcaLc[color])}`;

  return (
    <p className="text-sm text-foreground-500">
      <span className="whitespace-nowrap">
        <span className="capitalize">{chosen}</span> {format(chosen)} ·
      </span>{' '}
      <span className="whitespace-nowrap">
        {other(chosen)} {format(other(chosen))}
      </span>
    </p>
  );
}

function toPath(points: Array<{ x: number; y: number }>) {
  return points.map(({ x, y }, index) => `${index ? 'L' : 'M'}${x},${y}`).join(' ');
}

export default function ApcaVsWcag() {
  const [color, setColor] = useState<Oklch>(INITIAL_COLOR);
  // The band costs a few milliseconds per hue; let the slider stay responsive while it catches up.
  const bandHue = color.h;

  const background = toOklchCSS(color);
  const pick = pickText(background);

  const handlePanelChange = (l: number, c: number) => {
    setColor(previous => ({ ...previous, c, l }));
  };

  const handleHueChange = (h: number) => {
    setColor(previous => clampOklchToP3({ ...previous, h }));
  };

  return (
    <Page data-testid="ApcaVsWcag">
      {/* eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml */}
      <script dangerouslySetInnerHTML={{ __html: jsonLdHtml }} type="application/ld+json" />
      <h1 className="text-3xl lg:text-4xl font-bold mb-8">APCA vs WCAG: black or white text?</h1>

      <div className="space-y-3 mb-8">
        <p>
          Ask WCAG 2 and APCA whether black or white text goes on a mid-tone background, and they
          often give opposite answers. Here is the same button, twice.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-8 mb-8">
        <HookButton method="wcag" />
        <HookButton method="apca" />
      </div>

      <div className="space-y-3 mb-8">
        <p>
          The two methods measure different things. <strong>WCAG 2</strong> compares how much light
          each color emits. <strong>APCA</strong> models how readable text looks, and it weighs dark
          and light colors differently, so light text on a mid-tone scores higher than WCAG’s ratio
          suggests.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Same color, two answers</h2>
      <p className="mb-6">
        Nine hues, all at OKLCH lightness {CONTRAST_COMPARE_LIGHTNESS}. Each swatch uses the text
        color the method picks. At this lightness the two methods disagree on every hue.
      </p>
      <div className="space-y-4 mb-8">
        <CompareRow method="wcag" />
        <CompareRow method="apca" />
      </div>

      <h2 className="text-2xl font-bold mb-4">Try it yourself</h2>
      <p className="mb-6">
        Drag through the panel. In the shaded band, WCAG picks black and APCA picks white. Below it
        both pick white; above it both pick black. Change the hue: the band shifts, but it never
        closes.
      </p>
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-8">
        <div className="flex flex-col gap-4 lg:w-1/2">
          <div className="relative rounded-medium overflow-hidden">
            <OKLCHPanel
              chroma={color.c}
              classNames={{ root: 'h-56 lg:h-80', thumb: 'z-10' }}
              hue={color.h}
              lightness={color.l}
              onChange={handlePanelChange}
              showSRGBBoundary={false}
            />
            <BandOverlay hue={bandHue} />
          </div>
          <HueSlider aria-label="Hue" onChange={handleHueChange} value={color.h} />
          <p className="text-sm text-foreground-500 font-mono">
            oklch({color.l.toFixed(3)} {color.c.toFixed(3)} {color.h.toFixed(1)})
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:w-1/2">
          <LargeSwatch background={background} method="wcag" pick={pick} />
          <LargeSwatch background={background} method="apca" pick={pick} />
        </div>
      </div>

      <div className="mb-8">
        <p>
          Lightness is easier to judge in a perceptual space; see{' '}
          <Link className="underline" href="/oklch-vs-hsl">
            OKLCH vs HSL
          </Link>{' '}
          for why, and{' '}
          <Link className="underline" href="/custom-color-scales">
            Custom Color Scales
          </Link>{' '}
          for building a scale around it.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Common questions</h2>
      <div className="space-y-6 mb-8">
        {FAQ.map(({ answer, question }) => (
          <div key={question}>
            <h3 className="text-lg font-semibold mb-1">{question}</h3>
            <p>{answer}</p>
          </div>
        ))}
      </div>

      <p>
        <Link
          className="inline-flex items-center h-10 py-2 px-4 leading-none bg-primary text-primary-foreground rounded-medium"
          href={generatorHref}
        >
          Open the Generator
        </Link>
      </p>
    </Page>
  );
}
