# CLAUDE.md

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
- **generatorStore** (`src/stores/generatorStore.ts`): Colors array + global scale options + transient per-session chart view-state (`toggleChart`/`setAllCharts`; `resetAdvancedOptions` resets curves). **Not a global singleton** — a per-request store factory (`createGeneratorStore(initialState?)`) provided via Context, consumed via `useGeneratorStoreApi()` / `useGenerator()`. Seeded from the URL — see [URL State](#url-state--the-url-is-the-single-source-of-truth).
- **palettesStore** (`src/stores/palettesStore.ts`): Saved-palettes list state

### Hooks

- **useAuth** (`src/hooks/useAuth.ts`): Authentication context consumer (user, login/logout methods)
- **useGenerator** (`src/hooks/useGenerator.ts`): Primary hook for palette state + actions + computed values (baseSaturation, defaultOptions)
- **useGeneratorStore** (`src/hooks/useGeneratorStore.ts`): Consumes the per-request generatorStore from `GeneratorStoreContext`
- **useTheme** (`src/hooks/useTheme.ts`): Dark mode via `next-themes` (`resolvedTheme`/`setTheme`) with an `isMounted` hydration guard
- **useUrlSync** (`src/hooks/useUrlSync.ts`): Bidirectional URL ↔ generator-store sync, called once in Generator — see [URL State](#url-state--the-url-is-the-single-source-of-truth)
- **usePaletteIdSync** (`src/hooks/usePaletteIdSync.ts`): Validates the saved-palette `?id=` and manages palette identity — see [URL State](#url-state--the-url-is-the-single-source-of-truth)
- **useSavedPalettesList** (`src/hooks/useSavedPalettes.ts`): Store-free saved-list CRUD (fetch/delete/favorite) — used by `/palettes`, outside the generator provider
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

The palette lives in the URL; the store follows it, never a competing persisted copy. **Read `docs/palette.md` (Runtime Sync &amp; Identity) before touching palette/navigation behavior** — it is the authority for store seeding, the `useUrlSync` / `usePaletteIdSync` lifecycle, and the history/router split.

- **URL shape**: `/p/{name}-{value}[-{overrides}]/...?{globalOpts}&id={savedId}` — colors (OKLCH `L_C_H`) in the path, global options + `id` in the query. All encode/decode lives in `src/utils/url.ts`; that file + `docs/palette.md` are the authority for keys/format — don't re-derive them.
- **Routes**: `/` and `/p/*` are `force-dynamic` and the only routes that mount `GeneratorStoreProvider` (`app/(generator)/layout.tsx`). Static pages must stay out of that subtree (the provider calls `useSearchParams`).
- **Sync hooks**, called once in Generator: `useUrlSync` (URL ↔ store) and `usePaletteIdSync` (saved-palette `?id=`).
- **In-place palette edits commit via `window.history.pushState`/`replaceState` (`useUrlSync`), NOT `router.*`** — router navigation does a server round-trip on these force-dynamic routes that desyncs mid-edit UI; do not change these to router calls. New Palette (`Header.tsx`) uses `router.push` (genuine navigation); identity strips use `router.replace`.

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
/p/*                     app/(generator)/p/[[...slug]]/page.tsx → Generator, palette in URL (force-dynamic)
/palettes                app/palettes/page.tsx        → Palettes (saved list)
/about /privacy /terms   app/{about,privacy,terms}/page.tsx
/auth/callback           app/auth/callback/page.tsx   → AuthCallback (OAuth/magic link)
/og/*                    app/og/[...slug]/route.tsx   → dynamic OG image (next/og)
```

The Generator UI lives in `src/containers/Generator/` (`index.tsx`, `Panel/` (`index.tsx` + `BottomBar.tsx`), `AdvancedOptions.tsx`, `ScrollLock.tsx`) and the palette UI in `src/containers/Palette/` (`Header`, `Scale`, `Swatch`, `Options`, `GamutToggle`). `ColorList`/`ColorItem` (SRGB | OKLCH) live in `src/containers/ColorList/`. Responsive layout is handled by `Panel/index.tsx`.

Additional UI surfaces:

- `src/components/ScaleColorOptions/`: Scale curve editors (`ChromaCurve`, `HueShift`, `LightnessCurve`, `LightnessRange`); rendered in `ColorList/ColorActions` inside a `Collapse`.
- `src/containers/ColorCharts/`: Per-color chroma/lightness/hue distribution charts; open state in `generatorStore` (`toggleChart`/`setAllCharts`).
- `src/components/ColorPresets.tsx`: Applies `DESIGN_SYSTEM_PRESETS` from `src/config/presets.ts`.
- `src/containers/Preview/Typography.tsx`: Typography tab in Preview.
- `src/components/CollapsibleMenu.tsx`: CSS-only responsive collapse (inline at `xsm`+, dropdown below 400px).

### Key Types

- **ColorEntry**: `{ id, name, value, overrides? }`
- **GlobalScaleOptions**: `{ steps, saturation, saturationOverride, mode, chromaCurve, lightnessCurve, hueShift, minLightness, maxLightness }`. `chromaCurve`/`lightnessCurve`/`hueShift` are scalar **or** object: scalar = Simple mode, `{ low, high }` = Range, `chromaCurve` also accepts a movable peak. See `src/types.ts` (`GlobalScaleOptions`, `DefaultScaleOptions`, `EffectiveScaleOptions`).

### Core Utilities

- `src/config/firebase.ts`: `firebaseConfig` (from `NEXT_PUBLIC_FIREBASE_*` env vars) + `PALETTES_COLLECTION`
- `src/utils/firebase.ts`: Firebase app init, `auth` + `db` exports (Firestore Lite); reads config from `src/config/firebase.ts`
- `src/services/palettes.ts`: Firestore CRUD for saved palettes
- `src/utils/color.ts`: Color helpers (chroma percentage, random color)
- `src/utils/gamut.ts`: P3 capability detection (`isP3Supported`), SSR `window` guard
- `src/utils/export.ts`: Generate CSS/SCSS/Tailwind/SVG exports
- `src/utils/generator.ts`: Pure functions for palette CRUD operations (used by store)
- `src/utils/scale-options.ts`: Curve normalization + Simple/Split mode helpers (`isSameOptionValue`, `isCurvePeak`, `getChromaFraction`); shared by URL, store, and curve editors
- `src/utils/url.ts`: URL encoding/decoding for shareable palettes
- `src/config/presets.ts`: `DESIGN_SYSTEM_PRESETS` (tailwind/material/bootstrap/opencolor) lightness/chroma/hueShift configs applied by `ColorPresets`

## Key Dependencies

- **colorizr**: Color manipulation, `scale()` function for generating tone steps
- **Zustand**: State management (stores in `src/stores/`)
- **Next.js 16 (App Router)**: Routing + navigation via `next/navigation`
- **HeroUI V2**: Component library with Tailwind CSS 4
- **next-themes**: Light/dark theme (class strategy)
- **Firebase**: Authentication (with Identity Platform) + Firestore Lite for palette storage
- **@sentry/nextjs**: Error/perf monitoring (client/server/edge via `instrumentation.ts`)
- **posthog-js**: Product analytics (page views + events), reverse-proxied via `/ingest`
- **@gilbarbara/hooks**: `useMemoDeepCompare`, `useToggle`, `useBreakpoint`, `useSetState`

## Testing

Tests in `tests/` mirroring `src/` structure. Use `.test.ts` or `.test.tsx` extensions.

**Path aliases (tsconfig):**

- `~/test-utils` → `tests/__setup__/test-utils.tsx`
  - custom render wrapping `ThemeProvider` + `MockAuthProvider`. `next/navigation` is mocked in `~/test-mocks` (no router in the wrapper); `GeneratorStoreProvider` is mocked to a passthrough. Supports `initialEntries` (seeds the mocked route via `setMockRoute`) and `authState` for auth context overrides.
- `~/test-mocks` → `tests/__setup__/mocks.ts`
  - mocks `next/navigation`, `next-themes`, and `~/utils/gamut`. Exports: `mockRouter`, `setMockRoute(url)`, `mockSetTheme`, `setMockTheme(theme)`, `mockAddToast`, `mockIsP3Supported`, `getGeneratorStore()`, `mockClipboard`.

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

### E2E Testing

The snapshots are generated locally on macOS, not on the Linux CI runner, and the differences are expected and handled by `maxDiffPixelRatio` config.

## Browser Testing

**ALWAYS use `agent-browser`** for any browser work — screenshots, navigation, interaction, manual verification.

Before first browser command: invoke `agent-browser` skill via Skill tool. Skill has workflow patterns + ref/selector usage CLI flags don't show.

```bash
agent-browser open https://color-lab.localhost
agent-browser set viewport 1440 900   # default 1280x633 is cramped; 1440 matches the e2e layout
```

### Logged-in flows

Test account credentials are available in the shell as `$COLOR_LAB_EMAIL` and `$COLOR_LAB_PASSWORD` — use these for any flow that needs auth (save, persistence, etc.).

**Driving controls with agent-browser:**

- Buttons respond to a normal `click`. Run `wait --load networkidle` first so the click doesn't race a re-render.
- To submit the Login modal form: `scrollintoview` + `click` the submit button, or focus an input and press Enter.
- After any state-changing action (click/fill/nav/scroll/tab), `wait` on a concrete signal (`@ref`, `--text`, `--url`, `--load networkidle`) before the next dependent command; re-`snapshot` before reusing refs. Batch only independent read-only commands.
- Prefer `click @ref` over `find role … click` — `find` clicks covered points silently. After scrolling, scroll up to clear the sticky header before clicking near the top.
- For "click again to confirm" controls (e.g. Remove color), send both clicks in one command with no `snapshot`/`screenshot` between them.
- Use normal-viewport `screenshot`; `--full` distorts the responsive/collapsed-sidebar layout.
- Wrap `eval` return values in `JSON.stringify(...)`.
- Wrap commands in `timeout 30`; recover a frozen page by re-`open`ing the palette URL (state lives in the URL).

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
- The 6 `NEXT_PUBLIC_FIREBASE_*` and `NEXT_PUBLIC_POSTHOG_KEY` are inlined into the client bundle at **build time**, so they must be passed as Docker build args (Dokploy) / present for `next build` — not just at runtime.
- Server-rendered routes (`/p/*`, `/og/*`) require the Node server.
