# Color Mode Architecture

Contract for how color formats (OKLCH, HSL, RGB/HEX) flow through the app.

> **TL;DR** — Three orthogonal concerns share the word "mode" today. This doc names them, scopes them, and fixes their interaction. Storage is always OKLCH. HSL/RGB/HEX are surfaces, not state.

---

## Why OKLCH-first

Color Lab is built around perceptual, wide-gamut color. Internal storage uses OKLCH because it is:

- **Lossless within P3** — no clipping when colors live in display-P3 space
- **Perceptually uniform** — equal lightness/chroma steps look equal to the eye
- **Compatible with `colorizr.scale()`** — the scale generator consumes OKLCH directly

HSL/RGB/HEX are **input affordances and display surfaces**, not storage formats. They exist so users fluent in those models can dial colors and read familiar values. They are never the source of truth.

---

## Three orthogonal axes

| Axis | Scope | Drives | Persisted in URL? |
| --- | --- | --- | --- |
| **Input mode** | per ColorItem (UI ephemeral) | Sliders + text input format | No |
| **Gamut mode** | global, app-wide | Swatch rendering, tooltip, clipboard copy | No — persisted per-device in `localStorage` |
| **URL format** | global, fixed | URL path serialization | N/A — always OKLCH |

Each axis is independent. None reads from another. Conflating them is the root cause of past regressions.

---

## 1. Input mode

**Location:** `ColorItem` (sidebar), one toggle per color.

**Values:** `OKLCH` | `HSL` | `RGB`

**What it controls:**

- `ChannelSliders` component — which channel set renders (L/C/H, H/S/L, or R/G/B)
- Text input format under the color name — `oklch(...)`, `#hex`, or whatever the active mode renders

**What it does NOT control:**

- Stored `colorEntry.value` (always OKLCH)
- Swatch rendering
- URL output
- Exports

**Lossy behavior:** Dragging HSL or RGB sliders on a color whose OKLCH is outside sRGB will clip the chroma. The slider operates in sRGB by definition — the resulting OKLCH is whatever sRGB triple maps back. This is user choice: they picked the sRGB-bound input.

**Surface for the user:** A gamut warning icon (triangle, in the input row) appears when the current OKLCH value is outside sRGB. It signals "this color cannot be expressed losslessly in your current input mode." Switching mode does not change the value; it only changes the slider math available for the next edit.

---

## 2. Gamut mode

**Location:** Palette header → the **Display** popover (`Display Options` trigger), alongside the view switch.

**Values:** `p3` | `srgb`

**Two coupled concepts:**

- **Capability** — static, derived from `window.matchMedia('(color-gamut: p3)')`. Computed once at module load via `isP3Supported()` in `src/utils/gamut.ts`. Never changes within a session. Surfaced as `data-p3-supported` on `<html>`.
- **Active gamut** — always user-selectable, regardless of capability. Lives in `appStore.gamut` and is persisted. Surfaced as `data-gamut` on `<html>`.

Capability and active gamut are independent: an unverified-P3 display can still be switched to `p3`. Capability only seeds the default and drives an advisory message — it does not gate the control.

**What it controls:**

Painting is **CSS-only**. Every color surface emits both an OKLCH and a hex custom property, and a Tailwind variant picks one — so there is no JS branch on the render path, and therefore no hydration mismatch. Surfaces: `Palette/Swatch.tsx`, `ColorBox.tsx`, `Preview/Header.tsx`, `ContrastGrid/Row.tsx`.

A small number of readers do consume `appStore.gamut` in JS, for text rather than paint:

- `Swatch` — clipboard payload on click, and the tooltip: `oklch(...)` in `p3`, `#RRGGBB` in `srgb`
- `ExportPalette` — the per-color chip in the selection list (display only; **not** the exported code)

**What it does NOT control:**

