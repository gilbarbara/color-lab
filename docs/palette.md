# Palette System

Technical reference for the multi-color palette system.

## Design Principles

- **URL = Source of Truth**: No localStorage, everything encoded in URL
- **No IDs**: Color name + position = identity
- **Human-readable URLs**: No base64, path-based format
- **Max 10 colors** per palette

---

## URL Format

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

| Format | URL Example | Parsed Value |
|--------|-------------|--------------|
| Hex | `FF0044` | `#FF0044` |
| OKLCH | `0.64_0.142_329` | `oklch(0.64 0.142 329)` |

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

```
# Simple (2 colors)
/p/Primary-FF0044/Secondary-698CE0

# OKLCH color
/p/Primary-0.64_0.142_329

# Per-color overrides
/p/Primary-FF0044-x:0.95,m:d/Secondary-698CE0

# Global options
/p/Primary-FF0044?f=1.8&i=15

# Combined
/p/Primary-FF0044-x:0.95/Secondary-0.64_0.142_329?f=1.8&o=1

# Spaces in names
/p/Brand+Primary-FF0044/Brand+Secondary-698CE0
```

---

## Types

### ColorEntry

```typescript
interface ColorEntry {
  name: string;
  value: string;                    // '#FF0044' or 'oklch(0.64 0.142 329)'
  overrides?: Partial<ScaleOptions>;
}
```

### GlobalScaleOptions

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

```
URL Navigation
     │
     ▼
┌─────────────────┐
│  useUrlSync()   │  Parses URL → hydrates store
│  (in Generator) │  Observes store → updates URL
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  paletteStore   │  Zustand store (source of truth at runtime)
│                 │  Uses pure functions from palette.ts
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  usePalette()   │  Hook exposing state + actions + computed values
│                 │  - baseSaturation (from first color)
│                 │  - defaultOptions (computed defaults)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Components    │  ColorSelector, ColorOptions, Scale, etc.
└─────────────────┘
```

---

## Key Functions

### `src/utils/palette.ts`

| Function | Purpose |
|----------|---------|
| `createPalette(color?)` | Create fresh palette (random color if none) |
| `getDefaultGlobalOptions(color)` | Compute defaults from color's saturation |
| `getEffectiveOptions(color, global)` | Merge global + per-color overrides |
| `addColor(state, value, name?)` | Add color (max 10) |
| `removeColor(state, index)` | Remove color (min 1) |
| `updateColor(state, index, updates)` | Update color entry |
| `updateColorOverrides(state, index, overrides)` | Merge per-color overrides |
| `clearColorOverrides(state, index)` | Remove all per-color overrides |
| `updateGlobalOptions(state, updates)` | Update global options |
| `resetGlobalOptions(state)` | Reset to defaults (keeps colors) |
| `resetPalette()` | Full reset (new random color) |
| `isValidPaletteState(data)` | Type guard for validation |

### `src/utils/url.ts`

| Function | Purpose |
|----------|---------|
| `serializePaletteToUrl(state)` | State → URL path + query |
| `parsePaletteFromUrl(segments, params)` | URL → PaletteState |
| `colorToPath(color)` | Single color → `/hex/...` or `/oklch/...` |
| `parseColorFromParams(params)` | Route params → color string |

---

## Saturation Behavior

The `saturationOverride` flag controls saturation handling:

- **`saturationOverride: false`** (default): Each color uses its natural saturation. The global `saturation` value is ignored.

- **`saturationOverride: true`**: All colors use the global `saturation` value, overriding their natural saturation.

The `saturation` value is initialized from the first color's chroma (converted to 0-100 percentage).

---

## Constraints

- **Min colors**: 1 (cannot remove last color)
- **Max colors**: 10
- **Steps range**: Determined by colorizr (typically 3-21)
- **Lightness range**: 0-1 (minLightness < maxLightness)
