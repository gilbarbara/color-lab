# Color Lab

A design tool for creating and fine-tuning perceptual color scales.

Built for designers and developers who need precise control over lightness, chroma, and scale behavior. All calculations use the OKLCH color space for consistent, predictable results across displays.

**Live:** https://lab.colormeup.co/

## Features

- Generate color scales with customizable steps (3-21 shades)
- Fine-tune lightness curves, chroma curves, and saturation controls
- Per-color overrides for individual scale adjustments
- Switch between OKLCH and sRGB color spaces
- Export to Tailwind CSS 4/3, CSS variables, SCSS, or SVG
- Shareable URLs - entire palette encoded in the URL
- Save and manage palettes (requires login)
- User authentication (Google, GitHub, email, magic link)
- Dark/light theme support

## Related

- [ColorMeUp](https://colormeup.co) - Companion app for exploring colors, formats, and variations
- [colorizr](https://github.com/gilbarbara/colorizr) - The color library powering both apps

## Tech Stack

- React 19 with React Compiler
- TypeScript
- Zustand for state management
- Tailwind CSS 4
- HeroUI components
- Appwrite for authentication
- Vite

## Development

```bash
pnpm install
pnpm dev
```

## License

MIT - See [LICENSE](LICENSE) for details.
