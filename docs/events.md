# Analytics Events

PostHog, autocapture **off** — every event is manual and curated. All events go through
`trackEvent(name, data)` (`src/utils/analytics.ts`). Page views are manual
(`trackPage` → `$pageview`); `$pageleave` and `$web_vitals` are PostHog built-ins.

## Conventions

### Naming

`domain:action` — colon-namespaced, present-tense verb, `snake_case` for multi-word tokens.

- Where the action *is* "this value changed," the bare property name stands in for the
  verb instead of a forced `change_` prefix: `options:steps`, `options:saturation`.
- Per-field qualifiers are **suffixes**, not prefixes: `chroma_curve_mode`,
  `hue_shift_reset` — not `mode_chroma_curve` / `reset_hue_shift`.

### Domains

A domain is either a **subject** the action acts on, or the **tool** an interaction acts on
happens inside.

**Subjects** (act on the object):

- `palette` — palette-wide actions: any-user actions (create, share, export, view) plus
  saved-record operations (save, rename, delete, favorite).
- `color` — a color card in the left sidebar: its value, name, and per-color option
  overrides, and its preview.
- `scale` — a generated ramp row in the palette view, and the tools invoked on it
  (preview, charts, info, contrast, export).
- `options` — the global generation config that produces every scale (steps, saturation,
  curves, range, hue shift).

**Tools** (interactions *inside* an opened tool): `contrast`, `charts`, `info`,
`preview`, `export`.

**Rules:**

- Invoking a tool from a scale row is a `scale:*` event (`scale:contrast`,
  `scale:charts`, …); invoking the sidebar preview is `color:preview`. Once inside the
  tool, interactions belong to the tool's own domain (`contrast:change_guideline`,
  `charts:change_tab`, …). This keeps each feature domain meaning "controls inside this
  feature," not "the feature end-to-end."
- **Export** is the only tool that produces a committed artifact, so copying the whole
  subject is attributed to the subject: `scale:export_copy`, `palette:export_copy`. The
  drawer's shared controls (format tabs, per-row copy) stay in `export` because they're
  the same `ExportDrawer` in both drawers — they can't belong to one subject.
- **ScaleColorOptions** (chroma/lightness curves, hue shift, lightness range) renders
  both globally (Advanced Options) and per-color; a `source` discriminator
  (`'options' | 'color'`) routes the same control to `options:*` or `color:*`. That's why
  those events appear in both domains from one component. `PreviewButton` uses the same
  pattern (`source: 'scale' | 'color'`) to emit `scale:preview` / `color:preview`.

**Other domains:** `preset`, `auth`, `feedback`, `app`.

### Property keys

`snake_case`, standardized:

| Key | Meaning |
|---|---|
| `value` | The selected/committed value of a setting |
| `enabled` | Boolean toggle state (the *next* state) |
| `mode` | A mode/variant selection |
| `source` | Which surface triggered it (e.g., color edit: `picker`/`sliders`/`input`) |
| `provider` | Auth provider |
| `format` / `color_format` | Export/copy formats |
| `count` | Number of items acted on |
| `scope` | Breadth of an action (`single`/`all`) |
| `name` | User-supplied name (palette/color) |
| `target`, `guideline`, `chart`, `step`, `tab`, `action` | Domain-specific dimensions |

### Built-in events

`$pageview` (manual, `usePageTracking`), `$pageleave`, `$web_vitals`. `before_send`
normalizes `$current_url`/`$pathname` and drops all `/auth/*` events.

---

## palette

Palette-wide actions — create, share, export, and view (available to any user), plus
saved-record operations (save, rename, delete, favorite).

