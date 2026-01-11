# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev             # Start dev server on port 3000 (auto-opens browser)
pnpm build           # TypeScript check + Vite production build
pnpm lint            # ESLint with auto-fix
pnpm preview         # Preview production build
pnpm test            # Run tests
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Run tests with coverage
pnpm typecheck       # TypeScript check only
pnpm validate        # Full validation: lint + typecheck + test:coverage + build
```

## Architecture

React 19 app for generating color palettes using the [colorizr](https://github.com/gilbarbara/colorizr) library.

### State Management

Two Zustand stores:
- **paletteStore** (`src/stores/paletteStore.ts`): Colors array + global scale options
- **appStore** (`src/stores/appStore.ts`): UI state (export format, bottom bar visibility)

### Hooks

- **usePalette** (`src/hooks/usePalette.ts`): Primary hook for palette state + actions + computed values (baseSaturation, defaultOptions)
- **useUrlSync** (`src/hooks/useUrlSync.ts`): Bidirectional URL ↔ store sync, called once in Generator
- **useTheme** (`src/hooks/useTheme.ts`): Dark mode state from ThemeProvider

### URL State

Shareable URLs encode entire palette: `/p/{name}-{color}[-{options}]/...?globalOpts`
- Color values: hex (no `#`) or OKLCH as `L_C_H`
- Options use single-letter keys for compression

### Component Structure

```
ThemeProvider
└── Generator (page)
    ├── Sidebar (desktop) / Header+BottomBar (mobile)
    │   ├── ColorOptions (global scale options)
    │   └── ColorList → ColorSelector[] (SRGB or OKLCH mode)
    ├── Palette → Scale[] → Swatch[]
    └── Footer
```

### Key Types

- **ColorEntry**: `{ name, value, overrides? }`
- **GlobalScaleOptions**: `{ steps, saturation, saturationOverride, chromaCurve, lightnessCurve, minLightness, maxLightness }`

### Core Utilities

- `src/utils/palette.ts`: Pure functions for palette CRUD operations (used by store)
- `src/utils/url.ts`: URL encoding/decoding for shareable palettes
- `src/utils/export.ts`: Generate CSS/SCSS/Tailwind/SVG exports
- `src/utils/color.ts`: Color helpers (chroma percentage, random color)

## Key Dependencies

- **colorizr**: Color manipulation, `scale()` function for generating tone steps
- **Zustand**: State management (stores in `src/stores/`)
- **HeroUI**: Component library with Tailwind CSS 4
- **React Router**: Routing (`/` and `/p/*` routes)
- **@gilbarbara/hooks**: `useMemoDeepCompare`, `useToggle`, `useBreakpoint`, `useSetState`

## Testing

- Vitest with jsdom environment, globals enabled
- Custom render wrapper in `tests/__setup__/test-utils.tsx` (MemoryRouter + ThemeProvider)
- Uses `data-uid` attribute instead of `data-testid`
- Reset Zustand stores in `beforeEach()` for isolation

## Stack

- TypeScript with `@gilbarbara/tsconfig`
- ESLint with `@gilbarbara/eslint-config/base`
- Prettier with `@gilbarbara/prettier-config`
- Tailwind CSS 4 via Vite plugin
- Vite with React Compiler enabled
- Path alias: `~/` maps to `src/`
