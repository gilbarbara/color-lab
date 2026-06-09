'use client';

import { type CSSProperties, useState } from 'react';
import Link from 'next/link';

import { SITE_NAME, SITE_URL } from '~/config/metadata';

import Page from '~/components/Page';

// Hues sampled around the wheel for the side-by-side comparison rows.
const HUES = [0, 40, 80, 120, 160, 200, 240, 280, 320];

// Lighten demo: same blue lightened in each space. HSL keeps hue 240 numerically
// but drifts toward periwinkle/purple as it lightens; OKLCH keeps hue 264 true.
const HSL_LIGHTNESS = [94, 78, 66, 54, 42, 21];
const OKLCH_LIGHTNESS = [0.94, 0.78, 0.66, 0.54, 0.42, 0.21];

// Shared endpoints for the gradient demo — only the interpolation space differs.
const GRADIENT_FROM = 'oklch(0.55 0.2 264)';
const GRADIENT_TO = 'oklch(0.86 0.17 95)';

const TERMS = [
  {
    term: 'HSL',
    expansion: 'hue, saturation, lightness',
    body: 'maps directly to how a screen mixes red, green, and blue light. It’s easy to read and write, but its “lightness” is a mathematical midpoint, not perceived brightness — so the same value looks very different from one hue to the next.',
  },
  {
    term: 'OKLCH',
    expansion: 'lightness, chroma, hue',
    body: 'is based on Oklab, a model of human vision. Its lightness tracks how bright a color actually looks, chroma controls intensity, and the hue stays put when you change the other two — exactly what you want when generating a scale.',
  },
];

const FAQ = [
  {
    question: 'Is OKLCH better than HSL?',
    answer:
      'For building color scales, yes — OKLCH keeps lightness and hue predictable, so the steps look evenly spaced. For a quick one-off tweak, HSL is still perfectly fine. They solve different problems.',
  },
  {
    question: 'Do all browsers support OKLCH?',
    answer:
      'Yes. Every major browser has supported the oklch() CSS function since 2023 (Chrome and Edge 111, Safari 15.4, Firefox 113). For older browsers you can ship a hex or RGB fallback alongside it.',
  },
  {
    question: 'Can I use OKLCH with Tailwind CSS?',
    answer:
      'Yes. Tailwind CSS v4 already defines its default palette in OKLCH, and you can drop oklch() values straight into your theme. This tool exports scales as Tailwind config, CSS variables, SCSS, and SVG.',
  },
];

const PAGE_URL = `${SITE_URL}/oklch-vs-hsl`;

// JSON-LD for the page; keep headline/description in sync with the visible copy when editing.
const JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'OKLCH vs HSL',
    description:
      'Why OKLCH beats HSL for color scales: perceptual lightness, hue stability, and cleaner gradients, compared side by side.',
    about: ['OKLCH', 'HSL', 'perceptual color', 'color scales'],
    mainEntityOfPage: PAGE_URL,
    url: PAGE_URL,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(({ answer, question }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  },
];

const jsonLdHtml = JSON.stringify(JSON_LD);

function Row({ colors }: { colors: string[] }) {
  return (
    <div className="grid grid-cols-9 gap-1">
      {colors.map(color => (
        <Swatch key={color} color={color} />
      ))}
    </div>
  );
}

function Swatch({ color, label }: { color: string; label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        aria-label={label ?? color}
        className="w-full aspect-square rounded-medium"
        style={{ background: color }}
      />
      {label && <span className="text-sm text-center">{label}</span>}
    </div>
  );
}