| Event | Trigger | Props | Location |
|---|---|---|---|
| `palette:create` | New Palette button | — | `Header.tsx` |
| `palette:save` | Save current palette | — | `Palette/Header/SaveControls.tsx` |
| `palette:update` | Update saved palette | — | `Palette/Header/SaveControls.tsx` |
| `palette:dismiss_save` | Close SavePaletteModal without saving | — | `Palette/Header/SaveControls.tsx` |
| `palette:load` | Open a saved palette | `{ name }` | `Palettes/PaletteCard.tsx` |
| `palette:delete` | Delete saved palette | `{ name }` | `Palettes/PaletteCard.tsx` |
| `palette:favorite` | Favorite | `{ name }` | `Palettes/PaletteCard.tsx` |
| `palette:unfavorite` | Unfavorite | `{ name }` | `Palettes/PaletteCard.tsx` |
| `palette:share` | Copy palette URL | — | `Palette/Header/ShareButton.tsx` |
| `palette:rename` | Commit palette name | `{ name }` | `Palette/Header/NameField.tsx` |
| `palette:export` | Open the Export All drawer | — | `ExportPalette.tsx` |
| `palette:export_copy` | Copy All in the palette drawer | `{ format, color_format, count }` | `ExportPalette.tsx` |
| `palette:color_spacing` | Change color spacing | `{ value }` | `Generator/Panel/AddColor.tsx` |
| `palette:view` | Switch palette view (List/Grid/Preview) | `{ value }` | `Palette/Options/View.tsx` |

## color

Per-color actions from the sidebar card, including per-color overrides of the `options`
generation config (via the `source` discriminator — see Conventions).

| Event | Trigger | Props | Location |
|---|---|---|---|
| `color:add` | Add color | — | `Generator/Panel/AddColor.tsx` |
| `color:select` | Activate a color from the sidebar/bottom-bar strip | — | `Generator/Panel/index.tsx` |
| `color:remove` | Remove color (confirmed) | — | `ColorList/ColorItem.tsx` |
| `color:randomize` | Randomize one color | — | `ColorList/ColorItem.tsx` |
| `color:edit` | Change color value | `{ source, mode }` | `ColorList/ColorItem.tsx` |
| `color:rename` | Commit color name | `{ name }` | `ColorList/ColorItem.tsx` |
| `color:mode` | Toggle SRGB/OKLCH view | `{ value }` | `ColorList/ColorItem.tsx` |
| `color:picker` | Open native picker | — | `ColorList/ColorItem.tsx` |
| `color:preview` | Preview the color (sidebar card) | — | `Preview/Button.tsx` (`source="color"`) |
| `color:options` | Open per-color overrides | — | `ColorList/ColorActions.tsx` |
| `color:reset` | Reset per-color overrides | — | `ColorList/ColorActions.tsx` |
| `color:lock` | Lock a step (per-color override) | `{ value }` | `ScaleColorOptions/Lock.tsx` |
| `color:chroma_curve` | Chroma curve override | `{ value }` | `ScaleColorOptions/ChromaCurve.tsx` |
| `color:chroma_curve_mode` | Chroma curve mode override | `{ mode }` | `ScaleColorOptions/ChromaCurve.tsx` |
| `color:chroma_curve_reset` | Reset chroma curve field | — | `ScaleColorOptions/ChromaCurve.tsx` |
| `color:lightness_curve` | Lightness curve override | `{ value }` | `ScaleColorOptions/LightnessCurve.tsx` |
| `color:lightness_curve_mode` | Lightness curve mode override | `{ mode }` | `ScaleColorOptions/LightnessCurve.tsx` |
| `color:lightness_curve_reset` | Reset lightness curve field | — | `ScaleColorOptions/LightnessCurve.tsx` |
| `color:lightness_range` | Lightness range override | `{ min, max }` | `ScaleColorOptions/LightnessRange.tsx` |
| `color:lightness_range_reset` | Reset lightness range field | — | `ScaleColorOptions/LightnessRange.tsx` |
| `color:hue_shift` | Hue shift override | `{ value }` | `ScaleColorOptions/HueShift.tsx` |
| `color:hue_shift_mode` | Hue shift mode override | `{ mode }` | `ScaleColorOptions/HueShift.tsx` |
| `color:hue_shift_reset` | Reset hue shift field | — | `ScaleColorOptions/HueShift.tsx` |

## scale

Tools invoked on a single generated ramp row in the palette view.

