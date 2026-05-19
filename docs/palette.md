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

OKLCH is the only format **emitted** by the encoder. Hex is **accepted on parse** for back-compat with shared/saved legacy URLs — converted to OKLCH on load via `urlToColorValue` in `src/utils/url.ts`. Legacy URLs are also canonicalised in the address bar on load — `useUrlSync` calls `navigate(canonicalUrl, { replace: true })` so shared legacy links converge to the OKLCH form for everyone (no back-button pollution).

| Format | URL Example | Parsed Value | Direction |
|--------|-------------|--------------|-----------|
| OKLCH | `64_0.142_329` | `oklch(64% 0.142 329)` | emit + parse |
| Hex (legacy) | `FF0044` | `oklch(...)` (converted) | parse only |

OKLCH lightness in URLs is a percentage (`64` = `64%`). The legacy `0_1` form (`0.64_0.142_329`) is still accepted by the parser.

### Option Keys

| Short | Full Name | Type | Default |
|-------|-----------|------|---------|
| `i` | steps | number | 11 |
| `n` | minLightness | number | 0.2 |
| `x` | maxLightness | number | 0.97 |
| `f` | lightnessCurve | number | 1.5 |
| `c` | chromaCurve | number | 0 |
| `s` | saturation | number | (from color) |
| `o` | saturationOverride | boolean | false |
| `m` | mode | `l`/`d` | `l` (light) |
| `k` | lock | string | - |
| `v` | variant | string | - |

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

### PaletteState

```typescript
interface PaletteState {
  colors: ColorEntry[];             // 1-10 colors
  globalOptions: GlobalScaleOptions;
}
```

---

## State Flow

`paletteStore` is the hub. URL and components are both bidirectional satellites.

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
              from palette.ts ────►│
              (addColor,           │
               removeColor,        ▼
               updateColor, ...) ┌──────────────────────┐
                                 │    paletteStore      │
                                 │  (Zustand, hub)      │
                                 │  - colors            │
                                 │  - globalOptions     │
                                 │  - activeColorId     │
                                 └────────┬─────────────┘
                                          │
                                  read ↑↓ act
                                          │
                                 ┌────────▼─────────┐
                                 │   usePalette()   │  thin wrapper +
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
                                 │  ColorSelector, Scale, ... │
                                 └────────────────────────────┘
```

Components never read `paletteStore` directly — always via `usePalette`.

### Active color tracking

`activeColorId: string | null` lives on the store (`src/stores/paletteStore.ts`). It marks which `ColorEntry` is currently focused in the sidebar — drives highlight, scroll-into-view, and the active-slider panel.

- Initial value: first color's `id` (`paletteStore.ts:25`)
- Set explicitly by `setActiveColor(id)` action
- Auto-updated by `addColor` (new color becomes active) and `removeColor` (falls back to a neighbor)
- Surfaced through `usePalette()` for component consumption
- **Not persisted in URL** — ephemeral UI state, reset on reload

---

## Key Functions

### `src/utils/palette.ts`

| Function | Purpose |
|----------|---------|
| `createPalette(color?)` | Create fresh palette (random color if none) |
| `getDefaultGlobalOptions(color)` | Compute defaults from color's saturation |
| `getDefaultColorName(index)` | Default name for new color slots (`Primary`, `Secondary`, …, `Color N`) |
| `getEffectiveOptions(color, global)` | Merge global + per-color overrides |
| `addColor(state, value, name?)` | Add color (max 10) |
| `removeColor(state, index)` | Remove color (min 1) |
| `updateColor(state, index, updates)` | Update color entry |
| `updateColorOverrides(state, index, overrides)` | Merge per-color overrides |
| `clearColorOverrides(state, index)` | Remove all per-color overrides |
| `updateGlobalOptions(state, updates)` | Update global options |
| `resetGlobalOptions(state)` | Reset to defaults (keeps colors) |
| `resetPalette()` | Full reset (new random color) |

Also exports the constant `MAX_COLORS = 10`.

### `src/utils/url.ts`

| Function | Purpose |
|----------|---------|
| `serializePaletteToUrl(state)` | `PaletteState` → URL path + query (OKLCH-only output) |
| `parsePaletteFromUrl(url)` | URL string → `ParsedPalette \| null` (accepts hex on parse for back-compat) |
| `getPaletteIdFromUrl(search)` | Extract `id` from query string |
| `updatePaletteIdInUrl(url, id)` | Add or remove `id` query param |

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
- **Max colors**: 10 (`MAX_COLORS` in `src/utils/palette.ts`)
- **Steps range**: Determined by colorizr (typically 3-21)
- **Lightness range**: 0-1 (minLightness < maxLightness)
- **Color IDs**: UUIDs assigned by `addColor` / `createPalette`. Not user-facing, not in URLs.