export default function OklchVsHsl() {
  const [hue, setHue] = useState(240);

  const hslPreview = `hsl(${hue} 100% 50%)`;
  const oklchPreview = `oklch(0.72 0.16 ${hue})`;

  return (
    <Page data-testid="OklchVsHsl">
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: jsonLdHtml }} type="application/ld+json" />
      <h1 className="text-4xl font-bold mb-8">OKLCH vs HSL: why perceptual color wins</h1>

      <div className="space-y-2 mb-8">
        <p>
          HSL and RGB describe colors the way a screen builds them, not the way an eye sees them.
          That gap is why a palette that looks balanced on paper can look uneven on screen: the same
          numbers produce wildly different perceived brightness from one hue to the next.
        </p>
        <p>
          <strong>OKLCH</strong> is built on a model of human perception. Lightness means the same
          thing across every hue, and changing one channel doesn’t quietly shift the others. That’s
          why this tool generates every scale in OKLCH — and the demos below show the difference
          directly.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">What each one actually means</h2>
      <div className="space-y-3 mb-8">
        {TERMS.map(({ body, expansion, term }) => (
          <p key={term}>
            <strong>{term}</strong> ({expansion}) {body}
          </p>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-4">Equal lightness ≠ equal brightness</h2>
      <div className="space-y-2 mb-6">
        <p>
          Every swatch below is set to the same lightness value within its own space. In HSL, yellow
          blazes while blue sinks into the dark — “50% lightness” means something different for
          every hue. In OKLCH, the row reads as one even band of brightness.
        </p>
      </div>
      <div className="space-y-4 mb-8">
        <div>
          <p className="text-sm font-semibold mb-2">
            HSL — <span className="font-mono">hsl(h 100% 50%)</span>
          </p>
          <Row colors={HUES.map(h => `hsl(${h} 100% 50%)`)} />
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">
            OKLCH — <span className="font-mono">oklch(0.72 0.16 h)</span>
          </p>
          <Row colors={HUES.map(h => `oklch(0.72 0.16 ${h})`)} />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Try it yourself</h2>
      <div className="space-y-2 mb-4">
        <p>
          Drag the hue. Both swatches stay at a fixed lightness — only the hue changes. Watch the
          HSL side lurch between bright and dark while OKLCH holds steady.
        </p>
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
        <div className="grid grid-cols-2 gap-4 lg:w-1/2">
          <Swatch color={hslPreview} label={hslPreview} />
          <Swatch color={oklchPreview} label={oklchPreview} />
        </div>
        <label className="w-full lg:w-1/2 flex flex-col gap-2" htmlFor="hue-slider">
          <span className="text-base font-bold">Hue: {hue}°</span>
          <input
            className="w-full"
            id="hue-slider"
            max={360}
            min={0}
            onChange={event => setHue(Number(event.target.value))}
            type="range"
            value={hue}
          />
        </label>
      </div>

      <h2 className="text-2xl font-bold mb-4">Lighten without the hue shift</h2>
      <div className="space-y-2 mb-6">
        <p>
          Take one blue and lighten it. In HSL, raising lightness drifts the color toward a washed
          periwinkle. In OKLCH, lightening keeps the hue and chroma intact — it stays blue all the
          way up.
        </p>
      </div>
      <div className="space-y-4 mb-8">
        <div>
          <p className="text-sm font-semibold mb-2">HSL</p>
          <div className="grid grid-cols-6 gap-2">
            {HSL_LIGHTNESS.map(l => (
              <Swatch key={l} color={`hsl(240 90% ${l}%)`} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">OKLCH</p>
          <div className="grid grid-cols-6 gap-2">
            {OKLCH_LIGHTNESS.map(l => (
              <Swatch key={l} color={`oklch(${l} 0.15 264)`} />
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Cleaner gradients</h2>
      <div className="space-y-2 mb-6">
        <p>
          Both gradients run between the same two colors. The HSL blend spikes through an
          over-bright cyan-green in the middle — the same uneven lightness from the first demo. The
          OKLCH blend keeps the brightness progression even from end to end.
        </p>
      </div>
      <div className="space-y-4 mb-8">
        <div>
          <p className="text-sm font-semibold mb-2">HSL interpolation</p>
          <div
            className="w-full h-16 rounded-medium"
            style={
              {
                background: `linear-gradient(to right in hsl, ${GRADIENT_FROM}, ${GRADIENT_TO})`,
              } as CSSProperties
            }
          />
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">OKLCH interpolation</p>
          <div
            className="w-full h-16 rounded-medium"
            style={
              {
                background: `linear-gradient(to right in oklch, ${GRADIENT_FROM}, ${GRADIENT_TO})`,
              } as CSSProperties
            }
          />
        </div>
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

      <p>That’s the whole idea: perceptual color makes scales predictable.</p>
      <p>
        Whether you’re building a design system, generating Tailwind palettes, creating design
        tokens, or refining UI colors, perceptual color helps scales stay balanced from start to
        finish.
      </p>

      <p className="mt-4">
        <Link
          className="inline-flex items-center h-10 py-2 px-4 leading-none bg-primary text-primary-foreground rounded-medium"
          href="/"
        >
          Create your OKLCH color scale
        </Link>
      </p>
    </Page>
  );
}
