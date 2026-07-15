---
name: validate-ui
description: Drive Color Lab's real UI in a browser and verify a feature area actually works — routes, controls, selectors, and the exact observable that proves each step. Use this whenever the user asks to validate, check, verify, exercise, smoke-test, or "click through" any part of the app, and whenever they name a feature area to validate ("validate scale", "validate groups", "check the preview still works", "does export still work?", "make sure saving a palette works"). Also use before shipping a UI change, when reproducing a reported UI bug, or any time you are about to explore the app in a browser to find out how it works — that exploration is what this skill exists to replace. Do NOT use for `pnpm validate` (typecheck + lint + tests) — that is a different thing entirely.
---

# Validate the Color Lab UI

Drive the real app as a user and prove a feature works.
Assert between actions — never chain two on an assumption; the loop below is why.

Read this file, then read **exactly one** `references/<area>.md` for the area you're validating. Don't load them all.

## The loop

```
1. act      — one command
2. observe  — snapshot (or get the specific observable)
3. assert   — the thing you expected to change actually changed
4. repeat
```

You cannot see the page. You are working from a mental model, and **the model is wrong the moment you act.** So you re-read after every action — not when something looks broken, because it will not look broken.

### `✓ Done` is not a result

`agent-browser` prints `✓ Done` when the **command ran**. It says nothing about whether it *did* anything. Every trap in this file is an instance of that:

| Command | Prints | Actually |
|---|---|---|
| `fill` on a slider | `✓ Done` | value jumped to the range's **midpoint** |
| `type` / `keyboard type` / `select` on a slider | `✓ Done` | **nothing at all** |
| `focus` on a control in a collapsed panel | `✓ Done` | focus went nowhere (`inert`) — every later `press` is swallowed |
| clicking a **`[disabled]`** button | `✓ Done` | **nothing at all** — and the unchanged state reads as a real result |
| `find role button click --name "Save"` | `✓ Done` | hit `Save palette`, not the modal's `Save` |
| clicking a toggle whose state was **persisted** open | `✓ Done` | you just **closed** it |

None of these error. All of them produce a green, confident, wrong result. The only defence is to look.

**So:** never chain two actions on an assumption. After a click that opens something, assert it opened. After a click that toggles something, assert which way it went. Re-`snapshot` before reusing any `@ref` — refs die on every re-render.

A **covered** control is not one of these traps: any click on one **errors** and names the covering element (`✗ covered by <header.fixed.top-0>`). That's a signal, not a failure — read it and clear the coverer.

Prefer `click @ref` over `find role … click` anyway: `find` matches by **substring**, so a name that looks unique often isn't — `--name "Save"` hits `Save palette`, and a bare `Select` matches `Select <Name>`, `Select variant` and `Select lock` at once. A `@ref` names exactly one.

## What the app is

An OKLCH color-scale generator. You pick base colors; it generates a tonal scale (3–20 steps) for each. Everything else — curves, groups, presets, export, contrast tools — feeds or renders that.

**The palette IS the URL.** Every structural edit rewrites the address bar; back/forward is undo/redo. This is why most assertions are URL assertions: if the URL didn't change, the edit didn't happen.

Routes: `/` redirects to `/p`. `/p/<slug>` is the entire generator. `/palettes` is the saved list (auth-gated). `/about`, `/privacy`, `/terms`, `/oklch-vs-hsl`, `/custom-color-scales` are static.

## Boot

The dev server is **`https://color-lab.localhost`** (portless proxy) — *not* `localhost:3000`.

```bash
pnpm dev   # if it isn't already up

agent-browser open https://color-lab.localhost/p/Primary-73.0_0.23001_321
agent-browser set viewport 1440 900
agent-browser wait --load networkidle
```

Two seed palettes, from `e2e/__setup__/constants.ts`:

- **single** — `/p/Primary-73.0_0.23001_321`
- **palette** — `/p/Primary-60_0.21_150/Secondary-60_0.139_227/Tertiary-60_0.266_304`

Each area file names the seed it wants.

