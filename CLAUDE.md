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

- **appStore** (`src/stores/appStore.ts`): Global UI state (export format, gamut, panel visibility, saved-palette `paletteId`/`paletteName`, `sessionPalettePath`) — localStorage-guarded for SSR
- **authStore** (`src/stores/authStore.ts`): Authentication state (user, status, error)
- **generatorStore** (`src/stores/generatorStore.ts`): Colors array + global scale options. **Not a global singleton** — a per-request store factory (`createGeneratorStore(initialState?)`) provided via Context, consumed via `useGeneratorStoreApi()` / `useGenerator()`. Seeded from the URL — see [URL State](#url-state--the-url-is-the-single-source-of-truth).
- **palettesStore** (`src/stores/palettesStore.ts`): Saved-palettes list state

### Hooks

- **useAuth** (`src/hooks/useAuth.ts`): Authentication context consumer (user, login/logout methods)
- **useGenerator** (`src/hooks/useGenerator.ts`): Primary hook for palette state + actions + computed values (baseSaturation, defaultOptions)
- **useGeneratorStore** (`src/hooks/useGeneratorStore.ts`): Consumes the per-request generatorStore from `GeneratorStoreContext`
- **useTheme** (`src/hooks/useTheme.ts`): Dark mode via `next-themes` (`resolvedTheme`/`setTheme`) with an `isMounted` hydration guard
- **useUrlSync** (`src/hooks/useUrlSync.ts`): Bidirectional URL ↔ generator-store sync, called once in Generator — see [URL State](#url-state--the-url-is-the-single-source-of-truth)
- **usePaletteIdSync** (`src/hooks/usePaletteIdSync.ts`): Validates the saved-palette `?id=` and manages palette identity — see [URL State](#url-state--the-url-is-the-single-source-of-truth)
- **useSavedPalettesList** (`src/hooks/useSavedPalettes.ts`): Store-free saved-list CRUD (fetch/delete/favorite/rename) — used by `/palettes`, outside the generator provider
- **useSavedPalettes** (`src/hooks/useSavedPalettes.ts`): Composes the list + save/`currentUrl` of the *current* palette (reads the generator store; generator routes only)
- **useApp** (`src/hooks/useApp.ts`): appStore accessor

### Authentication

Firebase Authentication (with Identity Platform) supporting:

- OAuth via popup (Google, GitHub)
- Email/password login and signup
- Magic link (passwordless)

Flow: `AuthProvider` wraps app, uses `onAuthStateChanged` for session restore, provides auth methods via `AuthContext`. OAuth provider stored in `localStorage` (`colorLabAuthProvider`) for avatar resolution across sessions.

A Cloud Function (`cloud-functions/src/index.js`) runs `beforeUserCreated` to set `emailVerified: true` for OAuth providers, preventing Firebase's trusted-provider overwrite behavior.

### URL State — the URL is the single source of truth

The palette lives in the URL; the store follows the URL, never a competing persisted copy. **Read before touching palette/navigation behavior.**

**URL shape.** Shareable form `/p/{name}-{value}[-{overrides}]/...?{globalOpts}&id={savedId}` — colors in the **path** (`value` = OKLCH `L_C_H`, or legacy hex `RRGGBB`); global scale options + saved-palette `id` in the **query** (single-letter keys). All encode/decode lives in `src/utils/url.ts` (`parsePaletteFromUrl`, `serializePaletteToUrl`, `getPaletteIdFromUrl`, `updatePaletteIdInUrl`, `canonicalizeUrl`) — that file is the authority for keys/format; don't re-derive them.

**Routes.** `/` and `/p/*` are `force-dynamic` (SSR per request) and the only routes that mount `GeneratorStoreProvider` (`app/(generator)/layout.tsx`). Static pages must stay out of that tree — the provider calls `useSearchParams`, which would force them to client-render.

**Store seeding** (`GeneratorStoreProvider.tsx`). One-time `useRef` store created on first render: on `/p/*` it parses the URL (`parsePaletteFromUrl`); elsewhere (or if the URL is unparseable) it reuses the server-generated `fallbackPalette` prop from `app/(generator)/layout.tsx`. Both server and first client render run the same branch on the same input, so SSR and hydration match.

**Runtime sync** (`useUrlSync.ts`, called once in Generator) — three effects:
1. **URL → store** (on nav / back-forward / address-bar). Guard: returns early if the URL already equals the serialized store (`:61`). Otherwise applies the URL state, **preserving existing color `id`s by index** to avoid needless re-renders. Invalid/dropped colors → toast + `router.replace` to the cleaned URL; legacy hex/0–1-OKLCH forms → `router.replace` to canonical; root or unparseable `/p/` → `router.replace` with the already-seeded store (no flash).
2. **Interaction pause.** A `MutationObserver` on `data-interacting="true"` (set by ColorPicker/ChannelSliders) pauses URL writes mid-gesture and flushes once on release, so dragging doesn't churn history.
3. **store → URL.** A store subscription fires only when `colors` or `globalOptions` change (ignores `activeColorId`/`previewColorId`) → `commitPaletteUrl` → `router.push`.

**`push` vs `replace`.** `push` = user intent worth a history entry (New Palette, color/option edits via `commitPaletteUrl`). `replace` = silent system correction that must NOT pollute history (drop invalid colors, canonicalize legacy form, strip an unauthorized/missing `id`, reflect the seeded store at root). Every router call passes `ROUTER_NAVIGATION_OPTIONS = { scroll: false }` (`src/config/globals.tsx`) so URL changes never jump scroll.

**New Palette** mints a fresh palette and `router.push`es its `/p/...` URL (`createPalette()` → `serializePaletteToUrl`); it is not a link to `/`.

**Saved-palette identity** (`usePaletteIdSync.ts`, called once alongside `useUrlSync`). Owns the `?id=` query only (colors are `useUrlSync`'s job). Auth-gated: validates the id against the `palettesStore` cache then the API, canonicalizes + fire-and-forget-migrates the stored URL in Firestore, and writes `appStore` `paletteId`/`paletteName` via `setPalette`. Strips the id with `router.replace` when unauthenticated, not-found, or owned by another user.

**Logo restore** — `appStore.sessionPalettePath` is an in-memory convenience (written by `useUrlSync`, not persisted) so the Header logo can return to the palette being worked on. Reload falls back to `/`.

### Provider / Component Structure

Provider tree is composed in `app/providers.tsx` (rendered by `app/layout.tsx`):

```
ThemeProvider (src/providers/ThemeProvider.tsx)
└── NextThemesProvider
    └── HeroUIProvider (navigate=router.push)
        ├── ToastProvider (self-closing; not a wrapper)
        └── AuthProvider
            └── AppShell
                ├── AppStoreSync (appStore ↔ localStorage)
                ├── Header (global: logo, dark mode toggle, Login/Avatar)
                ├── main → Sentry.ErrorBoundary → {route page}
                └── Login (when unauthenticated)
```

`app/(generator)/layout.tsx` wraps only `/` and `/p/*` in `GeneratorStoreProvider` (per-request store, seeded from the URL — see [URL State](#url-state--the-url-is-the-single-source-of-truth)).

Routes (Next.js App Router under `app/`):

```
/                        app/(generator)/page.tsx              → Generator (force-dynamic)
/p/*                     app/(generator)/p/[...slug]/page.tsx  → Generator, palette in URL (force-dynamic)
/palettes                app/palettes/page.tsx        → Palettes (saved list)
/about /privacy /terms   app/{about,privacy,terms}/page.tsx
/auth/callback           app/auth/callback/page.tsx   → AuthCallback (OAuth/magic link)
/og/*                    app/og/[...slug]/route.tsx   → dynamic OG image (next/og)
```

The Generator UI lives in `src/containers/Generator/` (`index.tsx`, `Panel.tsx`, `ColorOptions.tsx`) and the palette UI in `src/containers/Palette/` (`Header`, `Scale`, `Swatch`, `Options`, `GamutToggle`). `ColorList`/`ColorItem` (SRGB | OKLCH) live in `src/containers/ColorList/`. Responsive layout is handled by `Panel.tsx`.

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
- `src/utils/generator.ts`: Pure functions for palette CRUD operations (used by store)
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
  - custom render wrapping `ThemeProvider` + `MockAuthProvider`. `next/navigation` is mocked in `~/test-mocks` (no router in the wrapper); `GeneratorStoreProvider` is mocked to a passthrough. Supports `initialEntries` (seeds the mocked route via `setMockRoute`) and `authState` for auth context overrides.
- `~/test-mocks` → `tests/__setup__/mocks.ts`
  - mocks `next/navigation`, `next-themes`, `@heroui/react`, and `~/utils/gamut`. Exports: `mockRouter`, `setMockRoute(url)`, `mockSetTheme`, `setMockTheme(theme)`, `mockAddToast`, `mockIsP3Supported`, `getGeneratorStore()`, `mockClipboard`.

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
- `getGeneratorStore()` - handle to the shared per-test generator store

## Browser Testing

**ALWAYS use `agent-browser`** for any browser work — screenshots, navigation, interaction, manual verification.

Before first browser command: invoke `agent-browser` skill via Skill tool. Skill has workflow patterns + ref/selector usage CLI flags don't show.

P3 wide-gamut UI. Headless Chrome defaults to SRGB and clips colors — load `scripts/spoof-p3-gamut.js` via `--init-script` when verifying visuals:

```bash
agent-browser open --init-script scripts/spoof-p3-gamut.js https://color-lab.localhost
```

### Logged-in flows

Test account credentials are available in the shell as `$COLOR_LAB_EMAIL` and `$COLOR_LAB_PASSWORD` — use these for any flow that needs auth (rename, save, persistence, etc.).

**Driving controls with agent-browser:**

- Buttons respond to a normal `click`. Run `wait --load networkidle` first so the click doesn't race a re-render.
- For a button inside a modal, run `scrollintoview @ref` before `click @ref`.
- To submit a modal form: `scrollintoview` + `click` the submit button, or focus an input and press Enter.

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
- Server-rendered routes (`/p/*`, `/og/*`) require the Node server.
