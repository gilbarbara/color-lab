import Image from 'next/image';
import Link from 'next/link';

import { SITE_NAME, SITE_URL } from '~/config/metadata';

import Page from '~/components/Page';

import {
  generatorHref,
  PALETTE_SWATCHES,
  SCALE_SWATCHES,
  TABLE_COLUMNS,
  TABLE_ROWS,
  TOOLS,
} from './utils';

const PAGE_URL = `${SITE_URL}/color-scale-vs-palette`;

// JSON-LD for the page; keep headline/description in sync with the visible copy when editing.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Color Scale vs Palette: 6 scale generators, compared',
  description:
    'What a color scale is, how it differs from a palette, and how six tools that build one (tints.dev, uicolors, Leonardo, Huetone, hihayk, ColorMeUp Lab) compare.',
  about: [
    'color scale generator',
    'color scale vs palette',
    'OKLCH',
    '50-950',
    'design systems',
    'Tailwind CSS',
    'WCAG',
    'APCA',
  ],
  mainEntityOfPage: PAGE_URL,
  url: PAGE_URL,
  author: { '@type': 'Person', name: 'Gil Barbara', url: 'https://gilbarbara.dev/' },
  publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  datePublished: '2026-07-20',
  dateModified: '2026-07-20',
};

const jsonLdHtml = JSON.stringify(JSON_LD);

const STATUS = {
  yes: { symbol: '✓', className: 'text-success font-bold', label: 'yes' },
  partial: { symbol: '~', className: 'text-warning font-bold', label: 'partial / paid' },
  no: { symbol: '–', className: 'text-foreground-400', label: 'no' },
} as const;

