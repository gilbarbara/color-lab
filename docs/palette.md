# Palette System

Technical reference for the multi-color palette system.

## Design Principles

- **URL = Source of Truth**: No localStorage, everything encoded in URL
- **Stable IDs**: each `ColorEntry` has a UUID, used for active-color tracking and store reconciliation (not surfaced in URLs)
- **Human-readable URLs**: No base64, path-based format
- **Max 10 colors** per palette

---

## URL Format

> Color values in the URL are always OKLCH. See [`color-mode.md`](./color-mode.md) for the full color-format contract (input mode, palette display, URL).

```
/p/{Name}-{Value}[-{Options}]/...?{GlobalOptions}
```

### Delimiters

| Char | Purpose |
|------|---------|
| `/` | Between colors |
| `-` | Between name, value, options |
| `_` | Between L, C, H in OKLCH values |
| `:` | Between key:value in per-color options |
| `,` | Between multiple per-color options |
| `?` | Global options (query params) |
| `+` | Space in color names |

### Color Values

OKLCH is the only format **emitted** by the encoder. Hex is **accepted on parse** for back-compat with shared/saved legacy URLs — converted to OKLCH on load via `urlToColorValue` in `src/utils/url.ts`. Legacy URLs are also canonicalised in the address bar on load — `useUrlSync` calls `window.history.replaceState(null, '', canonicalUrl)` so shared legacy links converge to the OKLCH form for everyone (no back-button pollution). See [Runtime Sync &amp; Identity](#runtime-sync--identity).

| Format | URL Example | Parsed Value | Direction |
|--------|-------------|--------------|-----------|
| OKLCH | `64_0.142_329` | `oklch(64% 0.142 329)` | emit + parse |
| Hex (legacy) | `FF0044` | `oklch(...)` (converted) | parse only |

OKLCH lightness in URLs is a percentage (`64` = `64%`). The legacy `0_1` form (`0.64_0.142_329`) is still accepted by the parser.

### Option Keys

| Short | Full Name          | Type     | Default      |
|-------|--------------------|----------|--------------|
| `i`   | steps              | number   | 11           |
| `n`   | minLightness       | number   | 0.26         |
| `x`   | maxLightness       | number   | 0.97         |
| `f`   | lightnessCurve     | number   | 1.3          |
| `c`   | chromaCurve        | number   | 0            |
| `s`   | saturation         | number   | (from color) |
| `o`   | saturationOverride | boolean  | false        |
| `m`   | mode               | `l`/`d`  | `l` (light)  |
| `k`   | lock               | string   | -            |
| `v`   | variant            | string   | -            |

### URL Examples

**Emitted form** (what `serializePaletteToUrl` produces today):

```
# Simple (2 colors)
/p/Primary-63.269_0.25404_19.902/Secondary-65.133_0.13204_265.764

# Per-color overrides
/p/Primary-63.269_0.25404_19.902-x:0.95,m:d/Secondary-65.133_0.13204_265.764

# Global options
/p/Primary-63.269_0.25404_19.902?f=1.8&i=15

# Spaces in names
/p/Brand+Primary-63.269_0.25404_19.902/Brand+Secondary-65.133_0.13204_265.764
```

**Legacy input form** (still parsed for back-compat — rewritten to canonical OKLCH in the address bar on load):

```
# Hex value
/p/Primary-FF0044/Secondary-698CE0

# OKLCH lightness as 0-1 (now emitted as percentage)
/p/Primary-0.64_0.142_329

# Mixed value formats
/p/Primary-FF0044-x:0.95/Secondary-0.64_0.142_329?f=1.8&o=1
```

---

## Types

### ColorEntry

```typescript
interface ColorEntry {
  id: string;                       // UUID, assigned on creation
  name: string;
  overrides?: Partial<ScaleOptions>;
  value: OklchString;               // branded; minted only via toOklch()
}
```

### OklchString

Storage invariant is enforced at the type level. `OklchString` is a branded `string` defined in `src/types.ts`:

```typescript
type OklchString = string & { readonly __brand: 'OklchString' };
```

The only constructor is `toOklch(value: string): OklchString` in `src/utils/color.ts`, which validates via `parseCSS` (throws on invalid input) and canonicalises via `formatCSS({ format: 'oklch' })`. Every write to `ColorEntry.value` flows through `toOklch()` — `addColor`, `createPalette`, the URL parser (`urlToColorValue`), and the in-app color edit handlers all wrap their inputs at the boundary. Direct `as OklchString` casts are a code smell.

### GlobalScaleOptions

Extends `ScaleOptions` (`Omit<ScaleOptionsBase, 'format'>` from colorizr), which contributes `lock`, `variant`, and `mode`.

```typescript
interface GlobalScaleOptions extends ScaleOptions {
  chromaCurve: number;
  lightnessCurve: number;
  maxLightness: number;
  minLightness: number;
  saturation: number;
  saturationOverride: boolean;      // If false, use color's natural saturation
  steps: number;
}
```

### GeneratorState

```typescript
interface GeneratorState {
  colors: ColorEntry[];             // 1-10 colors
  globalOptions: GlobalScaleOptions;
}
```

---

## State Flow

`generatorStore` is the hub. URL and components are both bidirectional satellites.

```
                          ┌──────────────────┐
                          │   URL (router)   │
                          └────────┬─────────┘
                                   │
                          parse ↑↓ push
                                   │
                          ┌────────▼─────────┐
                          │   useUrlSync()   │  bidirectional bridge,
                          │  (in Generator)  │  called once at mount
                          └────────┬─────────┘
                                   │
              pure functions       │
              from generator.ts ────►│
              (addColor,           │
               removeColor,        ▼
               updateColor, ...) ┌──────────────────────┐
                                 │    generatorStore      │
                                 │  (Zustand, hub)      │
                                 │  - colors            │
                                 │  - globalOptions     │
                                 │  - activeColorId     │
                                 └────────┬─────────────┘
                                          │
                                  read ↑↓ act
                                          │
                                 ┌────────▼─────────┐
                                 │   useGenerator()   │  thin wrapper +
                                 │                  │  derived values:
                                 │                  │  - baseSaturation
                                 │                  │  - defaultOptions
                                 │                  │  - generatorUrl
                                 │                  │  - activeColorId
                                 └────────┬─────────┘
                                          │
                                          ▼
                                 ┌────────────────────────────┐
                                 │    Components              │
                                 │  ColorItem, Scale, ... │
                                 └────────────────────────────┘
```

Components never read `generatorStore` directly — always via `useGenerator`.

### Active color tracking

`activeColorId: string | null` lives on the store (`../src/stores/generatorStore.ts`). It marks which `ColorEntry` is currently focused in the sidebar — drives highlight, scroll-into-view, and the active-slider panel.

- Initial value: first color's `id` (`generatorStore.ts:25`)
- Set explicitly by `setActiveColor(id)` action
- Auto-updated by `addColor` (new color becomes active) and `removeColor` (falls back to a neighbor)
- Surfaced through `useGenerator()` for component consumption
- **Not persisted in URL** — ephemeral UI state, reset on reload

---

## Runtime Sync & Identity

How the URL and store stay in sync at runtime. Written from `../src/hooks/useUrlSync.ts`, `../src/hooks/usePaletteIdSync.ts`, and `../src/providers/GeneratorStoreProvider.tsx` — the source is the authority; line refs are anchors, not contracts.

### Routing constraint

`/` and `/p/*` are `force-dynamic` (SSR per request) and the only routes that mount `GeneratorStoreProvider` (`../app/(generator)/layout.tsx`). The provider calls `useSearchParams`, which would force any page in its subtree to client-render — so static pages (`/about`, `/privacy`, …) must stay out of that tree.

### Store seeding

`GeneratorStoreProvider` creates the per-request store once via `useRef`. On `/p/*` it parses the URL (`parsePaletteFromUrl`); elsewhere (or when the URL is unparseable) it reuses the server-generated `fallbackPalette` prop (created once in the generator layout). Both server and first client render run the same branch on the same input, so SSR and hydration match — generating a random palette independently on each side is what previously caused hydration mismatches.

### `useUrlSync` — three effects

Called once in Generator. The store follows the URL; there is no competing persisted copy.

1. **URL → store (hydrate).** Runs on nav / back-forward / address-bar change. Guard: returns early if `decoratePaletteUrl(storeUrl, { id }) === currentUrl`. Otherwise applies URL state, **preserving existing color `id`s by index** to avoid needless re-renders. Dropped colors → toast + `history.replaceState` to the cleaned URL; legacy hex / 0–1-OKLCH forms → `history.replaceState` to canonical; unparseable `/p/…` → `replaceState` reflecting the already-seeded store. An `applyingFromUrl` ref marks this write so effect 3 skips it — without it, applying the URL on `popstate` re-commits the same URL and the extra `pushState` clobbers the forward-history entry, breaking the Forward button.
2. **Interaction pause.** A `MutationObserver` watches `data-interacting="true"` (set by ColorPicker / ChannelSliders). While set, URL writes pause; on release it flushes once. Keeps a drag from churning history.
3. **store → URL (commit).** A store subscription fires on `colors`/`globalOptions` change → commit with `push`; on `name`-only change → commit with `replace` (metadata isn't worth a history entry). Skips when paused or `applyingFromUrl`. Also seeds `appStore.sessionPalettePath` for the palette the provider created (no store change fires for it).

### History API, not router

Palette commits use `window.history.pushState`/`replaceState`, **not** `router.push`/`router.replace`. On these force-dynamic routes, router navigation does a server round-trip that re-renders the generator subtree — closing an open popover and desyncing a controlled slider mid-edit. `pushState`/`replaceState` integrate with the Next router (`usePathname`/`useSearchParams` update, back/forward works) without that round-trip. Do not change these to router calls.

`router.replace` (+ `ROUTER_NAVIGATION_OPTIONS`, `{ scroll: false }`) is used **only** for saved-palette identity strips (below) — a genuine navigation correction, not a palette edit.

### Saved-palette identity (`usePaletteIdSync`)

Called once alongside `useUrlSync`; owns the `?id=` query only (colors are `useUrlSync`'s job). Auth-gated:

- Validates the id against the `palettesStore` cache first, then the API.
- On a match owned by the user: canonicalizes the stored URL and fire-and-forget-migrates it in Firestore when the structural form changed (migration write omits `updatedAt`), then `setPalette` writes `appStore` `paletteId`/`paletteName` and seeds the working store's name.
- Strips the id with `router.replace` when unauthenticated, or not-found / forbidden / not-owned, and clears `appStore`.

### Logo restore

`appStore.sessionPalettePath` is an in-memory convenience (written by `useUrlSync`, not persisted) so the Header logo can return to the palette being worked on. Not a source of truth; reload falls back to `/`.

---

## Key Functions

### `../src/utils/generator.ts`

| Function | Purpose |
|----------|---------|
| `createPalette(color?)` | Create fresh palette (random color if none) |
| `getDefaultGlobalOptions(color)` | Compute defaults from color's saturation |
| `getDefaultColorName(index)` | Default name for new color slots (`Primary`, `Secondary`, …, `Color N`) |
| `getEffectiveOptions(color, global)` | Merge global + per-color overrides |
| `addColor(state, value, name?)` | Add color (max 10) |
| `removeColor(state, id)` | Remove color (min 1) |
| `updateColor(state, id, updates)` | Update color entry |
| `setColorOverride(state, id, updates)` | Merge per-color overrides (strips keys equal to global) |
| `clearColorOverrides(state, id)` | Remove all per-color overrides |
| `updateGlobalOptions(state, updates)` | Update global options |
| `resetGlobalOptions(state)` | Reset to defaults (keeps colors) |
| `resetPalette()` | Full reset (new random color) |

Also exports the constant `MAX_COLORS = 10`.

### `src/utils/url.ts`

| Function | Purpose |
|----------|---------|
| `serializePaletteToUrl(state)` | `GeneratorState` → structural URL path + global-options query (OKLCH-only output) |
| `parsePaletteFromUrl(url)` | URL string → `ParsedPalette \| null` (accepts hex on parse for back-compat) |
| `getPaletteIdFromUrl(search)` | Extract `id` from query string (`null` if absent) |
| `decoratePaletteUrl(url, { name?, id? })` | Add/keep/remove `name` + `id` query params; tri-state per field (`undefined` keeps, `null` removes, string sets). Single source for ordering (name before id, id terminal) |
| `stripPaletteIdentity(url)` | Remove both `name` and `id` — `decoratePaletteUrl(url, { id: null, name: null })` |
| `canonicalizeUrl(url)` | Round-trip parse + serialize to current OKLCH form; returns input unchanged if parse fails or any color dropped; preserves `id` |
| `buildUrl(slug, searchParams)` | Reconstruct `/p/{slug}?{query}` from Next route params (flattens array-valued params) |
| `colorId(segment, index)` | Stable hash-based color id from segment + index (SSR/CSR parity; avoids `uuid()` hydration drift) |

Also exports type `ParsedPalette = { state: PaletteState; dropped: string[] }` — `dropped` lists named slots whose segments failed to parse.

---

## Saturation Behavior

The `saturationOverride` flag controls saturation handling:

- **`saturationOverride: false`** (default): Each color uses its natural saturation. The global `saturation` value is ignored.

- **`saturationOverride: true`**: All colors use the global `saturation` value, overriding their natural saturation.

The `saturation` value is initialized from the first color's chroma (converted to 0-100 percentage).

---

## Constraints

- **Min colors**: 1 (cannot remove last color)
- **Max colors**: 10 (`MAX_COLORS` in `../src/utils/generator.ts`)
- **Steps range**: Determined by colorizr (typically 3-21)
- **Lightness range**: 0-1 (minLightness < maxLightness)
- **Color IDs**: UUIDs assigned by `addColor` / `createPalette`. Not user-facing, not in URLs.
