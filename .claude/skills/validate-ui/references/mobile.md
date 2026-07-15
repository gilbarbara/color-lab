# Validate: mobile

The same app, driven through a different chrome. The sidebar becomes a **bottom drawer**; the header nav collapses into a **hamburger**.

**Seed:** single — `/p/Primary-73.0_0.23001_321`

**Viewport:** iPhone 12 Pro — `agent-browser set viewport 390 844`

## What changes

| Desktop | Mobile |
|---|---|
| left sidebar (`Toggle Sidebar`) | bottom drawer (`Toggle Bottom Bar`) |
| `My Palettes` / `About` links in the header | button `Menu` → menuitems |
| — | a color strip in the bottom bar handle: tap a dot to select that color |

The bottom bar also responds to **Enter/Space** and to **swipe** up/down (30px threshold). Neither is worth driving with `agent-browser`; the click path is the one to test.

## The ordering constraint that will bite you

**An open bottom bar overlays the palette.** Anything in the palette region — `Export scale`, swatches, scale-row tools — must be driven while the bar is **closed**, or the click hits the overlay instead. The e2e spec is structured around this, and so should you be:

1. **Bar closed**: header, dark mode, `Menu`, `Export scale`, swatches.
2. **Bar open**: sliders, `Add Color`, `Advanced Options`, per-color options, **remove color**.
3. **Bar closed again**: palette options, charts, info, contrast grid, `Export All`, swatch copy — and **select a color last**.

Two traps inside those phases, which the ordering above already accounts for:

- **`Remove <Name> color` lives *inside* the bar.** With the bar closed it sits below the viewport and isn't clickable at all. It needs the bar **open**.
- **Selecting a color re-opens the bar.** Clicking `Select <Name>` sets `aria-current` *and* auto-opens the bottom bar, which then overlays the palette — silently breaking every bar-closed step after it. Do it last, or close the bar again before continuing.

Toggle with `button` `Toggle Bottom Bar` (the caret) and wait for `aria-expanded` to flip, not a fixed sleep.

## Flow

**Bar closed:**

| Step | Drive | Expect |
|---|---|---|
| initial | — | logo · button `Menu` · `Toggle dark mode` · `Sign In` · `Export All` visible · `data-gamut=srgb` (headless) |
| swatches present | — | buttons matching `/^copy .* 50(,|$)/i`, `/^copy .* 500(,|$)/i`, `/^copy .* 950(,|$)/i` |
| dark mode | button `Toggle dark mode` | `<html class>` flips · survives reload |
| menu | button `Menu` | menuitems `My Palettes`, `About` · Escape closes |
| export scale | button `Export scale for <Name>` | tabs `Tailwind 4`, `OKLCH` · `Close` |

**Bar open** (`Toggle Bottom Bar`):

| Step | Drive | Expect |
|---|---|---|
| sliders | `setRange` on `Lightness` / `Chroma` / `Hue` (see SKILL.md) | URL updates. **Never `fill`**, and `find role slider` won't resolve these — both traps are in SKILL.md; use `@ref` or `input[type=range][aria-label="…"]` |
| add a color | button `Add Color` | second `ColorItem` · URL gains `Secondary` |
| advanced options | button `Advanced Options` → `focus input[name="lightnessCurve"]` → `press PageDown` | **keyboard, not fill** · URL `f=` changes |
| color options | button `Change color options for <Name>` | per-color editor opens · close it again |
| remove a color | `Remove <Name> color` **twice** | segment gone from the URL |

**Bar closed again:** palette options, scale mode, lock 500, charts, color info, contrast grid, `Export All` + format tabs, swatch copy toast, assign a group and filter by it — then **select a color, last**.

**The Next.js dev-tools badge sits at roughly x 20–56, y 788–824** and will cover the first strip dot and `Change color options` at 390×844. `click @ref` errors with `covered by <nextjs-portal>`; `find role … click` lands on it silently. Unavoidable in dev — scroll or use `@ref` and read the error.

Those all behave as documented in their own area files — `scale.md`, `inspect.md`, `export.md`, `groups.md`. Mobile isn't re-testing the logic, it's testing that the controls are **reachable** in this chrome.

## What CI does not cover here

- Group filtering on mobile beyond a **single** chip.
- The **swipe** gesture on the bottom bar.
- The bottom bar's **color strip** dots (tap to select a color).
- Any other device profile — mobile is iPhone 12 Pro only, and no tablet breakpoint is exercised anywhere.

## The bottom bar's state

`button "Toggle Bottom Bar"` (the caret) carries **`aria-expanded`** — that's the observable, and the whole reason you don't need to measure geometry. Note `<html data-sidebar>` tracks the *desktop* sidebar and stays `open` on mobile regardless, so it is not a substitute.

The handle itself is **not** the control — it wraps the color-strip buttons, so it's a plain clickable container. Tap and swipe on it still toggle the bar, but drive the caret button when you need the keyboard or ARIA path.

Each strip dot is named for its color — `button "Select <Name>"`.
