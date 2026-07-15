# CLAUDE.md

Operating manual. Commands, invariants, and mechanics that are wrong or invisible if you only read the tree.

Do not add inventories here — no file lists, no hook lists, no route tables. If it can be derived by reading the source, it does not belong in this file. Structure and rationale go in `docs/`.

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

## Docs

Read the relevant authority before changing behavior in its area. Do not re-derive what these already specify.

- `docs/architecture.md` — how the pieces fit together; start here
- `docs/palette.md` — palette state, URL grammar, sync + identity, color groups
- `docs/color-mode.md` — input mode vs gamut vs URL color formats
- `docs/events.md` — analytics event taxonomy (`.agent/event-migration.md` is a historical record, not the spec)

## Invariants

Violating any of these breaks something that will not show up in a typecheck. The clause after each rule is why it exists — keep it, or the rule gets reverted by the next person.

- **The URL is the single source of truth for the palette.** The store follows it; never add a competing persisted copy.
- **Commit in-place palette edits with `window.history.pushState`/`replaceState`, never `router.*`.** Router navigation round-trips the server on these force-dynamic routes, which closes open popovers and desyncs controlled sliders mid-edit. `router.push` is for genuine navigation (New Palette); `router.replace` is for identity strips only.
- **Never write to the URL from a slider handler.** URL writes are paused while `data-interacting` is set (`useSliderInteraction`, observed by `useUrlSync`) so a drag flushes exactly one history entry on release instead of hundreds. Bypassing the pause floods the back button.
- **Keep static pages out of the `(generator)` route group.** Only `/` and `/p/*` mount `GeneratorStoreProvider`, which calls `useSearchParams` and forces client rendering on everything beneath it.
- **`generatorStore` is a per-request factory (`createGeneratorStore`), not a module singleton.** These routes are `force-dynamic`; a singleton would leak one visitor's palette into another's SSR output.
- **The group filter is a view lens.** Only `Palette/Grid` and `Palette/List` read it. Export, share, and the sidebar color list always act on the whole palette.
- **`resetGroupFilter`/`pruneGroupFilter` must never touch `showPreview`** (unlike `setGroupFilter`/`toggleGroupFilter`). They are bookkeeping, and `showPreview` is persisted — collapsing the preview as a side effect of cleanup is a visible bug.
- **Put new constants in `src/config/`, in the file matching their kind.** Never inline them in a component or util.

## Testing

Tests in `tests/` mirroring `src/` structure. Use `.test.ts` or `.test.tsx` extensions.

**Path aliases (tsconfig):**

- `~/test-utils` → `tests/__setup__/test-utils.tsx`
  - custom render wrapping `ThemeProvider` + `MockAuthProvider`. `next/navigation` is mocked in `~/test-mocks` (no router in the wrapper); `GeneratorStoreProvider` is mocked to a passthrough. Supports `initialEntries` (seeds the mocked route via `setMockRoute`) and `authState` for auth context overrides.
- `~/test-mocks` → `tests/__setup__/mocks.ts`
  - mocks `next/navigation`, `next-themes`, and `~/utils/gamut`.

**Available mocks** (import from `~/test-mocks`):

- `mockClipboard.writeText` — Navigator clipboard
- `mockAddToast` — HeroUI toast function
- `mockRouter` / `setMockRoute(url)` — `next/navigation` router + route seeding
- `mockSetTheme` / `setMockTheme(theme)` — `next-themes` theme control
- `mockIsP3Supported` — gamut capability toggle (`~/utils/gamut`)
- `getGeneratorStore()` — handle to the shared per-test generator store

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

### E2E Testing

Snapshots are generated locally on macOS, not on the Linux CI runner. The differences are expected and absorbed by `maxDiffPixelRatio` — do not regenerate snapshots to chase a CI diff.

## Browser Testing

**ALWAYS use `agent-browser`** for any browser work — screenshots, navigation, interaction, manual verification.

Before first browser command: invoke the `agent-browser` skill via the Skill tool. The skill has workflow patterns + ref/selector usage that the CLI flags don't show.

```bash
agent-browser open https://color-lab.localhost
agent-browser set viewport 1440 900   # default 1280x633 is cramped; 1440 matches the e2e layout
```

Test account credentials are in the shell as `$COLOR_LAB_EMAIL` and `$COLOR_LAB_PASSWORD` — use these for any flow needing auth (save, persistence).

**Driving controls:**

- Buttons respond to a normal `click`. Run `wait --load networkidle` first so the click doesn't race a re-render.
- To submit the Login modal form: `scrollintoview` + `click` the submit button, or focus an input and press Enter.
- After any state-changing action (click/fill/nav/scroll/tab), `wait` on a concrete signal (`@ref`, `--text`, `--url`, `--load networkidle`) before the next dependent command; re-`snapshot` before reusing refs. Batch only independent read-only commands.
- Prefer `click @ref` over `find role … click` — `find` clicks covered points silently. After scrolling, scroll up to clear the sticky header before clicking near the top.
- For "click again to confirm" controls (e.g. Remove color), send both clicks in one command with no `snapshot`/`screenshot` between them.
- Use normal-viewport `screenshot`; `--full` distorts the responsive/collapsed-sidebar layout.
- Wrap `eval` return values in `JSON.stringify(...)`.
- Wrap commands in `timeout 30`; recover a frozen page by re-`open`ing the palette URL (state lives in the URL).

## Deployment (Dokploy)

Hosted at `lab.colormeup.co` as a Dockerized Next.js standalone server (`output: 'standalone'`). Build type `Dockerfile`; multi-stage (`deps` → `builder` → `runner`) on `node:24-alpine`; runs as unprivileged `nextjs` on port 3000.

- **`NEXT_PUBLIC_*` vars are inlined into the client bundle at build time.** They must be passed as Docker build args / be present for `next build` — supplying them only at runtime ships a bundle with no Firebase config and no analytics.
- `/p/*` and `/og/*` are server-rendered and require the Node server; they cannot be exported statically.
