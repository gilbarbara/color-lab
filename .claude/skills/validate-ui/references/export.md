# Validate: export

Two drawers, one shared component (`ExportDrawer`):

- **Export All** — the whole palette. Button `Export All` in the palette header. Has per-color selection.
- **Export scale** — one color's ramp. Label `Export scale`, one per scale row.

**Seed:** palette — `/p/Primary-60_0.21_150/Secondary-60_0.139_227/Tertiary-60_0.266_304`

**Read this first: CI barely covers this area.** The e2e suite opens both drawers, asserts the tabs exist, and switches between two of them. **It never asserts a single line of exported output.** If you're validating export, the copied content is where the real risk is, and it is entirely on you.

## Formats

Two independent tab rows.

**Format type:** `Tailwind 4` (default) · `Tailwind 3` · `CSS` (exact) · `SCSS` (exact) · `SVG / Figma` (matches `/svg/i` — the tab is **not** named just "SVG")

**Color format:** `OKLCH` (default) · Hex (`/hex/i`) · `HSL` · `RGB` · `RGB channels`. The whole row is hidden when the format is `SVG / Figma`, which carries its own color encoding.

**`RGB channels` only exists under CSS and SCSS** (`getAvailableColorFormats`, `src/utils/export.ts`). On Tailwind 4/3 there are four color tabs, not five. Switching away from CSS while `RGB channels` is selected silently falls back to `OKLCH` — that's correct, not a bug.

Export format is a **third** axis, independent of both the per-color input mode and the global gamut. Neither of those affects export output. (See `docs/color-mode.md`.)

## Flow

| Step | Drive | Expect |
|---|---|---|
| open | button `Export All` | tabs `Tailwind 4`, `Tailwind 3`, `CSS`, `SCSS`, `SVG / Figma` · plus `OKLCH`, Hex, `HSL`, `RGB` |
| switch format | tab `Tailwind 3` (exact) | `aria-selected=true` · the `<pre>` body becomes a config object (**use Tailwind 3, not CSS** — CSS is identical to the default) |
| switch color format | tab Hex | `aria-selected=true` · values in the body switch to hex |
| SVG | tab `SVG / Figma` | **the color-format tab row disappears** |
| close | button `Close` | tab `Tailwind 4` gone |

`[role=tab]` is **not unique to this drawer** — the live preview panel has its own tabs. Scope your query, or you'll read the wrong `aria-selected`.

Per-color scale export:

| Step | Drive | Expect |
|---|---|---|
| open | button `Export scale for Primary` (icon-only, no visible text — `find text "Export scale"` finds nothing) | tabs `Tailwind 4` and `OKLCH` visible · title reads `Export` |
| close | button `Close` | gone |

Format type and color format are **persisted to localStorage**, so a later run may not start on `Tailwind 4` / `OKLCH`. Assert the starting tab rather than assuming it.

## The parts nobody tests

**Read the actual output.** `agent-browser get text` on the `<pre>` body. Then check:

- The step count matches the palette's `i` (steps) setting.
- The color format actually changed when you switched the tab — not just the tab's `aria-selected`.
- The values match what the swatches show. (Compare the exported hexes against the computed `background-color` of the `Copy <Name> <step>` buttons.)

**Tailwind 4's output is byte-identical to CSS.** `generateTailwind4` returns `generateCSS(...)` verbatim (`src/utils/export.ts`) — Tailwind 4 theme tokens *are* `--color-*` custom properties; the user pastes them inside `@theme { … }` themselves. **There is no `@theme` block in the output.** So "switch to CSS and watch the body change" proves nothing — the only difference between those two tabs is `aria-selected`. Tailwind **3** is the one with a genuinely different shape (a config object).

**Selection (Export All only).** Per-color **checkboxes** (not chips — `checkbox "Primary Copy Primary" [checked=true]`, assert `input[type=checkbox].checked`, *not* `aria-pressed`), `Select All` / `Select None`, an `N of M selected` count, and a footer `Copy All (N)`. Selection is **by color ID**, so the strong test is: deselect a color, reorder the palette, reopen — the *same color* must still be deselected, not the one that inherited its index.

The selection UI disappears entirely for a **single-color** palette (`colors.length > 1` gates it) — the footer just reads `Copy All (1)`.

**The group filter must NOT apply here.** Export always acts on the whole palette, even with a group filter active. If you filter to Brand and Export All only emits the Brand colors, that's a bug — but note nothing in CI protects this, and `groups.spec.ts` explicitly declines to assert it.

## What CI does not cover here

- **The copied content of any format.** Not one assertion.
- The **SVG / Figma** tab body.
- **Per-color selection** inside the Export All drawer (`Select All`, `Select None`, the chips, `Copy All (N)`).
- The **per-row copy** buttons.
- Export's independence from the group filter.