**The `single` seed rewrites itself on load. That is expected.** Plain precision rounding, in P3 and sRGB alike — `formatOklchUrl` (`src/utils/color.ts`) rounds L to 2 decimals and C to 3:

```
/p/Primary-73.0_0.23001_321   →   /p/Primary-73_0.23_321
        ^^^^ trailing zero          ^^^^^^^ 0.23001 → 0.23
```

Assert against `Primary-73_0.23_321`. The `palette` seed is canonical and stays put. Gamut has nothing to do with it — `e2e/basic.spec.ts:56` asserts the rewritten form *while forcing P3*.

### Step zero: read the opening state, don't assume it

`appStore` persists to `localStorage` (key `color-lab`). A pre-paint script in `app/layout.tsx` stamps some of it onto `<html>` before React mounts. **The starting state is restorable, not fixed.**

Persisted: `gamut`, `showSidebar`, `showPreview`, `showColorOptionsPanel`, `showPaletteOptionsPanel`, `view`, `colorSpacing`, `exportFormatType`, `exportColorFormat`.

**`view`, `colorSpacing` and the two export settings are persisted but are *not* on `<html>`.** A reload restores whatever you last left — not List view, not Wide spacing, not the default export tabs.

**A toggle you click may already be on, so your click turns it off.** Read the state first; if it isn't what the area file expects, set it explicitly or clear storage.

## The three observables

Don't eyeball screenshots. Screenshots are for showing the human.

**1. The URL — the palette state.** Colors are path segments (`/p/Name-L_C_H`); options are short query keys. Per-color overrides ride on the segment after a `-`, comma-separated (`Primary-60_0.21_150-f:1.2,k:400`).

| Key | Means | | Key | Means |
|---|---|---|---|---|
| `i` | steps (3–20) | | `s` / `o` | saturation / apply-to-all |
| `m` | mode `l`/`d`/`r` | | `k` | locked step |
| `v` | variant | | `f` | lightness curve |
| `c` | chroma curve | | `h` | hue shift |
| `n` / `x` | min / max lightness | | `g` | group: `b`/`n`/`s`/`d` |

Defaults are dropped from the URL entirely — so "reset" is asserted as *the param disappearing*, not as it returning to a value.

**2. `<html>` — the app's chrome state.** Global layout flags with no accessible surface, so there is nothing in the tree to read instead:

```bash
agent-browser eval "JSON.stringify(document.documentElement.dataset)"
# {"gamut":"srgb","p3Supported":"false","sidebar":"open","preview":"open",
#  "colorOptions":"closed","paletteOptions":"closed"}
```

`data-gamut` (`p3`|`srgb`) · `data-sidebar` · `data-preview` · `data-color-options` · `data-palette-options` (each `open`|`closed`) · `data-p3-supported`. **`dataset` camelCases them** — `dataset.colorOptions`, not `dataset['data-color-options']`. Dark mode is `class="dark"`, not a data attribute.

**Three different surfaces say "color options" — keep them apart.** `data-color-options` tracks *only* the global **Advanced Options** panel (`showColorOptionsPanel`). The per-color **Change color options** Collapse has no chrome flag — it's proven open by its inputs being mounted. Steps/variant/lock live under `data-palette-options`.

Headless Chrome reports `p3Supported: "false"`, so the app opens in `gamut: srgb` — the environment, not a bug. It does mean you validate the sRGB path by default, which the e2e suite never exercises (it forces P3 on).

**3. ARIA — element state.** `aria-current` on the active `ColorItem` · `aria-pressed` on group chips · `aria-selected` on tabs · `aria-checked` on radios · `aria-expanded` on `Toggle Bottom Bar`.

```bash
agent-browser snapshot -i              # your default read
agent-browser get count '[data-testid=Scale]'
agent-browser get attr @e5 aria-pressed
agent-browser get url
```

## The `eval` rule

**Read state through the accessibility tree, not the DOM.** `eval` has exactly three legitimate uses:

