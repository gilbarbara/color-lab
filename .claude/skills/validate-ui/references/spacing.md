# Validate: spacing

Color spacing controls the hue angle used when **adding** a color. Each new color rotates the previous color's hue by the spacing angle, so the palette fans out from the seed.

**Seed:** single — `/p/Primary-73.0_0.23001_321`

Four modes, in the `Color Spacing` dropdown next to `Add Color`:

| Mode | Angle |
|---|---|
| Tight | 30° |
| Even | 36° |
| Wide | 77° (default) |
| Golden | 137.5° |

## Selector note

The dropdown trigger's accessible name is **compound and changes with the selection** (it reads `<label> - <angle>°`), so it's a bad target. Use its id instead:

```bash
agent-browser click "#color-spacing-value"
```

Then pick the mode from `menuitemradio` `Tight` / `Even` / `Wide` / `Golden`.

## Flow

Each mode is validated by rebuilding from a single color — spacing only affects colors added *after* it's set, so you can't just switch modes on an existing palette and expect the hues to re-fan.

Per mode:

| Step | Drive | Expect |
|---|---|---|
| reset the palette | `open` the seed URL, `wait --load networkidle` | one testid `ColorItem` · `data-sidebar=open` |
| set the mode | `#color-spacing-value` → `menuitemradio` `<Mode>` | that item's `aria-checked=true` · `#color-spacing-value` contains the mode name |
| build out | button `Add Color`, **one at a time** | after each click, `ColorItem` count is exactly one higher — 6 in total |
| observe | read the hues from the URL | consecutive hues differ by the mode's angle |

Repeat for Tight, Even, Wide, Golden.

**Re-opening the seed URL does not reset the mode.** `colorSpacing` is persisted to localStorage, so "Wide (default)" is only the *first-visit* default — after a Tight run, a fresh load still reads `Tight - 30°`. The flow survives because every pass sets the mode explicitly; just don't read the trigger and assume you're on Wide.

**Add the five colors one at a time, asserting the count after each** — fired back-to-back they drop intermittently (the `Add Color` trap in SKILL.md; not the dropdown). Assert `aria-checked` on the `menuitemradio` rather than the trigger's text, which is compound (`Wide - 77°`).

## What you're actually checking

The assertion here is genuinely visual: **Golden's fan should be visibly wider than Tight's.** Compare the six base hues across the four runs. The URL tells you the hues numerically if you'd rather assert than eyeball — each color's segment carries its hue as the third value (`Name-L_C_H`), and consecutive hues should differ by roughly the mode's angle.

That numeric check is the stronger one. With Tight (30°), six colors starting near hue 321 should land near 321, 351, 21, 51, 81, 111 (mod 360). Golden (137.5°) should scatter them far apart. If every mode produces the same spread, the setting isn't being applied.

`palette:color_spacing` is the analytics event, from `Generator/Panel/AddColor.tsx`.

## What CI does not cover here

The e2e spec is screenshot-only — it never asserts the hue values numerically, so a bug that applied the *wrong* angle (but consistently) could slip through as long as the picture looked plausible. Doing the numeric check above is strictly more than CI does.
