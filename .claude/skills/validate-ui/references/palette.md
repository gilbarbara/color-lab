# Validate: palette

The main region — the palette header (name, display, share, save, export) and the three views.

**Seed:** palette — `/p/Primary-60_0.21_150/Secondary-60_0.139_227/Tertiary-60_0.266_304`

## Sidebar + rename

| Step | Drive | Expect |
|---|---|---|
| collapse sidebar | button `Toggle Sidebar` | `data-sidebar` → `closed` |
| rename | `input[name="palette-name"]` → clear, fill `Design System`, `press Enter` | value holds · URL gains `?name=Design+System` (plus-encoded — a literal comparison against `Design System` fails) |

Renaming is **not** auth-gated, and it's decoupled from saving. Committing a name writes the store and the URL; it does not persist anything. (For a *saved* palette, the name only reaches the record when you click Update — see `auth.md`.)

## Views

The Display popover holds both the view switch and the gamut switch.

**`view` is persisted to localStorage.** It is *not* reliably `List` on arrival — a reload restores whatever you last selected. Assert the starting view rather than assuming it, and set it explicitly if a step depends on it.

| Step | Drive | Expect |
|---|---|---|
| open | button `Display Options` | popover opens |
| Grid | radio `Grid` | testid `PaletteGrid` renders — square swatches of the base colors |
| Preview | `Display Options` → radio `Preview` | the live preview fills the region · group toolbar hides |
| List | `Display Options` → radio `List` | one testid `Scale` per color |

The Preview row's "group toolbar hides" only proves something **if a group is assigned** — the toolbar doesn't exist at all otherwise, so on the bare seed the assertion passes vacuously in every view. Assign one first (`Color group for Primary` → `Brand`, URL gains `-g:b`), then check the chip count goes 1 → 0 on Preview. See `groups.md`.

### Gamut

Same popover. `P3` (wide, vivid) vs `SRGB` (universal). Global, not per-color.

| Step | Drive | Expect |
|---|---|---|
| switch to sRGB | `Display Options` → radio `SRGB` | `data-gamut` → `srgb` |
| back to P3 | `Display Options` → radio `P3` | `data-gamut` → `p3` |

Gamut is implemented purely in CSS — every color surface emits both an OKLCH and a hex custom property and a Tailwind variant picks one. So it changes what swatches **paint** and what clicking one **copies**, with no JS branch. It does **not** affect export, which has its own format setting.

If the display can't be verified as P3-capable, **both radios still render and stay usable** — the only change is an extra warning line, "We couldn't verify P3 support on your display." (`DisplayMenu/Gamut.tsx`, shown via the `p3-unsupported:` Tailwind variant). Nothing is locked or replaced. `data-p3-supported` on `<html>` tells you which case you're in.

## Swatch copy

| Step | Drive | Expect |
|---|---|---|
| copy a step | button matching `/^copy .* 500(,|$)/i`, `.first()` | a toast appears |

Each swatch is named `Copy <name> <step>`. A locked step carries a trailing `, locked` in its accessible name — that's why the regex tolerates a comma. What lands on the clipboard depends on the current gamut (OKLCH in P3, hex in sRGB).

Clipboard reads in a headless browser are unreliable; the toast appearing is the assertion worth making, not the clipboard contents.

## Share

| Step | Drive | Expect |
|---|---|---|
| share | button `Share` | toast: the palette URL was copied |

Share is **not** auth-gated — copying the address bar *is* sharing. It always copies the whole palette, ignoring any active group filter.

## Header controls, in one place

| Control | Auth-gated? | Notes |
|---|---|---|
| `Palette name` | no | writes `?name=` |
| `Display Options` | no | view + gamut |
| `Palette Options` | no | see `scale.md` |
| `Export All` | no | see `export.md` |
| `Share` | no | copies the URL |
| `Save palette` / `Update palette` | **yes** | opens the login modal if signed out — see `auth.md` |

Only persistence is gated. Naming, sharing, and exporting are deliberately free.

## What CI does not cover here

- The **sRGB rendering path**. The e2e harness forces `matchMedia('(color-gamut: p3)')` to `true`, so the non-P3 UI — including the locked warning badge — is never rendered in CI. If you're validating gamut, this is the part actually worth your time.
- **Share round-trip**: the button is clicked but the copied URL is never re-opened to confirm it rebuilds the same palette.
- The actual **clipboard contents** of a swatch copy.