1. Reading `<html>`'s `data-*` chrome state (observable 2 — it has no ARIA surface by design).
2. Patching `navigator.clipboard` (clipboard reads are blocked).
3. **`setRange`** — setting a channel slider's value, because agent-browser genuinely cannot (see Sliders).

Everything else — element counts, `aria-*`, text, tab selection, panel contents — comes from `snapshot` / `get`.

> **Reaching for `eval` to prove a control's state — `className`, `getComputedStyle`, `getBoundingClientRect`, a bare `data-*` — means stop.** That control has no accessible state, and that is an accessibility bug. Report it. Class-sniffing hides the defect and trains the next agent to hide it too.

The distinction that matters: `eval` is banned as a *substitute for looking*. It is correct as an *implementation of an action agent-browser can't perform*. `setRange` is the second; it is not a licence for the first.

**`eval` reuses one JS context**, so a bare `const x = …` throws `Identifier 'x' has already been declared` on the second call. Wrap every body in an IIFE.

## Sliders

Every slider is an `<input type="range">`, but they come from two libraries that **commit on different events**. That, and only that, is why they differ.

| Slider | Where | Commits on | Drive with |
|---|---|---|---|
| **Channel** — `Lightness`, `Chroma`, `Hue` | sidebar `ColorItem` | `input` | **`setRange`** |
| **Option** — steps, saturation, every curve | Palette Options, Advanced Options, per-color overrides | `onChangeEnd` | **`focus` + `press`** |

Both land exactly, in one step. **Never `fill` either.**

### Option sliders → `focus` + `press`

HeroUI/react-aria. They commit on `onChangeEnd`, which only real input fires — a synthetic value change does nothing, so **`setRange` will not move the URL here.** e2e drives them this way and explains why at `e2e/scale.spec.ts:44-48`.

```bash
agent-browser focus 'input[name="lightnessCurve"]'
agent-browser press PageDown          # 1.3 → 1.2, URL gains ?f=1.2
```

`press` takes a **key, not a selector** — it acts on whatever is focused, so every keyboard step is two commands. Focus persists across presses. One press = one tick: PageUp/PageDown = 0.1 on the curve sliders, 10 on `hueShift`; arrows = 1 on `steps`; `Home`/`End` = min/max.

**Assert the panel is open before you `focus`.** A collapsed panel's content is `inert`, and an `inert` input cannot take focus — `focus` still prints `✓ Done`, and every `press` is silently swallowed. *How* you assert open depends on the panel: **Advanced Options** → `data-color-options` (it flips in lockstep with `inert`); **Palette Options** → `data-palette-options`; a **per-color** panel → its inputs being present (it unmounts them when closed — see `scale.md`). Don't read `data-color-options` for the per-color case; it reports the global panel.

### Channel sliders → `setRange`

**agent-browser cannot set a range input's value.** `fill` is broken (below); `type`, `keyboard type`, `keyboard inserttext` and `select` are silent no-ops. Keyboard *works* but can't reach a target — the step is `0.001` on Lightness/Chroma and `0.01` on Hue (3,600 `PageUp`s to cross 0–360). Don't.

So `setRange` is the tool. It is not a trick: it is *precisely* the branch Playwright's `fill()` takes for range inputs (`kInputTypesToSetValue = {color, date, time, datetime-local, month, range, week}` → set the value, dispatch `input` + `change`, never clear). Same operation `e2e/basic.spec.ts` performs.

```bash
cat <<'EOF' | agent-browser eval --stdin
(() => {
  const el = document.querySelector('input[type=range][aria-label="Hue"]');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, '150');
  el.dispatchEvent(new Event('input',  { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
})()
EOF
```

The *native* setter is required: React patches the instance's `value` setter to track changes, so a plain `el.value = …` is swallowed and `onChange` never fires.

> **Assert on the URL, never on `el.value`.** The picker commits through `requestAnimationFrame` while React synchronously restores the controlled value, so reading it back in the same `eval` returns the **old** value even though the edit landed. Use `wait --url "**/*_150"`.