| Event | Trigger | Props | Location |
|---|---|---|---|
| `scale:preview` | View live preview of the scale | — | `Preview/Button.tsx` (`source="scale"`) |
| `scale:charts` | Toggle distribution charts (shift = all) | `{ scope, enabled }` | `ColorCharts/Button.tsx` |
| `scale:info` | Open the Color Info modal | — | `ColorInfo/index.tsx` |
| `scale:contrast` | Open the contrast grid | — | `ContrastGrid/index.tsx` |
| `scale:export` | Open the scale export drawer | — | `ExportScale.tsx` |
| `scale:export_copy` | Copy the whole scale export | `{ format, color_format }` | `ExportScale.tsx` |
| `scale:copy_swatch` | Copy a tone swatch value | — | `Palette/Swatch.tsx` |

## options

Global generation config — the settings that produce every scale. Split across two
panels for progressive disclosure (`Palette/Options/index.tsx` = primary,
`Generator/AdvancedOptions.tsx` = "Advanced Options"); `basic`/`advanced` name the two
bulk resets, not a real category boundary.

| Event | Trigger | Props | Location |
|---|---|---|---|
| `options:steps` | Steps slider | `{ value }` | `Palette/Options/index.tsx` |
| `options:steps_reset` | Reset Steps field | — | `Palette/Options/index.tsx` |
| `options:saturation` | Saturation slider | `{ value }` | `Palette/Options/index.tsx` |
| `options:saturation_reset` | Reset Saturation field | — | `Palette/Options/index.tsx` |
| `options:saturation_override` | Apply-to-all toggle | `{ enabled }` | `Palette/Options/index.tsx` |
| `options:mode` | Scale mode select | `{ value }` | `Palette/Options/index.tsx` |
| `options:variant` | Variant select | `{ value }` | `Palette/Options/index.tsx` |
| `options:lock` | Palette-level step lock | `{ value }` | `Palette/Options/index.tsx` |
| `options:chroma_curve` | Chroma curve | `{ value }` | `ScaleColorOptions/ChromaCurve.tsx` |
| `options:chroma_curve_mode` | Chroma curve mode | `{ mode }` | `ScaleColorOptions/ChromaCurve.tsx` |
| `options:chroma_curve_reset` | Reset Chroma Curve field | — | `ScaleColorOptions/ChromaCurve.tsx` |
| `options:lightness_curve` | Lightness curve | `{ value }` | `ScaleColorOptions/LightnessCurve.tsx` |
| `options:lightness_curve_mode` | Lightness curve mode | `{ mode }` | `ScaleColorOptions/LightnessCurve.tsx` |
| `options:lightness_curve_reset` | Reset Lightness Curve field | — | `ScaleColorOptions/LightnessCurve.tsx` |
| `options:lightness_range` | Lightness range | `{ min, max }` | `ScaleColorOptions/LightnessRange.tsx` |
| `options:lightness_range_reset` | Reset Lightness Range field | — | `ScaleColorOptions/LightnessRange.tsx` |
| `options:hue_shift` | Hue shift | `{ value }` | `ScaleColorOptions/HueShift.tsx` |
| `options:hue_shift_mode` | Hue shift mode | `{ mode }` | `ScaleColorOptions/HueShift.tsx` |
| `options:hue_shift_reset` | Reset Hue Shift field | — | `ScaleColorOptions/HueShift.tsx` |
| `options:reset_basic` | Reset steps/saturation/mode/variant/lock (bulk) | — | `Palette/Options/index.tsx` |
| `options:reset_advanced` | Reset curves/range/hue shift (bulk) | — | `Generator/AdvancedOptions.tsx` |

## preset

| Event | Trigger | Props | Location |
|---|---|---|---|
| `preset:apply` | Apply design-system preset | `{ value }` | `ColorPresets.tsx` |
| `preset:reset` | Clear active preset | — | `ColorPresets.tsx` |

## export

Interactions *inside* the shared export drawer (used by both the palette and scale
drawers). Opening a drawer and copying the whole subject live in `palette:*` / `scale:*`.

