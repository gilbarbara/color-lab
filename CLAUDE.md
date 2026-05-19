# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
Dev server URL: **https://color-lab.localhost** (via [portless](https://github.com/vercel-labs/portless) proxy — not `localhost:3000`).

```bash
pnpm dev             # Start dev server at https://color-lab.localhost (portless run vite)
pnpm build           # TypeScript check + Vite production build
pnpm lint            # ESLint with auto-fix
pnpm preview         # Preview production build
pnpm test            # Run tests
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Run tests with coverage
pnpm typecheck       # TypeScript check only
pnpm validate        # Full validation: lint + typecheck + test:coverage
```

## Architecture

React 19 app for generating color palettes using the [colorizr](https://github.com/gilbarbara/colorizr) library.

### State Management

Zustand stores:

- **appStore** (`src/stores/appStore.ts`): UI state (export format, panel visibility)
- **authStore** (`src/stores/authStore.ts`): Authentication state (user, status, error)
- **paletteStore** (`src/stores/paletteStore.ts`): Colors array + global scale options

### Hooks

- **useAuth** (`src/hooks/useAuth.ts`): Authentication context consumer (user, login/logout methods)
- **usePalette** (`src/hooks/usePalette.ts`): Primary hook for palette state + actions + computed values (baseSaturation, defaultOptions)
- **useTheme** (`src/hooks/useTheme.ts`): Dark mode state from ThemeProvider
- **useUrlSync** (`src/hooks/useUrlSync.ts`): Bidirectional URL ↔ store sync, called once in Generator

### Authentication

Firebase Authentication (with Identity Platform) supporting:

- OAuth via popup (Google, GitHub)
- Email/password login and signup
- Magic link (passwordless)

Flow: `AuthProvider` wraps app, uses `onAuthStateChanged` for session restore, provides auth methods via `AuthContext`. OAuth provider stored in `localStorage` (`colorLabAuthProvider`) for avatar resolution across sessions.

A Cloud Function (`cloud-functions/src/index.js`) runs `beforeUserCreated` to set `emailVerified: true` for OAuth providers, preventing Firebase's trusted-provider overwrite behavior.

### URL State

Shareable URLs encode entire palette: `/p/{name}-{color}[-{options}]/...?globalOpts`

- Color values: hex (no `#`) or OKLCH as `L_C_H`
- Options use single-letter keys for compression

### Component Structure

```
ThemeProvider
└── AuthProvider
    └── App (BrowserRouter)
        ├── Header (global: logo, dark mode toggle, Login/Avatar)
        └── Routes
            ├── Generator (/)
            │   ├── GeneratorHeader (mobile only, above divider)
            │   ├── Sidebar (desktop only)
            │   │   ├── GeneratorHeader
            │   │   ├── ColorOptions
            │   │   ├── ColorList → ColorSelector[] (SRGB | OKLCH)
            │   │   └── Add Color button
            │   └── Palette
            │       ├── PaletteHeader (options panel + export)
            │       ├── Scale[] → Swatch[]
            │       ├── BottomBar (mobile only, slide-up drawer)
            │       │   ├── ColorOptions
            │       │   └── ColorList → ColorSelector[]
            │       └── Footer
            └── AuthCallback (/auth/callback)
```

### Key Types

- **ColorEntry**: `{ id, name, value, overrides? }`
- **GlobalScaleOptions**: `{ steps, saturation, saturationOverride, chromaCurve, lightnessCurve, minLightness, maxLightness }`

### Core Utilities

- `src/utils/firebase.ts`: Firebase app, auth, Firestore db exports
- `src/utils/color.ts`: Color helpers (chroma percentage, random color)
- `src/utils/export.ts`: Generate CSS/SCSS/Tailwind/SVG exports
- `src/utils/palette.ts`: Pure functions for palette CRUD operations (used by store)
- `src/utils/url.ts`: URL encoding/decoding for shareable palettes

## Key Dependencies

- **colorizr**: Color manipulation, `scale()` function for generating tone steps
- **Zustand**: State management (stores in `src/stores/`)
- **HeroUI V2**: Component library with Tailwind CSS 4
- **React Router**: Routing (`/`, `/p/*`, `/auth/callback` routes)
- **Firebase**: Authentication (with Identity Platform) + Firestore Lite for palette storage
- **@gilbarbara/hooks**: `useMemoDeepCompare`, `useToggle`, `useBreakpoint`, `useSetState`

## Testing

Tests in `tests/` mirroring `src/` structure. Use `.test.ts` or `.test.tsx` extensions.

**Path aliases (tsconfig):**

- `~/test-utils` → `tests/__setup__/test-utils.tsx`
  - custom render with MemoryRouter + ThemeProvider + MockAuthProvider. Supports `initialEntries` for routing, and `authState` for auth context overrides.
- `~/test-mocks` → `tests/__setup__/mocks.ts`
  - global mocks: clipboard, HeroUI

**Patterns:**

- **Simple component** (snapshot only): Single `describe`, one snapshot test
- **Complex component**: Nested `Render` and `Behavior` describe blocks
- **Hooks**: Use `renderHook()` + `act()` for state mutations
- **Stores**: Reset with `store.setState({...})` in `beforeEach()`

**Conventions:**

- Vitest globals enabled (no imports for describe/it/expect)
- `vi.clearAllMocks()` in `beforeEach()` when using mocks
- `waitFor()` for async assertions
- Snapshots for render, behavior tests for interactions

**Available mocks** (import from `~/test-mocks`):

- `mockClipboard.writeText` - Navigator clipboard
- `mockAddToast` - HeroUI toast function

## Browser Testing

**ALWAYS use `agent-browser`** for any browser work — screenshots, navigation, interaction, manual verification.

Before first browser command: invoke `agent-browser` skill via Skill tool. Skill has workflow patterns + ref/selector usage CLI flags don't show.

P3 wide-gamut UI. Headless Chrome defaults to SRGB and clips colors — load `scripts/spoof-p3-gamut.js` via `--init-script` when verifying visuals:

```bash
agent-browser open --init-script scripts/spoof-p3-gamut.js https://color-lab.localhost
```

### Logged-in flows

Test account credentials are available in the shell as `$COLOR_LAB_EMAIL` and `$COLOR_LAB_PASSWORD` — use these for any flow that needs auth (rename, save, persistence, etc.).

HeroUI's primary Button uses React Aria's `usePress`, which does not fire reliably from `agent-browser` clicks. To submit a form (login, save modal), focus an input inside the form and press Enter so the form's `onSubmit` handler runs. Clicking the submit button directly is unreliable.

## Stack

- TypeScript with `@gilbarbara/tsconfig`
- ESLint with `@gilbarbara/eslint-config/base`
- Prettier with `@gilbarbara/prettier-config`
- Tailwind CSS 4 via Vite plugin
- Vite with React Compiler enabled
- Path alias: `~/` maps to `src/`

## Deployment (Dokploy)

Hosted on Dokploy at `lab.colormeup.co`

**Configuration:**

- Build type: `nixpacks`
- Publish directory: `./dist`
- Static SPA: `true` (enables NGINX SPA routing with `try_files` fallback)
- Port: `80`

**Notes:**

- No `start` script needed - Nixpacks builds with `pnpm build`, then NGINX serves the static files
- `isStaticSpa: true` is required for React Router deep links to work (redirects all 404s to `index.html`)
