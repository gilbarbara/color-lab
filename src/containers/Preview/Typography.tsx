import { memo } from 'react';

interface PreviewTypographyProps {
  name: string;
}

const stop = (event: { preventDefault: () => void }) => event.preventDefault();

function PreviewTypography({ name }: PreviewTypographyProps) {
  return (
    <section
      className="@container selection:bg-(--color-preview) selection:text-(--color-preview-foreground)"
      data-testid="Preview-Typography"
    >
      <div className="grid grid-cols-1 @3xl:grid-cols-[1fr_320px] @5xl:grid-cols-[1fr_480px] @6xl:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wider text-(--color-preview)">
              Article
            </p>
            <h2 className="text-3xl font-bold leading-tight">Designing with perceptual color</h2>
            <p className="text-sm opacity-60">12 min read · Updated today</p>
          </div>
          <p className="text-lg leading-relaxed opacity-90">
            A scale is only as good as it reads. As body copy the same hue has to stay legible from
            the lightest tint to the deepest shade.
          </p>
          <p className="leading-relaxed">
            Most palettes look fine as swatches and fall apart in a paragraph. Here the color
            carries a real sentence — with an{' '}
            <a
              className="font-medium text-(--color-preview) underline underline-offset-2 hover:opacity-80"
              href="#preview-link"
              onClick={stop}
            >
              inline link
            </a>
            , a piece of{' '}
            <code className="rounded bg-(--color-preview)/15 px-1.5 py-0.5 font-mono text-sm text-(--color-preview-600)">
              inline code
            </code>
            , and a{' '}
            <mark className="rounded bg-(--color-preview)/25 px-1 text-inherit">highlight</mark> so
            you can judge contrast where it actually matters.
          </p>

          <ul className="list-inside list-disc marker:text-(--color-preview)">
            <li>Perceptual lightness</li>
            <li>Consistent contrast</li>
            <li>Better UI scales</li>
          </ul>

          <blockquote className="border-l-4 border-(--color-preview) pl-4 italic opacity-90">
            “If the text isn’t comfortable to read, the palette isn’t done.”
          </blockquote>
          <p className="text-sm opacity-60">
            Caption and helper text sit lower in the hierarchy — still readable, never shouting.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-3xl font-bold leading-none">Display</span>
            <span className="text-xl font-semibold">Title</span>
            <span className="text-base">Body — the quick brown fox jumps over the lazy dog.</span>
            <span className="text-sm opacity-70">
              Secondary — supporting detail beneath the body.
            </span>
            <span className="text-xs opacity-50">Caption — the smallest legible size.</span>
          </div>

          <div>
            <p className="text-lg font-semibold text-(--color-preview)">{name} Heading</p>
            <p>Used for highlights and callouts</p>
          </div>

          <div className="rounded-lg bg-(--color-preview) p-4 text-(--color-preview-foreground)">
            <p className="text-lg font-semibold">Text on {name}</p>
            <p className="text-sm opacity-90">
              Black or white is chosen automatically (APCA) for the strongest contrast on the base
              color.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a
              className="text-(--color-preview) underline underline-offset-2 hover:opacity-80"
              href="#preview-link"
              onClick={stop}
            >
              Link
            </a>
            <span className="rounded bg-(--color-preview)/15 px-2 py-1 font-medium text-(--color-preview-600)">
              Badge
            </span>
            <kbd className="rounded border border-(--color-preview)/40 bg-(--color-preview)/10 px-1.5 py-0.5 font-mono text-(--color-preview-600)">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(PreviewTypography);
