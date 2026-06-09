import Link from 'next/link';

import Page from '~/components/Page';

export default function About() {
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
        <p>
          See{' '}
          <Link className="underline" href="/oklch-vs-hsl">
            OKLCH vs HSL
          </Link>{' '}
          for a side-by-side look at why.
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
        <p className="mt-4">
          <Link
            className="inline-flex items-center h-10 py-2 px-4 leading-none bg-primary text-primary-foreground rounded-medium"
            href="/"
          >
            Create your palette
          </Link>
        </p>
      </div>
    </Page>
  );
}
