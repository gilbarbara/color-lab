# Validate: scale

The core of the product — a base color goes in, a tonal ramp comes out. Three UIs write to the same `GlobalScaleOptions`: **presets** (one-click), **Advanced Options** (the curves, in the sidebar), and the **Palette Options** panel (steps/variant/mode/saturation/lock, in the palette header). Per-color overrides shadow all of it.

**Seed:** palette — `/p/Primary-60_0.21_150/Secondary-60_0.139_227/Tertiary-60_0.266_304`

**Before you start:** re-read the slider section in SKILL.md. Every slider on this page is an **option slider** (HeroUI/react-aria) — they commit on `onChangeEnd`, so they are driven by **`focus` + `press`**, and neither `fill` nor `setRange` will move the URL (`fill` is a silent false pass — see SKILL.md).

Every `press` row below is **two commands**, because `agent-browser press` takes a key and acts on the focused element — there is no `press <selector> <key>` form:

```bash
agent-browser focus 'input[name="lightnessCurve"]'
agent-browser press PageDown
```

Focus persists, so `focus` once per slider, then press as many times as you need — asserting in between.

**`input[name=…]` is ambiguous when both panels are open.** The global Advanced Options panel and the per-color ColorOptions panel render *identical* input names and *identical* tablist labels — `document.querySelectorAll('input[name="lightnessCurve"]')` returns **2**. For the per-color steps, scope to the active card: `[data-testid="ColorItem"][aria-current="true"] input[name="lightnessCurve"]`.

Note the asymmetry: the **global** panel keeps its inputs mounted when closed (so finding `input[name="lightnessCurve"]` does *not* prove the panel is open — use `data-color-options`), while the **per-color** panel unmounts them.

Order matters: do presets first. They assert on the *whole* query string being exactly right, which only holds while nothing else has written to it. The Palette Options panel writes `i`/`v`/`m`/`s`/`o`/`k` to that same query, so it has to come after.

## Presets

Four design-system presets. Each writes its full curve set to the query and drops anything sitting at its default. The trigger button's label *becomes* the active preset name — so after applying Tailwind, the button you click next is named `Tailwind`, not `Apply a preset`.

`Reset preset` is a **separate eraser-icon button** that renders next to the trigger *only while a preset is active* (`ColorPresets.tsx`); it calls `resetAdvancedOptions`, clearing the curve keys — which is why the reset row asserts the query empties.

| Step | Drive | Expect (URL query) |
|---|---|---|
| open the menu | button `Apply a preset` | menu opens |
| Tailwind | `menuitemradio` `Tailwind` | exactly `c=0.75_0.83` `f=1.3_1.05` `x=0.99` `n=0.28` |
| Material | button `Tailwind` → `menuitemradio` `Material` | exactly `c=0.5_0.8` `h=1_-5` `f=0.8_0.9` `x=0.95` `n=0.48` |
| Bootstrap | button `Material` → `menuitemradio` `Bootstrap` | exactly `c=0.73_0.7` `h=9_2` `f=0.9_1.1` `x=0.93` `n=0.24` |
| Open Color | button `Bootstrap` → `menuitemradio` `Open Color` | exactly `c=0.8_0.75` `f=1.05_1.4` `n=0.48` |
| reset | button `Reset preset` | **query is empty** · button `Apply a preset` is back |

Reset omits defaults from the URL, so a correct reset means the query vanishes entirely — not that it holds default values.

## Advanced Options (global curves)

| Step | Drive | Expect |
|---|---|---|
| open | button `Advanced Options` | `data-color-options` → `open` · testid `ScaleColorOptions` visible |
| lightness curve | `focus input[name="lightnessCurve"]` → `press PageDown` | value `1.3` → `1.2` · URL `f=1.2` |
| chroma amount | `focus input[name="chromaAmount"]` → `press PageUp` ×3, asserting each time | `0` → `0.1` → `0.2` → `0.3` · URL `c=0.3` |
| chroma peak | `focus input[name="chromaPeak"]` → `press PageUp` | `0.5` → `0.6` · URL `c=p0.3_0.6` |
| hue shift | `focus input[name="hueShift"]` → `press PageUp` | `0` → `10` · URL `h=10` |
| close | button `Advanced Options` | `data-color-options` → `closed` · testid `ColorOptions` has `data-open="false"` |

**Assert between every keypress.** The assertion forces the controlled re-render; without it the next press gets dropped and you'll wonder why three PageUps moved one step.

### Split mode

Each curve can be a scalar (Simple) or a `{low, high}` pair (Split). The tabs live in tablists named `Lightness curve mode`, `Chroma curve mode`, `Hue shift mode` — each with `Simple` / `Split` tabs.