Channel sliders are **1px × 1px** and clipped (the visible track is the parent `div`). So `find role slider --name "Hue"` **fails to resolve them**, even though they *do* appear as `slider` in a `snapshot`. Use `@ref` or `input[type=range][aria-label="Hue"]`.

### Never `fill` a slider

`fill` is "clear the field, then fill it" — and **the clear alone destroys the value**. Per the HTML spec, a range input set to `''` resets to its default, `min + (max-min)/2`:

```
fill Hue            "150"   (min 0,   max 360)   →   180     ← midpoint, not 150
fill lightnessCurve "2.0"   (min 0.1, max 5)     →   2.55    ← midpoint, not 2.0
```

An **agent-browser bug, not app behavior** (Playwright fills these fine — hence `setRange`). Pick a target near the midpoint and you get a green assertion that proves nothing.

## URL writes are not debounced

**There is no debounce.** `useUrlSync` calls `pushState` synchronously, so after a discrete edit (`Add Color`, a menu selection, a name blur) `get url` already returns the new URL — no wait needed.

The one thing that defers a write is a **slider gesture**: while any element carries `data-interacting="true"`, `useUrlSync` pauses and flushes exactly one entry on release (the invariant that stops a drag flooding the back button).

Prefer `wait --url "**/<expected>"` over a fixed sleep — it costs nothing when the URL is already right. But don't wait on a timeout that doesn't exist: if the URL never arrives, something is genuinely wrong and waiting longer won't fix it.

## Selectors

**Precedence:** role + accessible name → `data-testid` → `input[name=…]`. Every selector in the area files is one the e2e suite drives, so a rename breaks CI before it breaks this skill. Prefer them over anything you invent.

**Per-color controls carry a `for <Name>` suffix the area files omit.** The real names are `View Color Info for Primary`, `Change color options for Primary`, `Color group for Primary`, `Export scale for Primary`, `Random color for Primary`. The area files name the *stem*, and substring matching makes them work — but **an exact-name lookup will fail**, and substring matching is also how `--name "Save"` hits the wrong button. When a stem doesn't resolve, snapshot and read the real name.

## Reading the clipboard

`navigator.clipboard.readText()` throws `NotAllowedError` here. Two options:

- **The toast is the assertion** — swatch copies and Share raise one (`[role=alert]`) containing the copied value.
- **Patch the writer** when you need the exact payload (export):

```bash
cat <<'EOF' | agent-browser eval --stdin
(() => {
  window.__clip = [];
  const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
  navigator.clipboard.writeText = t => { window.__clip.push(t); return orig(t); };
  return 'patched';
})()
EOF
# …click the copy button, then read window.__clip
```

## App-specific behavior

Facts you cannot derive by looking — the rest is caught by the loop.

- **A color's *editing* controls only exist while it's active** — sliders, `Change color options`, `Color group`, `Random color`, `View Live Preview` live in a Collapse gated on `isActive`. Click `Select <Name>`, confirm `aria-current="true"`, *then* look. The name input, color picker, color-value input and **Remove button are always rendered** — Remove is merely `disabled` when inactive, so its presence proves nothing.
- **`aria-current` is on the `ColorItem` wrapper**, not the `Select <Name>` button (whose own `aria-current` is `null`).
- **Remove color** is click-again-to-confirm, and the **one exception** to the rule above: send both clicks with no snapshot between them, because a re-render disarms the confirm. The exception buys you nothing if you skip the checks around it — *before*, the color must be active and the button must **not** be `[disabled]` (a disabled Remove takes both clicks, prints `✓ Done` twice, and removes nothing); *after*, assert the segment is gone from the URL.
- **Delete palette** is a Popconfirm — `Remove Palette (<name>)`, then `Confirm`.
- **`Add Color` clicks fired back-to-back get dropped** — you land on N-1 colors and it reads as an app bug. It's not the `Color Spacing` dropdown (it happens with the menu never opened). Click once, assert the `ColorItem` count went up, then click again.
- Panels animate ~400ms. Wait on the `data-*` attribute flipping, not a sleep.

