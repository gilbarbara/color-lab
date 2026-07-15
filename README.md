# Color Lab

A design tool for creating and fine-tuning perceptual color scales.

Built for designers and developers who need precise control over lightness, chroma, and scale behavior. All calculations use the OKLCH color space for consistent, predictable results across displays.

**Live:** https://lab.colormeup.co/

## Features

**Build a palette**

- Up to 10 base colors, added by hue rotation with selectable spacing (tight, even, wide, golden angle)
- Generate a tonal scale for each, from 3 to 20 steps
- Organize colors into groups — brand, neutral, semantic, decorative — and filter the view by them

**Shape the scale**

- Lightness range, lightness curve, chroma curve (with a movable peak), and hue shift
- Each curve can be a single value or split, with independent control over the light and dark ends
- Steps, mode (light / dark / reversed), variants, saturation, and a step lock to pin the base color
- Per-color overrides for any of it, on top of the palette-wide settings
- One-click presets matching Tailwind, Material, Bootstrap, and Open Color

**Inspect what you made**

- Distribution charts for chroma, lightness, and hue — the chroma chart plots the gamut ceiling against the curve you asked for and the output that survived clamping, so you can see exactly where a color is being clipped
- Per-step color info: OKLCH breakdown, APCA contrast on white and black, and a warning when a step drifts converting to hex
- Contrast grid of every step against every other, scored by WCAG 2 or APCA
- Live preview rendering real UI components and typography in your color, in light or dark

**Take it with you**

- Export to Tailwind CSS 4 / 3, CSS custom properties, SCSS, or SVG for Figma — in OKLCH, hex, HSL, or RGB
- Shareable URLs — the entire palette is encoded in the URL, so the back button is undo and copying the address bar is sharing
- Save and manage palettes (requires login)
- Sign in with Google, GitHub, email, or a magic link
- Wide-gamut P3 or sRGB, and dark/light theme

## Learn more

- [Custom color scales](https://lab.colormeup.co/custom-color-scales) — how the scale controls work
- [OKLCH vs HSL](https://lab.colormeup.co/oklch-vs-hsl) — why the color space matters

## Related

- [ColorMeUp](https://colormeup.co) - Companion app for exploring colors, formats, and variations
- [colorizr](https://github.com/gilbarbara/colorizr) - The color library powering both apps

## Tech Stack

- React 19 + Next.js 16 (App Router) with TypeScript
- Zustand for state management
- Tailwind CSS 4 with HeroUI v2 components
- Firebase for authentication and storage

## Development

```bash
pnpm install
pnpm dev
```

See [CLAUDE.md](CLAUDE.md) for commands and [docs/architecture.md](docs/architecture.md) for how it fits together.

## License

MIT - See [LICENSE](LICENSE) for details.
