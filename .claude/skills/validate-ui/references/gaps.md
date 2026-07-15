# What the e2e suite does not cover

Read this when deciding **where manual validation is actually worth the time**. Everything here is unprotected: nothing breaks in CI when it drifts.

Two consequences:

1. **Untested = where the bugs are.** Driving a flow e2e already covers mostly re-runs CI by hand; the list below is the part of the app that has never been exercised.
2. **Selectors here are unverified.** Everywhere else in this skill, a selector is one the e2e suite drives — so a rename breaks CI before it breaks the skill. Not here. **Snapshot before trusting any selector in this file.**

## Never clicked at all

| Control | Where |
|---|---|
| `New Palette` | header |
| `Random color for <name>` | sidebar card actions |
| **Color picker popover** (`Color picker for <name>`) | sidebar card — the big ColorBox |
| **Color text input** (`Color value for <name>`) | sidebar card — typing a hex/oklch string |
| Per-color `Saturation Override` switch | inside a ColorItem |
| `View Live Preview for <name>` | sidebar card + scale row (the eye icon) |
| Per-curve reset buttons (`Reset <name> to default`) | every curve control |
| Curve info tooltips (`Description for <curve>`) | every curve heading |

Every color edit in e2e goes through a slider. **Nobody has ever typed a color into this app in a test.** The text input accepts bare hex and full oklch strings — that parsing path is completely unguarded.

## Auth

- **OAuth** — Google and GitHub buttons. Never clicked.
- **Sign Up** tab. (The Firebase mock implements `signUp`; it's just never driven.)
- **Magic Link** tab, and **`/auth/callback`** — the landing route. Never visited.
- Failed login, form validation errors, password-visibility toggle.
- `/palettes` empty-state `Create Palette` CTA; the signed-out `Sign In` CTA.
- `Load Palette Colors (<name>)` — the swatch-strip link on a palette card (only the name link is tested).

## Export

Tabs are switched. **The exported content is never asserted.** Not one line, in any format.

- No format's output is verified against the palette.
- The SVG / Figma tab body is never rendered in an assertion.
- Per-color **selection** in the Export All drawer (`Select All`, `Select None`, chips, `Copy All (N)`, per-row copy) — untested.
- Export's independence from the group filter — untested (and `groups.spec.ts` explicitly declines to assert it).

If you have time for one thing, read the `<pre>` and check the values match the swatches.

## Opened but never driven

- **Contrast Grid** — the `WCAG 3 · APCA` ↔ `WCAG 2` toggle, every threshold button, every cell. Screenshot only.
- **Color Info** — step selection (table rows, chart bars), chips, gamut-drift warnings.
- **Charts** — step interaction; the shift-click "toggle all colors" path.

## Never rendered

- **The sRGB path.** `e2e/__setup__/page.ts` forces `matchMedia('(color-gamut: p3)')` to `true` so the gamut UI is deterministic. The non-P3 rendering path has never been rendered in a test — including the `p3-unsupported:` warning line in `DisplayMenu/Gamut.tsx` and, more importantly, every color surface's sRGB (hex) branch, since gamut is implemented purely in CSS custom properties.

## Never round-tripped

- **Share.** The button is clicked and the toast asserted. The copied URL is never re-opened to confirm it rebuilds the same palette. The whole product premise is "the URL is the palette" and nothing verifies the round trip.

## Routes never visited

`/about` · `/privacy` · `/terms` · `/oklch-vs-hsl` · `/custom-color-scales` · `/og/[...slug]` (the OG image) · `/vid` · `not-found` · `global-error`

Also unrendered: the `Contact` / `Feedback` modal, and `AppIntro`.

## Structural gaps

- **Chromium only.** No Firefox, no WebKit.
- **No accessibility pass.** No axe, no keyboard-only traversal.
- **One mobile profile** (iPhone 12 Pro). No tablet breakpoint anywhere.
- Snapshots are generated on macOS, not the Linux CI runner — differences are absorbed by `maxDiffPixelRatio`. Don't regenerate snapshots to chase a CI diff.