## Overlays

Six components open over the palette. **The backdrop decides the behavior:** `opaque`/`blur` are **modal**, `transparent`/none are **non-modal** — and the two do opposite things to your snapshot.

| Component | Backdrop | Modal? | Snapshot while open |
|---|---|---|---|
| `Palette/DisplayMenu` | `opaque` | yes | collapses to the overlay's own content |
| `ReorderColors` | `opaque` | yes | collapses |
| `ExportDrawer` | `blur` | yes | collapses |
| `components/Modal` → Login, Save palette, Contact, Color Info, Contrast Grid | `blur` | yes | collapses (to the modal, which may itself be large) |
| `ColorList/ColorItem` (color picker) | `transparent` | no | whole page stays in the tree |
| `Popconfirm` | none | no | whole page stays |

**Modal (`opaque`/`blur`).** The app sets `aria-hidden` on everything behind the overlay, and agent-browser filters `[aria-hidden]`, so the snapshot **collapses to just the overlay's controls** — a 146-ref page becomes ~10. Expected, not a crash: it hands you the open overlay, scoped. Tells: `get count '[role=dialog]'` is `1`, and the trigger reads `[expanded=true]`. (A large modal like Color Info stays large — the collapse hides the *background*, not the modal's own content.)

**Non-modal (`transparent`/none).** The page stays fully in the snapshot (no `aria-hidden`, no `role=dialog`) — **but the backdrop still blocks the pointer.** This is the one that strands you: you see a background ref, click it, and get `✗ covered by <div.bg-overlay/50 …>`. That means the overlay is open, not that the app is broken. Close it, re-snapshot, continue.

**Exits** (all six): `press Escape`, the visible `Close` button, or a real click outside the overlay:

```bash
agent-browser mouse move 80 840    # bottom-left, clear of the popover
agent-browser mouse down
agent-browser mouse up
```

**The `Dismiss` in your snapshot is not a close button** — it's react-aria's visually-hidden dismiss affordance (1px, `tabIndex=-1`, and a modal renders two of them), meant for screen readers. Clicking it by ref misses or hits whatever's under it. Use Escape or `Close`.

**Never `click` the backdrop by selector.** It aims at the element's center — under the overlay — so it clicks the overlay and silently does nothing.

## Pick an area

Read the one file that matches. Each has: the seed URL, the flow as a step→drive→expect table, and what CI does *not* cover there.

| Say | Area | Covers |
|---|---|---|
| "validate colors" | `references/colors.md` | add, select, rename, edit, randomize, color mode, reorder, remove, undo/redo |
| "validate scale" | `references/scale.md` | presets, curves, palette options, steps, variant, lock, per-color overrides |
| "validate palette" | `references/palette.md` | rename, views (List/Grid/Preview), gamut, sidebar, swatch copy, Share |
| "validate groups" | `references/groups.md` | assign groups, filter chips, filter retirement |
| "validate preview" | `references/preview.md` | live preview: collapse, theme cycle, tabs, color select |
| "validate export" | `references/export.md` | Export All + Export scale, formats, color formats, copy |
| "validate inspect" | `references/inspect.md` | charts, Color Info, Contrast Grid |
| "validate auth" | `references/auth.md` | login, save/update, My Palettes, favorite, load, delete |
| "validate spacing" | `references/spacing.md` | the four color-spacing modes |
| "validate mobile" | `references/mobile.md` | bottom bar, hamburger menu |

Vague ask ("does the app still work?") → run `colors` then `palette`, and say that's what you did.

**`references/gaps.md`** lists what the e2e suite never touches — where manual validation is actually worth the time. Selectors there are *not* protected by a passing suite; snapshot before trusting them.

## Reporting

Say what you drove, what you observed, and what broke.

A step you couldn't drive (control missing, selector dead) is a **finding**, not something to work around silently.

**Don't claim a pass for a step whose observable you didn't check.** If you didn't assert it, you didn't validate it — say so instead of inferring it from `✓ Done`.