| Step | Drive | Expect |
|---|---|---|
| lightness → Split | tablist `Lightness curve mode` → tab `Split` | URL `f=1.2_1.2` — both ends seed from the current scalar |
| nudge the high end | `focus input[name="lightnessCurveHigh"]` → `press PageUp` ×2 | URL `f=1.2_1.4` |
| chroma → Split | tablist `Chroma curve mode` → tab `Split` | (endpoints reseed from the color's gamut fraction — don't assume a value) |
| pin both ends | `focus input[name="chromaLow"]` `press Home`; `focus input[name="chromaHigh"]` `press End` | `0` and `1` · URL `c=0_1` |
| hue → Split | tablist `Hue shift mode` → tab `Split` | `hueShiftLow=-10`, `hueShiftHigh=10` · URL `h=-10_10` — a scalar expands to a symmetric pair |

## Per-color overrides

An override shadows the global. Anything structurally equal to its global gets stripped, so the URL only carries what actually differs.

A color's options **only exist while that color is active** (they're inside a Collapse gated on `isActive`), and a seeded palette activates the *first* color. So select Tertiary before expecting its controls to exist.

**The per-color editor inherits the current global curve — it does not start at the 1.3 default.** So the expected values below hold only if you come here with the global lightness curve untouched. If you ran the Advanced Options steps first (global now `f=1.2`), the per-color slider already reads `1.2` and one PageDown gives you `f:1.1`, not `f:1.2`. Express the expectation as *one tick below whatever the slider currently reads*, and read it before you press.

Clicking the `Simple` tab when the global is in Split mode reseeds to `1.3` **and immediately writes** `-f:1.3` onto the segment, before you touch the slider.

| Step | Drive | Expect |
|---|---|---|
| select Tertiary | button `Select Tertiary` | its `ColorItem` has `aria-current="true"` |
| open its options | within that ColorItem: button `Change color options` | its curve editor renders |
| override lightness curve | its tablist `Lightness curve mode` → tab `Simple`, then `focus` its scoped `input[name="lightnessCurve"]` → `press PageDown` | one tick down from its current value · URL: **Tertiary's segment** carries `f:<value>` |
| lock a step | testid `ColorLockOptions` (the trigger `button "Lock Color Lock"`) → click it, then `option` `400` | the trigger's text becomes `400` · Tertiary's segment carries `k:400` |
| close | button `Change color options` | the curve inputs are gone (the per-color panel unmounts them) |

Note the difference: a global curve writes `?f=1.2` to the query; a per-color override writes `f:1.2` onto that color's **path segment**. If you see the override land in the query, that's a bug.

## Palette Options panel

| Step | Drive | Expect |
|---|---|---|
| open | button `Palette Options` | `data-palette-options` → `open` |
| mode → Dark | radio `Dark` | checked · URL `m=d` |
| mode → Reversed | radio `Reversed` | checked · URL `m=r` |
| mode → Light | radio `Light` | checked · **`m` disappears** (light is the default) |
| steps | `focus input[name="steps"]` → `press ArrowLeft` | `11` → `10` · URL `i=10` |
| variant | button matching `/^select variant/i` → option `Neutral` | URL `v=neutral` |
| reset | within testid `PaletteOptions`: button `Reset` (exact) | `i`, `v` gone — **curves survive**, this resets only the basic options |
| saturation override | switch `Apply saturation to all colors`, then `focus input[name="saturation"]` → `press End` | `100` · URL has both `o=1` and `s=100` |
| reset again | button `Reset` (exact) | `i`, `o`, `s`, `v` all gone |
| lock 500 | button matching `/^select lock/i` → option `500` | button matching `/^500 lock/i` visible · URL `k=500` |
| close | button `Palette Options` | `data-palette-options` → `closed` |

The two Resets are scoped differently on purpose: the Palette Options `Reset` clears steps/variant/saturation and leaves the curves alone; Advanced Options has its own `Reset` for the curves. If one wipes the other's state, that's a real bug. Both exist simultaneously when both panels are open — hence the `PaletteOptions` scoping above.

**The mode radios are not native inputs.** There is no `input[type=radio]` in the Mode group — read `aria-checked` on `[role=radio]`. Querying `input:checked` silently reads the **live preview's demo radios** instead (values `a`/`b`) and hands you a plausible-looking wrong answer.

## Export the scale

| Step | Drive | Expect |
|---|---|---|
| open | button `Export scale for Primary` (icon-only — no visible text; one per color) | tabs `Tailwind 4` and `OKLCH` visible |
| close | button `Close` | tab `Tailwind 4` gone |

## What CI does not cover here

- The per-control **reset buttons** (`Reset <name> to default`) on individual curves — only the bulk Resets are tested.
- The per-color **`Saturation Override`** switch inside a ColorItem (only the palette-wide one is driven).
- The curve **info tooltips** (`Description for <curve>`).
- **Preset → override interaction**: nothing checks what happens to per-color overrides when a preset is applied on top of them.
