import { Divider } from '@heroui/react';
import Link from 'next/link';

import { buildArticleSchema } from '~/utils/schema';

import Page from '~/components/Page';

import ScaleDemo from './ScaleDemo';
import {
  CHROMA,
  FLAT,
  generatorHref,
  HUE,
  LIGHTNESS,
  PRESET_VARIANTS,
  RANGE,
  RANGE_FULL,
  RANGE_MID,
  SWING,
} from './utils';

// JSON-LD for the page; keep headline/description in sync with the visible copy when editing.
const JSON_LD = buildArticleSchema({
  headline: 'Custom Color Scales in OKLCH',
  description:
    'Build custom color scales in OKLCH — shape lightness range, chroma and hue curves for perceptually even palettes, not flat generated tints.',
  keywords: [
    'OKLCH',
    'color scales',
    'perceptually uniform',
    'lightness range',
    'lightness curve',
    'chroma curve',
    'hue shift',
    'design systems',
  ],
  image: '/og-custom-color-scales.png',
  path: '/custom-color-scales',
  datePublished: '2026-06-22',
  dateModified: '2026-07-20',
});

const jsonLdHtml = JSON.stringify(JSON_LD);

export default function CustomColorScales() {
  return (
    <Page className="@container" data-testid="CustomColorScales">
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: jsonLdHtml }} type="application/ld+json" />
      <h1 className="text-3xl lg:text-4xl font-bold mb-2">Custom Color Scales in OKLCH</h1>
      <p className="text-xl text-foreground mb-8">Scales that don't look generated</p>

      <div className="space-y-3 mb-8">
        <p>
          A perceptually even color scale changes by the same amount at every step. In OKLCH, that
          evenness buys predictable contrast across every tint and shade — a palette you can trust —
          but it isn't the whole story. Hold chroma flat as the colors get lighter and the pale
          tints turn chalky; keep lightness linear and the scale reads mechanical. The math is
          right; it just stops a step short of intentional.
        </p>

        <p>
          Music production knows this trade-off. Quantize a drum pattern to a perfect grid and the
          timing is flawless and a little robotic; add some <i>swing</i>, nudging notes a little off
          the grid, and the feel returns without losing the structure.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">The Grid Is Not the Song</h2>
      <div className="space-y-3 mb-8">
        <p>
          A perceptually even scale is the grid: reliable, predictable, the thing worth keeping.
          Shaping it with chroma, hue, and lightness curves is the swing. The difference is easiest
          to just see:
        </p>
        <ScaleDemo variants={[FLAT, SWING]} />
      </div>

      <h2 className="text-2xl font-bold mb-4">Size the Grid, Then Shape It</h2>
      <div className="mb-8">
        <p>
          There are four levers: lightness range, lightness curve, chroma, and hue. The first sizes
          the grid; the other three are the swing on top of it. None require eyeballing OKLCH values
          in your head; that's what the charts are for. But it helps to know what each one is{' '}
          <b>for</b>.
        </p>

        <h3 className="text-xl font-bold mt-8 mb-2">Lightness Range</h3>
        <div className="space-y-3">
          <p>
            Before shaping anything, you decide how far the scale runs: how light the lightest tint,
            how dark the darkest shade. This is still even; you're not bending the grid, you're
            sizing it. And it's the lever that moves a scale most: the same color reads airy and
            delicate across a light range, dense and grounded across a dark one. It's the first
            move, and sometimes the only one you need.
          </p>
          <ScaleDemo
            stepLabel="lightness"
            swatchClassName="w-full py-2 h-auto! transition-colors duration-500"
            variants={[RANGE_MID, RANGE, RANGE_FULL]}
          />
        </div>

        <Divider className="my-8" />

        <h3 className="text-xl font-bold mb-2">Lightness Curve</h3>
        <div className="space-y-3">
          <p>
            Even with the endpoints fixed, <i>how</i> lightness travels between them changes
            everything. Spend your contrast on the dark end, and the scale feels grounded and
            dramatic. Spread it evenly, and it feels calm. Pack it into the mid-tones, and it feels
            energetic: punchy UI colors, soft extremes. Same two anchors, three personalities.
          </p>
          <ScaleDemo chart="lightness" variants={[LIGHTNESS]} />
        </div>

        <Divider className="my-8" />

        <h3 className="text-xl font-bold mb-2">Chroma Curve</h3>
        <div className="space-y-3">
          <p>
            When chroma stays flat as lightness climbs, the pale tints carry more color than they
            should and turn chalky. A chroma curve fixes it: ease chroma down toward the highlights
            so tints stay clean, and let it peak in the upper-mid range, where a color has room to
            be vivid. It's the same correction the old{' '}
            <Link className="underline" href="/oklch-vs-hsl">
              HSL
            </Link>{' '}
            habit of dropping saturation made by feel, now something you can place on purpose.
          </p>
          <p className="text-sm text-foreground-500">
            The chart traces three things: the chroma curve you ask for, the{' '}
            <a
              className="underline"
              href="https://www.w3.org/TR/css-color-4/#gamut-mapping"
              rel="noopener noreferrer"
              target="_blank"
            >
              gamut ceiling
            </a>{' '}
            the display can render, and the output where the two meet.
          </p>
          <ScaleDemo chart="chroma" variants={[CHROMA]} />
        </div>

        <Divider className="my-8" />

        <h3 className="text-xl font-bold mb-2">Hue Shift</h3>
        <div className="space-y-3">
          <p>
            Colors rarely sit on a single hue across a full range, and pinning them there is part of
            what makes a scale feel synthetic. A small, controlled shift adds depth: cool the
            highlights a few degrees, warm the shadows, and the scale gains a sense of light moving
            through it. Keep it subtle — enough to feel, not enough to turn your blue into teal at
            one end.
          </p>
          <ScaleDemo chart="hue" variants={[HUE]} />
        </div>

        <Divider className="my-8" />
      </div>

      <h2 className="text-2xl font-bold mb-4">Why Great Color Systems Don't Look Identical</h2>
      <div className="space-y-3 mb-8">
        <p>
          Perceptually even scales don't produce one correct answer. Tailwind, Material, Bootstrap,
          and Open Color all solve the same problem and land somewhere different.
        </p>
        <p>
          The reason is simple: consistency is half the job. A design system is also trying to
          create a feeling. Some palettes read as energetic, others as calm; some keep vibrant
          midtones, others reserve intensity for the darks. Those are taste, made concrete. A
          perceptual color space doesn't remove those decisions. It gives taste something steady to
          act on.
        </p>
        <p>The same base color, shaped by presets inspired by popular design systems:</p>
        <ScaleDemo variants={PRESET_VARIANTS} />
      </div>

      <h2 className="text-2xl font-bold mb-4">Bring Back the Fun</h2>
      <div className="space-y-3 mb-8">
        <p>
          You saw the ceiling in the chroma chart, which marks the limit of what the display can
          render. The math holds you inside what's renderable, so nothing you do produces a broken
          or muddy palette. The constraint lets you push every lever without fear; it's scaffolding,
          not a cage.
        </p>
        <p>
          So the goal was never to <i>generate</i> a scale, but to <i>make</i> one. That's where
          taste lives, and where the fun is.
          <br />
          The real playground is the{' '}
          <Link className="underline" href={generatorHref}>
            OKLCH color palette generator
          </Link>
          , or step back to{' '}
          <Link className="underline" href="/color-scale-vs-palette">
            Color Scale vs Palette
          </Link>
          .
        </p>
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