| Event | Trigger | Props | Location |
|---|---|---|---|
| `export:copy_row` | Copy one scale row inside the palette drawer | `{ name }` | `ExportPalette.tsx` |
| `export:change_format` | Format tab | `{ value }` | `ExportDrawer.tsx` |
| `export:change_color_format` | Color format tab | `{ value }` | `ExportDrawer.tsx` |

## contrast

Controls inside the contrast grid. Opened via `scale:contrast`.

| Event | Trigger | Props | Location |
|---|---|---|---|
| `contrast:change_guideline` | APCA / WCAG2 toggle | `{ value }` | `ContrastGrid/Sidebar.tsx` |
| `contrast:change_threshold` | Threshold button | `{ guideline, value }` | `ContrastGrid/Sidebar.tsx` |

## info

Color Info modal. Opened via `scale:info`.

| Event | Trigger | Props | Location |
|---|---|---|---|
| `info:copy` | Copy OKLCH / HEX value | `{ format }` | `ColorInfo/Row.tsx` |
| `info:select_step` | Select a step (chart bar / table row) | `{ source, step }` | `ColorInfo/ChromaDistributionChart.tsx`, `Row.tsx` |

## charts

Distribution charts. Opened via `scale:charts`.

| Event | Trigger | Props | Location |
|---|---|---|---|
| `charts:change_tab` | Chroma / Lightness / Hue tab | `{ chart }` | `ColorCharts/index.tsx` |

## preview

The live preview panel's own controls. Opened from a scale (`scale:preview`) or a color
card (`color:preview`).

| Event | Trigger | Props | Location |
|---|---|---|---|
| `preview:toggle` | Expand / collapse the panel | `{ enabled }` | `Preview/index.tsx` |
| `preview:change_view` | Components / Typography | `{ value }` | `Preview/index.tsx` |
| `preview:change_theme` | Auto / Light / Dark | `{ value }` | `Preview/index.tsx` |
| `preview:select_color` | Pick preview color | — | `Preview/index.tsx` |

## auth

| Event | Trigger | Props | Location |
|---|---|---|---|
| `auth:login` | Login (any provider) | `{ provider }` | `Login.tsx` |
| `auth:logout` | Logout | — | `UserMenu.tsx` |
| `auth:change_tab` | Login / Signup / Magic Link tab | `{ tab }` | `Login.tsx` |
| `auth:dismiss` | Close login modal without auth | — | `Login.tsx` |

## feedback

| Event | Trigger | Props | Location |
|---|---|---|---|
| `feedback:open` | Open feedback | — | `Contact.tsx` |
| `feedback:send` | Feedback sent (POST ok) | — | `Contact.tsx` |

## app

Global UI + error boundary.

| Event | Trigger                                                     | Props | Location |
|---|-------------------------------------------------------------|---|---|
| `app:theme` | Dark mode toggle                                            | `{ value: 'dark' \| 'light' }` | `Header.tsx` |
| `app:sidebar` | Toggle the color-list sidebar                               | `{ enabled }` | `Generator/Panel/index.tsx` |
| `app:bottombar` | Toggle the mobile bottom bar                                | `{ enabled }` | `Generator/Panel/index.tsx` |
| `app:gamut` | sRGB / P3 toggle                                            | `{ value }` | `Palette/Header/GamutToggle.tsx` |
| `app:display` | Session start (display P3 capability, once per page load) ¡ | `{ p3_supported }` | `Analytics.tsx` |
| `app:error_action` | Error boundary reset / reload                               | `{ action }` | `ErrorFallback.tsx` |

---

## Adding an event

1. Pick the domain by the rules above: **subject** (`palette`/`color`/`scale`/`options`)
   for acting on an object, **tool** (`contrast`/`charts`/`info`/`preview`/`export`) for
   interactions inside an opened tool.
2. Name it `domain:action`; use the bare property name as the verb where the action is
   "this value changed"; suffix per-field qualifiers (`_mode`, `_reset`).
3. Reuse a standardized property key; keep props `snake_case`.
4. Fire through `trackEvent(name, data)` — no change needed in `analytics.ts`.
