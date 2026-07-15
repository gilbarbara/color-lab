# Validate: colors

The sidebar loop — the palette's base colors. Add, select, rename, edit, reorder, remove. Plus history, which is undo/redo for free because the palette is the URL.

**Seed:** single — `/p/Primary-73.0_0.23001_321`

Max 10 colors. New colors are named `Primary`, `Secondary`, `Tertiary`, `Accent`, then `Color 5`…`Color 10`, and each is added by rotating the previous hue by the current spacing angle (see `spacing.md`).

## Selectors

- Cards: testid `ColorItem`, one per color. Active card has `aria-current="true"`.
- `Add Color` · `Reorder colors` · `Select <Name>` · `Remove <Name> color` · `Change color options`
- Channel sliders: `input[type=range][aria-label="Lightness"]` / `"Chroma"` / `"Hue"`, or by `@ref`. They show up as `slider` in a `snapshot`, but they are 1px and **`find role slider --name "Hue"` does not resolve them** — see the slider trap in SKILL.md before touching one.
- Name inputs: `input[name="color-name-0"]`, `-1`, `-2`, …
- Reorder panel: testid `ReorderColors`

**Only the active color shows its *editing* actions.** The sliders, `Change color options`, `Color group`, and `Random color` live in a Collapse gated on `isActive`. Clicking an inactive card activates it. So: `Select <Name>` → confirm `aria-current="true"` (on the `ColorItem` wrapper, **not** on the `Select` button) → *then* those controls exist.

The **Remove button is not gated** — it renders for every color at all times and is merely `disabled` on the inactive ones. Seeing it in a snapshot does not mean the color is active.

## Opening state

| Check | Expect |
|---|---|
| `<html>` dataset | `data-sidebar=open` · `data-preview=open` · `data-palette-options=closed` · `data-color-options=closed` · `data-gamut=srgb` |
| logo | link matching `/colormeup/i` visible |
| title | matches `/color palette generator/i` |
| URL | contains `Primary-73_0.23_321` (the seed normalizes — see SKILL.md) |

`data-gamut` is `srgb` because headless Chrome reports no P3 support. That's the environment, not a finding.

## Theme

The app opens in whatever the system reports; headless is usually **dark** already, with `localStorage.theme` unset. So don't expect the first click to *produce* `dark` — read the class at step zero and assert that it **flips**.

| Step | Drive | Expect |
|---|---|---|
| toggle dark | button `Toggle dark mode` | `<html class>` flips (`dark` ↔ `light`) |
| persists | reload | the toggled value survives — theme is in localStorage, not the URL |

## Color mode (per-color, cosmetic)

Switches what the **channel sliders** show. It does **not** change the generated scale, the export, or what a swatch copies — it's a lens on the sidebar only.

Only the sliders relabel (`Hue`/`Saturation`/`Lightness`, then `Red`/`Green`/`Blue`). The `Color value for <name>` text field shows **hex in every mode**, so don't assert an `hsl()` or `rgb()` string there.

| Step | Drive | Expect |
|---|---|---|
| open | button `Color mode` | menu opens |
| HSL | `menuitemradio` `HSL` | sliders relabel to HSL channels |
| RGB | `Color mode` → `menuitemradio` `RGB` | RGB channels |
| back to OKLCH | `Color mode` → `menuitemradio` `OKLCH` | menu hidden |

## Editing a color

**Do not use `agent-browser fill` here** — these are native `<input type="range">` and `fill` resets them to the midpoint (see SKILL.md). Set them with **`setRange`** — the same operation e2e performs; `e2e/basic.spec.ts:98-127` drives these exact three steps. (`find role slider` won't resolve them either; use `@ref` or the `input[type=range][aria-label=…]` selectors from the Selectors list above.)

| Step | Drive | Expect |
|---|---|---|
| lightness | `setRange` `Lightness` → `0.6` | URL: `Primary-60…` |
| chroma | `setRange` `Chroma` → `0.21` | URL: `Primary-60_0.21` |
| hue | `setRange` `Hue` → `150`, then `setRange` chroma back to `0.21` | URL: `Primary-60_0.21_150` |

**Chroma gets recalibrated under you whenever L or H changes.** The app stores *relative* saturation and re-derives absolute chroma against the gamut ceiling at the new coordinates, so moving lightness alone can push chroma up past its own previous slider max (`50.1_0.23` → `60_0.275`). That's correct behavior, not a bug. Re-assert chroma after changing either channel rather than assuming it held.

## Add / reorder / remove

| Step | Drive | Expect |
|---|---|---|
| add | button `Add Color` | 2 `ColorItem`s · the **new** one is active (`aria-current` moves off the first) · URL gains a `Secondary` segment |
| add again | `Add Color` | 3 cards · `Tertiary` in the URL |
| rename | `input[name="color-name-N"]` → fill, then **`press Tab`** | the name commits **on blur**, not on change — the URL does not move until focus leaves |
| reorder | button `Reorder colors` → drag or keyboard the row grips in testid `ReorderColors` | `color-name-0/1/2` inputs reflect the new order · **URL path segments reorder to match** |
| remove | `Select <Name>` → `Remove <Name> color` **twice** (click-again-to-confirm) | that color's segment is gone from the URL |

The reorder grips are `button "Reorder <Name>, position N of M"`. `Reorder colors` itself doesn't exist until there are at least **two** colors.

Reordering re-bases the palette: `colors[0]` is the seed that defines the palette's defaults, so moving a different color to the front rewrites those defaults. The path segment order following the new order is the thing to assert.

Reorder also supports **keyboard**: focus a row's grip and use ArrowUp/ArrowDown/Home/End. Nothing about the drag path is special to assert — but if drag is flaky in your session, keyboard is the reliable route.

## History = undo/redo

The whole point of the URL-as-state design. After a chain of edits:

| Step | Drive | Expect |
|---|---|---|
| walk back | browser Back, repeatedly | each step restores the previous palette · eventually 1 `ColorItem` again |
| walk forward | browser Forward, repeatedly | every state comes back in order — forward entries must **not** be clobbered |

The forward walk is the real regression guard. The app commits edits with `history.pushState`, not the router; a bug there destroys the forward stack and you'd only notice by walking it.

Sliders are exempt from this: a drag is paused (`data-interacting`) and flushes **one** history entry on release, not one per pixel. If dragging a slider floods the back button, that's a bug.

`data-interacting` is **not** on `<html>` — it's on an inner container, so reading `document.documentElement.dataset.interacting` gives you `null` mid-drag. To prove the guard, watch `history.length` across a real mouse drag instead: it must not move until `mouse up`, then increment by exactly 1.

## What CI does not cover here

- The **color picker popover** (`Color picker for <name>`) — never opened.
- The **color text input** (`Color value for <name>`) — every e2e edit goes through sliders, so typing a hex or oklch string directly is untested.
- **`Random color`** — never clicked.
- **`New Palette`** in the header — never clicked.
- Renaming a color via `color-name-N` is only exercised inside the auth flow, not here.