- Stored `colorEntry.value` (always OKLCH)
- Input mode in the sidebar (axis #1)
- URL output (axis #3 — always OKLCH)
- Generated scale (always OKLCH internally)
- Export output — the drawer has its own color-format setting (OKLCH / Hex / HSL / RGB), independent of both other axes
- Color Info modal (always shows side-by-side OKLCH/hex comparison regardless of mode)

**Scope:** Global to the app. All palettes and routes read the same value.

**Default:** A persisted `appStore.gamut` wins. With nothing persisted, it matches detected capability — P3-capable display → `p3`, otherwise `srgb`. The pre-paint script in `app/layout.tsx` applies this before React mounts, so the first paint is already correct.

**Toggle UI** (`src/containers/Palette/DisplayMenu/Gamut.tsx`):

A `RadioGroup` labelled `Color gamut options`, with `P3` ("Wide gamut. Vivid colors.") and `SRGB` ("Standard gamut. Universal compatibility.").

Both options always render and stay enabled. When capability is `srgb`, an advisory line — "We couldn't verify P3 support on your display." — appears below, shown purely in CSS via the `p3-unsupported:` variant (`src/index.css`). It informs; it does not restrict.

**Lossy behavior:** In `srgb` mode, any stored OKLCH outside sRGB is clipped to its nearest sRGB hex at render time. Stored value is unchanged — flipping back to `p3` restores the original wide-gamut color.

---

## 3. URL format

**Always OKLCH.** Fixed. Not user-configurable.

**Format:** `L_C_H` (lightness as percentage, chroma, hue) — see `docs/palette.md` for the full URL schema.

**Rationale:**

- Storage is OKLCH → URL mirrors storage → no decode-side conversion
- Shared links never lose P3 chroma
- Decoder is one-pass — no branching on value format
- Removes an entire class of "URL says X, app shows Y" bugs

**No per-color mode marker in URL.** The input mode is ephemeral UI state. It does not survive sharing. A recipient opening a shared link starts with the default input mode (`OKLCH`).

---

## Lossy operations — what the user sees

| Action | Effect on stored value | Surface |
| --- | --- | --- |
| Drag OKLCH slider on any color | Lossless | None needed |
| Drag HSL/RGB slider on out-of-sRGB color | Chroma clips to sRGB | Gamut icon updates on next render |
| Toggle Gamut mode to sRGB while palette has P3 colors | Stored values unchanged | Swatch renders sRGB-clipped hex; gamut indicator in Color Info modal |
| Type HEX into input field (any input mode) | Parsed to OKLCH, stored as OKLCH | None — HEX is always sRGB so no loss |
| Export to HEX / Tailwind / CSS variables | Lossy at export boundary | Already documented in export flow; unchanged |
| Share URL | Lossless | None — URL is OKLCH |

---

## Where input mode lives

Input mode is **ephemeral local state inside `ColorItem`** (`useSetState`). It is not on `ColorEntry`, not in `appStore`, not in the URL.

Consequences:

- Discarded on unmount (collapsing the sidebar, navigating away).
- Each `ColorItem` instance has its own mode. Two colors can have different active slider sets simultaneously.
- A shared link always opens with the default mode (`oklch`).
- No reader outside `ColorItem` and its direct children may consume it. Anything else is a violation.

---

## Migration notes

- `src/containers/Palette/Swatch.tsx` — now reads `appStore.gamut` and derives `displayColor`. No `mode` prop.
- `src/utils/url.ts` — must never emit HEX form for colors. Always OKLCH. Decoder may continue to _accept_ legacy HEX and 0–1 OKLCH URLs and convert to OKLCH on load (one-way back-compat). `useUrlSync` rewrites the address bar to the canonical OKLCH form on hydration via `window.history.replaceState(null, '', canonicalUrl)` so shared legacy links self-heal.

---
  
## Open questions

These are deferred to follow-up PRs. Doc will be updated when answered.

1. **Gamut warning threshold.** Strict (any out-of-sRGB) or perceptual (deltaE > N)? The Color Info modal currently flags any out-of-gamut step. An inline surface may want to be quieter — flag only clearly visible clipping (deltaE > 2 or > 5).
2. **Should the gamut travel in the URL?** It persists per-device today, which is right for a display capability. A `?g=srgb` param would additionally let a shared link carry the sender's view. Unresolved because the two intents conflict: the recipient's display is the one that matters.

**Resolved:** gamut persistence. It is persisted (`appStore` `partialize`) and re-applied pre-paint by the bootstrap script in `app/layout.tsx`, so a reload keeps the user's choice rather than re-detecting.

---

## See also

- `docs/palette.md` — URL schema, palette state model, scale generation
