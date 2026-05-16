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
|------|-------|--------|-------------------|
| **Input mode** | per ColorSelector (UI ephemeral) | Sliders + text input format | No |
| **Palette display** | global, palette-wide | Swatch rendering, tooltip, clipboard copy | TBD (see open questions) |
| **URL format** | global, fixed | URL path serialization | N/A — always OKLCH |

Each axis is independent. None reads from another. Conflating them is the root cause of past regressions.

---

## 1. Input mode

**Location:** `ColorSelector` (sidebar), one toggle per color.

**Values:** `OKLCH` | `HSL` | `RGB`

**What it controls:**
- `ChannelSliders` component — which channel set renders (L/C/H, H/S/L, or R/G/B)
- Text input format under the color name — `oklch(...)`, `#hex`, or whatever the active mode renders

**What it does NOT control:**
- Stored `colorEntry.value` (always OKLCH)
- Swatch rendering
- URL output
- Exports

**Lossy behavior:**
Dragging HSL or RGB sliders on a color whose OKLCH is outside sRGB will clip the chroma. The slider operates in sRGB by definition — the resulting OKLCH is whatever sRGB triple maps back. This is user choice: they picked the sRGB-bound input.

**Surface for the user:**
A gamut warning icon (triangle, in the input row) appears when the current OKLCH value is outside sRGB. It signals "this color cannot be expressed losslessly in your current input mode." Switching mode does not change the value; it only changes the slider math available for the next edit.

---

## 2. Palette display

**Location:** Palette `Options` menu (top of the palette panel).

**Values:** `OKLCH` | `HEX` | `HSL`

**What it controls:**
- Format shown inside each `Swatch`
- Format copied to clipboard on swatch click
- Format shown in swatch tooltip

**What it does NOT control:**
- Stored values
- Input mode in the sidebar
- URL output
- Generated scale (always OKLCH internally, formatted at render time)

**Scope:** Global to the palette. All scales render in the same format. Mixed-format palettes are not supported — they read as inconsistent and undermine the comparison the palette exists to provide.

**Default:** `OKLCH`. Reinforces the app's stance. Users who want HEX flip once.

**Lossy behavior:**
When display is HEX or HSL and a scale step is outside sRGB, the rendered swatch shows the clipped color. The gamut indicator on affected steps (already computed by the Color Info modal) surfaces inline on the swatch, not just inside the modal.

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
|--------|------------------------|---------|
| Drag OKLCH slider on any color | Lossless | None needed |
| Drag HSL/RGB slider on out-of-sRGB color | Chroma clips to sRGB | Gamut icon updates on next render |
| Toggle Palette Display to HEX while palette has P3 colors | Stored values unchanged | Gamut indicator on affected swatches |
| Type HEX into input field (any input mode) | Parsed to OKLCH, stored as OKLCH | None — HEX is always sRGB so no loss |
| Export to HEX / Tailwind / CSS variables | Lossy at export boundary | Already documented in export flow; unchanged |
| Share URL | Lossless | None — URL is OKLCH |

---

## Where input mode lives

Input mode is **ephemeral local state inside `ColorSelector`** (`useSetState`). It is not on `ColorEntry`, not in `appStore`, not in the URL.

Consequences:
- Discarded on unmount (collapsing the sidebar, navigating away).
- Each `ColorSelector` instance has its own mode. Two colors can have different active slider sets simultaneously.
- A shared link always opens with the default mode (`oklch`).
- No reader outside `ColorSelector` and its direct children may consume it. Anything else is a violation.

---

## Migration notes

Current branch `updates` violates parts of this contract. Specifically:

- `src/pages/Generator/Palette/Swatch.tsx` — reads a `mode` prop and formats accordingly. Must read **palette display** preference instead, once that toggle exists.
- `src/utils/url.ts` — must never emit HEX form for colors. Always OKLCH. Decoder may continue to *accept* legacy HEX URLs and convert to OKLCH on load (one-way back-compat).

---

## Open questions

These are deferred to follow-up PRs. Doc will be updated when answered.

1. **Should Palette Display preference persist in URL?** E.g., `?d=hex`. Pro: shared link respects sender's view. Con: another knob on the URL schema. Default leans toward "no, ephemeral like dark mode."
2. **Gamut warning threshold.** Strict (any out-of-sRGB) or perceptual (deltaE > N)? Color Info modal currently flags any out-of-gamut. Inline surface may want to be quieter — flag only clearly visible clipping (deltaE > 2 or > 5).

---

## See also

- `docs/palette.md` — URL schema, palette state model, scale generation
