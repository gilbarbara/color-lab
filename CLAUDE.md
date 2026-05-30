# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
Dev server URL: **https://color-lab.localhost** (via [portless](https://github.com/vercel-labs/portless) proxy — not `localhost:3000`).

```bash
pnpm dev             # Start dev server at https://color-lab.localhost (portless run next dev)
pnpm build           # Next.js production build (next build)
pnpm start           # Serve the standalone production build (node scripts/standalone.mjs)
pnpm preview         # Build + serve standalone (pnpm build && pnpm start)
pnpm lint            # ESLint with auto-fix (targets: src app tests e2e)
pnpm test            # Run tests
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Run tests with coverage
pnpm typecheck       # TypeScript check (src + tests + e2e projects)
pnpm validate        # Full validation: typecheck + lint + test:coverage
pnpm e2e             # Playwright end-to-end tests
```

## Architecture

React 19 + Next.js 16 (App Router) app for generating color palettes using the [colorizr](https://github.com/gilbarbara/colorizr) library.

### State Management

Zustand stores:

- **appStore** (`src/stores/appStore.ts`): Global UI state (export format, gamut, panel visibility, `sessionPalettePath` — in-memory, not persisted) — localStorage-guarded for SSR
- **authStore** (`src/stores/authStore.ts`): Authentication state (user, status, error)
- **palettesStore** (`src/stores/palettesStore.ts`): Saved-palettes list state
- **paletteStore** (`src/stores/paletteStore.ts`): Colors array + global scale options — **not a global singleton.** It is a per-request Zustand vanilla-store factory (`createPaletteStore(initialState?)`) provided via React Context by `src/providers/PaletteStoreProvider.tsx`, **mounted only on the generator routes via `app/(generator)/layout.tsx`** (not the global shell), self-initializing from the URL (`parsePaletteFromUrl`) so SSR and the first client render match. Consumed via `usePaletteStoreApi()` (`src/hooks/usePaletteStore.ts`) and `usePalette()`.

### Hooks

- **useAuth** (`src/hooks/useAuth.ts`): Authentication context consumer (user, login/logout methods)
- **usePalette** (`src/hooks/usePalette.ts`): Primary hook for palette state + actions + computed values (baseSaturation, defaultOptions)
- **usePaletteStore** (`src/hooks/usePaletteStore.ts`): Consumes the per-request paletteStore from `PaletteStoreContext`
- **useTheme** (`src/hooks/useTheme.ts`): Dark mode via `next-themes` (`resolvedTheme`/`setTheme`) with an `isMounted` hydration guard
- **useUrlSync** (`src/hooks/useUrlSync.ts`): Bidirectional URL ↔ store sync, called once in Generator; drives the URL via `next/navigation` `router.replace`/`router.push` and mirrors the current palette URL into `appStore.sessionPalettePath` (logo restore)
- **usePaletteIdSync** (`src/hooks/usePaletteIdSync.ts`): Syncs saved-palette `id` ↔ URL query
- **useSavedPalettesList** (`src/hooks/useSavedPalettes.ts`): Store-free saved-list CRUD (fetch/delete/favorite/rename) — used by `/palettes`, outside the palette provider
- **useSavedPalettes** (`src/hooks/useSavedPalettes.ts`): Composes the list + save/`currentUrl` of the *current* palette (reads the palette store; generator routes only)
- **useApp** (`src/hooks/useApp.ts`): appStore accessor

### Authentication

Firebase Authentication (with Identity Platform) supporting:

- OAuth via popup (Google, GitHub)
- Email/password login and signup
- Magic link (passwordless)

Flow: `AuthProvider` wraps app, uses `onAuthStateChanged` for session restore, provides auth methods via `AuthContext`. OAuth provider stored in `localStorage` (`colorLabAuthProvider`) for avatar resolution across sessions.

A Cloud Function (`cloud-functions/src/index.js`) runs `beforeUserCreated` to set `emailVerified: true` for OAuth providers, preventing Firebase's trusted-provider overwrite behavior.

### URL State — the URL is the single source of truth

The palette lives in the URL; the store follows the URL, never a competing persisted copy.

- Shareable form: `/p/{name}-{value}[-{overrides}]/...?{globalOpts}&id={savedId}` — colors in the **path** (`value` = OKLCH `L_C_H`); global scale options + saved-palette `id` in the **query** (single-letter keys). Encoding/decoding: `src/utils/url.ts`.
- `/` and `/p/*` are `force-dynamic` (SSR per request) and the only routes that mount `PaletteStoreProvider` (`app/(generator)/layout.tsx`). Static pages must stay out of that tree — the provider calls `useSearchParams`, which would force them to client-render.
- **New Palette** mints a fresh palette and pushes its `/p/...` URL (`createPalette()` → `serializePaletteToUrl` → `router.push`); it is not a link to `/`.
- **Logo restore** is an in-memory convenience: `appStore.sessionPalettePath` (written by `useUrlSync`, not persisted). Gone on reload → logo falls back to `/`; the durable restore is the browser **back button** (history = URL = truth).

### Provider / Component Structure

Provider tree is composed in `app/providers.tsx` (rendered by `app/layout.tsx`):

```
ThemeProvider (src/providers/ThemeProvider.tsx)
│   └── NextThemesProvider → HeroUIProvider (navigate=router.push) → ToastProvider
└── AuthProvider
    └── AppShell
        ├── AppStoreSync (appStore ↔ localStorage)
        ├── Header (global: logo, dark mode toggle, Login/Avatar)
        ├── main → Sentry.ErrorBoundary → {route page}
        └── Login (when unauthenticated)
```

`app/(generator)/layout.tsx` wraps only `/` and `/p/*` in `PaletteStoreProvider` (per-request store, seeded from the URL) — keeping the search-param dependency out of the statically-prerendered pages.

Routes (Next.js App Router under `app/`):

```
/                        app/(generator)/page.tsx              → Generator (force-dynamic)
/p/*                     app/(generator)/p/[...slug]/page.tsx  → Generator, palette in URL (force-dynamic)
/palettes                app/palettes/page.tsx        → Palettes (saved list)
/about /privacy /terms   app/{about,privacy,terms}/page.tsx
/auth/callback           app/auth/callback/page.tsx   → AuthCallback (OAuth/magic link)
/og/*                    app/og/[...slug]/route.tsx   → dynamic OG image (next/og)
```

The Generator UI lives in `src/containers/Generator/` (`index.tsx`, `Panel.tsx`, `ColorOptions.tsx`) and the palette UI in `src/containers/Palette/` (`Header`, `Scale`, `Swatch`, `Options`, `GamutToggle`). `ColorList`/`ColorItem` (SRGB | OKLCH) live in `src/containers/ColorList/`. The old Vite `Sidebar.tsx`/`BottomBar.tsx` are gone — responsive layout is handled by `Panel.tsx`.

### Key Types

- **ColorEntry**: `{ id, name, value, overrides? }`
- **GlobalScaleOptions**: `{ steps, saturation, saturationOverride, chromaCurve, lightnessCurve, minLightness, maxLightness }`

### Core Utilities

- `src/config/firebase.ts`: `firebaseConfig` (from `NEXT_PUBLIC_FIREBASE_*` env vars) + `PALETTES_COLLECTION`
- `src/utils/firebase.ts`: Firebase app init, `auth` + `db` exports (Firestore Lite); reads config from `src/config/firebase.ts`
- `src/services/palettes.ts`: Firestore CRUD for saved palettes
- `src/utils/color.ts`: Color helpers (chroma percentage, random color)
- `src/utils/gamut.ts`: P3 capability detection (`isP3Supported`), SSR `window` guard
- `src/utils/export.ts`: Generate CSS/SCSS/Tailwind/SVG exports
- `src/utils/palette.ts`: Pure functions for palette CRUD operations (used by store)
- `src/utils/url.ts`: URL encoding/decoding for shareable palettes

## Key Dependencies

- **colorizr**: Color manipulation, `scale()` function for generating tone steps
- **Zustand**: State management (stores in `src/stores/`)
- **Next.js 16 (App Router)**: Routing + navigation via `next/navigation`
- **HeroUI V2**: Component library with Tailwind CSS 4
- **next-themes**: Light/dark theme (class strategy)
- **Firebase**: Authentication (with Identity Platform) + Firestore Lite for palette storage
- **@sentry/nextjs**: Error/perf monitoring (client/server/edge via `instrumentation.ts`)
- **@gilbarbara/hooks**: `useMemoDeepCompare`, `useToggle`, `useBreakpoint`, `useSetState`

## Testing

Tests in `tests/` mirroring `src/` structure. Use `.test.ts` or `.test.tsx` extensions.

**Path aliases (tsconfig):**

- `~/test-utils` → `tests/__setup__/test-utils.tsx`
  - custom render wrapping `ThemeProvider` + `MockAuthProvider`. `next/navigation` is mocked in `~/test-mocks` (no router in the wrapper); `PaletteStoreProvider` is mocked to a passthrough. Supports `initialEntries` (seeds the mocked route via `setMockRoute`) and `authState` for auth context overrides.
- `~/test-mocks` → `tests/__setup__/mocks.ts`
  - mocks `next/navigation`, `next-themes`, `@heroui/react`, and `~/utils/gamut`. Exports: `mockRouter`, `setMockRoute(url)`, `mockSetTheme`, `setMockTheme(theme)`, `mockAddToast`, `mockIsP3Supported`, `getPaletteStore()`, `mockClipboard`.

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
- `mockRouter` / `setMockRoute(url)` - `next/navigation` router + route seeding
- `mockSetTheme` / `setMockTheme(theme)` - `next-themes` theme control
- `mockIsP3Supported` - gamut capability toggle (`~/utils/gamut`)
- `getPaletteStore()` - handle to the shared per-test palette store

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

- Next.js 16 (App Router)
- TypeScript with `@gilbarbara/tsconfig`
- ESLint with `@gilbarbara/eslint-config/base`
- Prettier with `@gilbarbara/prettier-config`
- Tailwind CSS 4 via `@tailwindcss/postcss` (`postcss.config.mjs`)
- Vitest for unit tests (resolves `~/` via `tsconfigPaths: true` in `vitest.config.ts`); Playwright for e2e
- Path alias: `~/` maps to `src/` (configured in `tsconfig.json`)

## Deployment (Dokploy)

Hosted on Dokploy at `lab.colormeup.co` as a **Dockerized Next.js standalone server** (`output: 'standalone'` in `next.config.mjs`).

**Configuration:**

- Build type: `Dockerfile`
- `Dockerfile`: `node:24-alpine`, pnpm 11.5.2, multi-stage (`deps` → `builder` → `runner`)
- Runs as unprivileged `nextjs` user; `CMD ["node", "server.js"]`
- Port: `3000` (`EXPOSE 3000`, `PORT=3000`, `HOSTNAME=0.0.0.0`)

**Notes:**

- `next build` produces `.next/standalone`; the runner stage copies `public/`, `.next/standalone`, and `.next/static`.
- The 6 `NEXT_PUBLIC_FIREBASE_*` are inlined into the client bundle at **build time**, so they must be passed as Docker build args (Dokploy) / present for `next build` — not just at runtime.
- Server-rendered routes (`/p/*`, `/og/*`) require the Node server — this is no longer a static SPA, so there is no NGINX/`try_files`/`./dist` involved.