export default function ColorScaleVsPalette() {
  return (
    <Page data-testid="ColorScaleVsPalette">
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: jsonLdHtml }} type="application/ld+json" />

      <h1 className="text-3xl lg:text-4xl font-bold mb-1">Color scale vs palette</h1>
      <p className="text-xl text-foreground mb-4">
        A palette is a set of colors. A scale is one color, in every tone you need.
      </p>

      <div className="mb-4">
        <p>
          Search "color scale generator" and half the results hand you a <em>palette</em> tool: a
          set of pretty, unrelated colors. That’s a different job.
        </p>
        <p>
          This guide covers the tools that do the real one, each run through the same brief, with
          the facts side by side.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">A scale is not a palette</h2>
      <div className="space-y-3 mb-6">
        <p>
          A <strong>color scale</strong> is one hue resolved into an ordered ramp of tones: the{' '}
          <span className="font-mono text-sm">50, 100, … 900, 950</span> steps you assign to
          backgrounds, borders, text, and states. A <strong>palette</strong> picks colors that sit{' '}
          <em>beside</em> each other. A scale generates tones that sit <em>along</em> one. Theme an
          app or build a design system and you need scales, and far fewer tools make them well.
        </p>
      </div>
      <div className="space-y-4 mb-8">
        <div>
          <p className="font-semibold mb-2">Scale: one hue, ordered by tone</p>
          <div className="grid grid-cols-11 gap-1">
            {SCALE_SWATCHES.map(color => (
              <div key={color} className="aspect-square rounded-md" style={{ background: color }} />
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold mb-2">Palette: distinct hues, side by side</p>
          <div className="grid grid-cols-6 gap-1 sm:max-w-[55%]">
            {PALETTE_SWATCHES.map(color => (
              <div key={color} className="aspect-square rounded-md" style={{ background: color }} />
            ))}
          </div>
        </div>
      </div>

      <p className="mb-8">
        A palette isn’t the wrong tool, just the answer to a different question: picking brand
        accents, art-directing an illustration, setting a mood, where distinct hues are the whole
        point. A scale takes over the moment one of those colors has to become a full, usable range.
      </p>

      <h2 className="text-2xl font-bold mb-4">What a good scale demands</h2>
      <div className="space-y-6 mb-8">
        <div>
          <p>
            <strong>Perceptual evenness.</strong> Steps that look equally spaced to the eye, not
            just even on paper.
          </p>
          <p>
            OKLCH gets this right where HSL falls apart: a yellow and a blue at the same "lightness"
            look nothing alike.{' '}
            <Link className="underline" href="/oklch-vs-hsl">
              Why OKLCH wins
            </Link>
            .
          </p>
        </div>
        <div>
          <p>
            <strong>Character, on purpose.</strong> Evenness is only the floor.
          </p>
          <p>
            Shape the scale past it with lightness range and curve, chroma, and a little hue shift,
            or it comes out mechanical.{' '}
            <Link className="underline" href="/custom-color-scales">
              How to shape one
            </Link>
            .
          </p>
        </div>
        <div>
          <p>
            <strong>Contrast you can trust.</strong> Your text has to clear a real threshold.
          </p>
          <p>
            WCAG 2 is the legal floor, but it overstates contrast near black, exactly where
            dark-mode ramps live, so a step can pass WCAG and still fail APCA. Check both.
          </p>
        </div>
        <div>
          <p>
            <strong>Survival on a real screen.</strong> OKLCH lets you pick vivid colors that reach
            into P3, past what most sRGB monitors show.
          </p>
          <p>
            Skip the gamut check and a step that looks great on your laptop clips and shifts on
            someone else’s screen.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">The tools that do this</h2>
      <div className="space-y-1 mb-8">
        <p>
          These six build scales, not palettes. Each went through the same brief: a primary, a
          neutral, and an error scale from a single seed.
        </p>

        <p>The differences below come from the tool, not the task.</p>
      </div>
      <div className="flex flex-col gap-12 mb-8">
        {TOOLS.map(tool => (
          <article key={tool.name} className="flex flex-col xl:flex-row gap-4">
            <figure className="xl:w-1/2 shrink-0 border border-default rounded-large overflow-hidden">
              <Image
                alt={`${tool.name} on first load`}
                className="w-full h-auto block"
                height={475}
                src={tool.src}
                width={960}
              />
            </figure>
            <div>
              <h3 className="text-xl font-bold mb-2">
                <Link
                  className="underline"
                  href={tool.href}
                  {...(tool.mine ? {} : { rel: 'noopener noreferrer', target: '_blank' })}
                >
                  {tool.name}
                </Link>
                {tool.mine && (
                  <span className="align-middle text-xs font-mono uppercase tracking-wide text-primary">
                    {' '}
                    mine
                  </span>
                )}
              </h3>
              <div className="mb-2">
                {tool.description.map(para => (
                  <p key={para}>{para}</p>
                ))}
              </div>
              <p>
                <strong>{tool.diffLead}</strong> {tool.diffBody}
              </p>
            </div>
          </article>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-4">The facts, side by side</h2>
      <div className="relative overflow-x-auto rounded-medium border border-default-200 mb-3">
        <table className="w-full min-w-180 text-sm border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 text-left font-mono text-sm font-semibold p-3 bg-default-100">
                Capability
              </th>
              {TABLE_COLUMNS.map(name => (
                <th
                  key={name}
                  className="text-center font-mono text-sm font-semibold p-3 bg-default-100 whitespace-nowrap"
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map(row => (
              <tr key={row.label}>
                <th
                  className="sticky left-0 z-10 bg-background text-left font-normal text-foreground-500 p-3 whitespace-nowrap border-t border-default-200"
                  scope="row"
                >
                  {row.label}
                </th>
                {row.kind === 'text'
                  ? row.cells.map((cell, index) => (
                      <td
                        key={TABLE_COLUMNS[index]}
                        className="text-center p-2 border-t border-l border-default-200 font-mono text-sm text-foreground-500 whitespace-nowrap"
                      >
                        {cell}
                      </td>
                    ))
                  : row.cells.map((cell, index) => {
                      const status = STATUS[cell];

                      return (
                        <td
                          key={TABLE_COLUMNS[index]}
                          className="text-center p-2 border-t border-l border-default-200 text-lg"
                          title={status.label}
                        >
                          <span aria-hidden className={status.className}>
                            {status.symbol}
                          </span>
                          <span className="sr-only">{status.label}</span>
                        </td>
                      );
                    })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-foreground-400 font-mono mb-8">
        <span className="text-success font-bold">✓</span> yes ·{' '}
        <span className="text-warning font-bold">~</span> partial / paid ·{' '}
        <span className="text-foreground-400 font-bold">–</span> no · tested 2026-07-18
      </p>

      <p className="bg-default-50 text-foreground-600 border border-default-300 rounded-medium p-4 mb-8">
        I build one of these (ColorMeUp Lab), which is why you won’t find a "top 10" here or any
        scores. ColorMeUp Lab’s gaps sit in the same rows as everyone else’s.
      </p>

      <div className="mb-8">
        <p>
          Whichever tool you land on, hold it to the four demands above: perceptual evenness,
          character on purpose, contrast you can trust, survival on a real screen.
        </p>
        <p>The Generator is where you check all four at once.</p>
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
