import { useHead } from '@unhead/react';

import Page from '~/components/Page';

export default function About() {
  useHead({
    title: 'About — ColorMeUp LAB',
    meta: [
      {
        name: 'description',
        content:
          'Open-source design tool for creating perceptual color scales in OKLCH, with control over lightness, chroma, steps, and curves.',
      },
    ],
    link: [{ rel: 'canonical', href: 'https://lab.colormeup.co/about' }],
  });

  return (
    <Page data-testid="About">
      <h1 className="text-4xl font-bold mb-8">ColorMeUp LAB</h1>

      <p className="mb-6">A design tool for creating and fine-tuning perceptual color scales.</p>

      <div className="space-y-2 mb-8">
        <p>
          It’s built for designers and developers who need control over how a scale behaves:
          lightness range and distribution, chroma handling, number of steps, and how a scale
          responds to constraints like locks and curves. You shape the scale directly and see the
          impact of each adjustment in real time.
        </p>

        <p>
          All calculations are done in the <strong>OKLCH</strong> color space, which makes it easier
          to reason about lightness and chroma independently and to generate scales that behave
          consistently across steps and different displays. This is especially important for UI
          work, where uneven jumps quickly become noticeable.
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
      </div>
      <p>That's it. Use it, tweak your scales, and explore a bit.</p>
      <p>If you find it useful, starring the repos is appreciated.</p>
    </Page>
  );
}
