// `/ssr` (not the root entry) because this is a server component: the root entry's IconBase
// calls useContext, which would force `use client` on the whole page for eight static SVGs.
import {
  ChartLineIcon,
  CircleHalfIcon,
  ExportIcon,
  EyeIcon,
  ListBulletsIcon,
  PaintBrushIcon,
  ShareIcon,
  SlidersHorizontalIcon,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import { SHARED_NODES } from '~/config/schema';

import Page from '~/components/Page';

// Describes the same `#webapp` entity as `/p`; the nodes live in `~/config/schema` so the two
// pages can't drift into describing two different products.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [...SHARED_NODES],
};

const jsonLdHtml = JSON.stringify(JSON_LD);

export default function About() {
  return (
    <Page data-testid="About">
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: jsonLdHtml }} type="application/ld+json" />
      <h1 className="text-4xl font-bold mb-8">ColorMeUp LAB</h1>

      <p className="mb-6">A design tool for creating and fine-tuning perceptual color scales.</p>

      <div className="space-y-2 mb-8">
        <p>
          It’s built for designers and developers who need control over how a{' '}
          <Link className="underline" href="/color-scale-vs-palette">
            color scale
          </Link>{' '}
          behaves — not a palette of swatches, but one color in every tone you need. You shape it
          directly and see the impact of each adjustment in real time.
        </p>

        <p>
          All calculations are done in the <strong>OKLCH</strong> color space, which makes it easier
          to reason about lightness and chroma independently and to generate scales that behave
          consistently across steps and different displays. This is especially important for UI
          work, where{' '}
          <Link className="underline" href="/oklch-vs-hsl">
            uneven jumps
          </Link>{' '}
          quickly become noticeable.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">What you can do</h2>

      <div className="space-y-3 mb-8">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-1">
            <SlidersHorizontalIcon className="text-lg" weight="bold" />
            Shape the scale
          </h3>
          <p>
            Lightness range and curve, chroma curve, hue shift, and 3–20 steps, in light, dark or
            reversed mode. Lock any step to anchor the ramp.
          </p>
          <p>
            Any color can carry its own curves, range, steps or mode, without touching the rest.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg flex items-center gap-1">
            <CircleHalfIcon className="text-lg" weight="bold" />
            Check contrast
          </h3>
          <p>
            Every step is measured with both WCAG and APCA, with a grid for pairing foreground and
            background steps.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg flex items-center gap-1">
            <EyeIcon className="text-lg" weight="bold" />
            Preview it on real UI
          </h3>
          <p>
            Put the palette onto buttons, cards, charts and typography, in light and dark, instead
            of judging swatches in isolation.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg flex items-center gap-1">
            <ChartLineIcon className="text-lg" weight="bold" />
            See the curves
          </h3>
          <p>
            Lightness, chroma and hue are plotted, so uneven jumps are visible instead of guessed
            at.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg flex items-center gap-1">
            <PaintBrushIcon className="text-lg" weight="bold" />
            Start with presets
          </h3>
          <p>
            Tailwind, Material, Bootstrap and Open Color presets reproduce how those systems
            distribute lightness and chroma.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg flex items-center gap-1">
            <ListBulletsIcon className="text-lg" weight="bold" />
            Build multiple scales
          </h3>
          <p>
            Up to ten colors, grouped as brand, neutral, semantic or decorative; kept in wide-gamut
            P3 where the display supports it.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg flex items-center gap-1">
            <ExportIcon className="text-lg" weight="bold" />
            Export it
          </h3>
          <p>
            Tailwind 3 and 4, CSS, SCSS and SVG, in the color format you work in. One scale or the
            whole palette.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg flex items-center gap-1">
            <ShareIcon className="text-lg" weight="bold" />
            Share it
          </h3>
          <p>
            Colors and settings both live in the URL, so sharing is copying the address bar. Signing
            in only adds saving.
          </p>
        </div>

        <p className="mt-4">
          See{' '}
          <Link className="underline" href="/custom-color-scales">
            Custom Color Scales
          </Link>{' '}
          to learn how to shape your own.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Accessible and open by design</h2>

      <div className="space-y-2 mb-8">
        <p>
          Many tools expose parts of this workflow, but rarely all of it in one place. Others lock
          more precise controls behind subscriptions, which doesn’t always make sense for designers
          and developers who only need this level of control occasionally.
        </p>

        <p>
          The goal here is to keep these controls available by default. This is a public, evolving
          tool you can return to when needed, without committing to a subscription or adapting your
          workflow around artificial limitations.
        </p>

        <p>
          Feedback is welcome, and the project is intentionally open. It’s a lab in the literal
          sense: a space to experiment with color, test assumptions, and refine how scales are
          built.
        </p>

        <p>
          Check out the repo at{' '}
          <a
            className="underline"
            href="https://github.com/gilbarbara/color-lab"
            rel="noopener noreferrer"
            target="_blank"
          >
            github.com/gilbarbara/color-lab
          </a>
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">ColorMeUp and colorizr</h2>

      <div className="space-y-4 mb-8">
        <p>
          Alongside this app, there’s also the original{' '}
          <a
            className="underline font-semibold"
            href="https://colormeup.co"
            rel="noopener noreferrer"
            target="_blank"
          >
            ColorMeUp
          </a>{' '}
          app. It’s a more exploratory tool, focused on inspecting colors, formats, and variations,
          and experimenting with different color models.
        </p>

        <p>
          Both apps are open source and built on top of{' '}
          <a
            className="underline font-semibold"
            href="https://github.com/gilbarbara/colorizr"
            rel="noopener noreferrer"
            target="_blank"
          >
            colorizr
          </a>
          , a shared library that handles perceptual color logic and scale generation. colorizr can
          also be used directly in code, independently of either UI.
        </p>
        <p>
          That's it. Jump into the generator, tweak your scales, and explore a bit. If you find it
          useful, starring the repos is appreciated.
        </p>
      </div>
      <p>
        <Link
          className="inline-flex items-center h-10 py-2 px-4 leading-none bg-primary text-primary-foreground rounded-medium"
          href="/"
        >
          Create your palette
        </Link>
      </p>
    </Page>
  );
}
