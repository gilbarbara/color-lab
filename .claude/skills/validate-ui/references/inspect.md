# Validate: inspect

The three analysis tools that hang off a scale row: **charts**, **Color Info**, **Contrast Grid**.

**Seed:** palette — `/p/Primary-60_0.21_150/Secondary-60_0.139_227/Tertiary-60_0.266_304`

**CI opens all three, screenshots them, and closes them.** It never touches a control inside any of them. Everything below the "Flow" table is untested territory.

## Flow (what CI does cover)

| Step | Drive | Expect |
|---|---|---|
| open charts | button `View Charts for <Name>` | tab `Chroma` visible (default) |
| Lightness chart | tab `Lightness` | chart switches |
| Hue chart | tab `Hue` | chart switches |
| close charts | `View Charts for <Name>` again | collapses |
| open Color Info | button `View Color Info for <Name>` | columnheader `APCA Lc` visible |
| close | button `Close` | gone |
| open Contrast Grid | button `View Contrast Grid for <Name>` | button `WCAG 3 · APCA` visible |
| close | button `Close` | gone |

All three are `View … for <Name>` — one button per color, so the name disambiguates and no `.first()` is needed. The column header is `APCA Lc` (lowercase `c`), not `APCA LC`.

## Charts

Tabs: **Chroma** (default) · **Lightness** · **Hue**. Testid `ColorCharts`.

The chroma chart plots three things at once: the **gamut ceiling**, the **curve you asked for**, and the **output that survived clamping**. Where those diverge, a color is being clipped — worth eyeballing rather than just asserting the tab switched.

`ColorCharts` has **no nested testids** — `ColorInfo-ChromaDistributionChart` and `-Bar` live inside the **Color Info modal**, not here (see below).

The chart's step dots are `button aria-label="Step 400: chroma 0.210"` (colon). Clicking one flips `aria-expanded` to `true` and opens a tooltip — it **opens a popover, it does not select a step**. (The Color Info chart bars are the ones that select; note they use a *comma*: `Step 400, chroma 0.210`.)

**Shift-click `View Charts for <Name>` toggles charts for every color at once** (the tooltip says so). Untested — and note `agent-browser click` has no modifier flag, so the only way to drive it is dispatching a synthetic `MouseEvent` with `shiftKey: true` via `eval`. That exercises the React handler, not the real input layer; say so if you report on it.

## Color Info

Modal, header `Color info · <name>`. Testid `ColorInfo`.

- **Scale options table** (testid `ColorInfo-ScaleOptions`) — overridden values render in a distinct color (class `text-secondary-600` vs `text-foreground`), so you can see at a glance what this color diverges on.
- **Chroma distribution chart** (`ColorInfo-ChromaDistributionChart`, bars `-Bar`) — the bars are **clickable**; clicking one selects that step. The bar carries **`aria-pressed`**, which is the selection observable.
- **Definition** panel (`ColorInfo-Definition`) — its text is the other good proof of which step is selected.
- **Step table** (testid `ColorInfo-Table`, rows `ColorInfo-Row`) — OKLCH breakdown, APCA contrast on white and black, a lock indicator on the locked step, and a per-row gamut cell (`ColorInfo-Gamut`).

**`ColorInfo-Gamut` is present on every row**, not only on drifting ones — it holds two swatches and a `More information` button. Drift is encoded in the warning icon's `style="opacity"` (≈0.15 clean, ≈0.69 drifting); the popover content is the drift-specific part (`Hex roundtrip drift · ΔE 0.028`).

**Each row's step cell holds a real `button "Step <n>"` with `aria-pressed`** — that's the control, and the observable. A locked step names itself `Step 500, locked`. The row also has an `onClick` as a pointer convenience, but drive the button: it's the keyboard path, and clicking the row's geometric centre lands on the gamut warning `<svg>` instead.

Selection is mirrored on the chart bar's `aria-pressed` and in `ColorInfo-Definition` — all three move together.

## Contrast Grid

Modal, header `Contrast grid · <name>`. Every step scored against every other.

**Sidebar** (`ContrastGrid-Sidebar`):
- Guideline: `WCAG 3 · APCA` (default) or `WCAG 2` — two buttons.
- Threshold buttons, drawn from `APCA_THRESHOLDS` / `WCAG_THRESHOLDS` (the set changes with the guideline). APCA defaults to `Large min 45+`.
- Under APCA, a hint: "Rows = text / Cols = background" — APCA is directional, unlike WCAG 2. Swapping foreground and background gives different scores, and that's correct.

The guideline and threshold lists are **radiogroups** (`Guidelines` and `APCA Lc` / `Contrast Ratio`), so the selected option is `aria-checked` — read it from `snapshot`, never from a class.

**Grid**: `role=table`, named `Contrast grid for <name>`. Rows are `role=row`, headers `columnheader` / `rowheader`, cells `role=cell` (testid `ContrastGrid-Cell`). It is a `table`, not a `grid` — no cell is focusable, so it cannot honor the `grid` role's two-dimensional navigation contract.

**Each cell names its own meaning** — `Text 500 on background 100: Lc 67, pass`. That is the observable: the pair, the score, and the outcome, all in the accessible name. Row = text, column = background (APCA is directional).

**Under `All`, the outcome is omitted** — names read `Text 500 on background 100: Lc 67`, full stop. `All` grades nothing, so no cell claims a verdict.

| Step | Drive | Expect |
|---|---|---|
| switch guideline | radio `WCAG 2` | `aria-checked=true` · thresholds swap to `AA Large 3+` … · cell names read `ratio` not `Lc` |
| raise the threshold | radio `Body pref 90+` | `aria-checked` moves · more cells' names end in `fail` |
| show everything | radio `All` | no cell name carries `pass` or `fail` |

Failing cells render their score too — they are not blank.

## What CI does not cover here

- **Contrast Grid**: the `WCAG 3 · APCA` ↔ `WCAG 2` toggle, every threshold button, and every cell. Opened and screenshotted only.
- **Color Info**: step selection via the table rows or the chart bars; the chips; the gamut-drift warnings.
- **Charts**: step interaction, and the shift-click "all colors" path.

If you only drive the table above, you've re-run CI — exercise the untested controls listed above.
