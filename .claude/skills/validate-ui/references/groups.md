# Validate: groups

Two features sharing one piece of state:

- **Assignment** — a `g:` code on the color's URL segment. Set from either the sidebar card *or* the scale row. Persists in the URL.
- **Filtering** — an in-memory `appStore.groupFilter`. **Not** in the URL, so it does not survive a reload, and that's intentional.

The filter is a **view lens only**. It affects the Grid and List views and nothing else — Export All, Share, and the sidebar color list always act on the whole palette. Don't report "export ignored my filter" as a bug; that's the design.

**Seed:** single — `/p/Primary-73.0_0.23001_321`

Four groups, with these URL codes:

| Group | Code |
|---|---|
| Brand | `b` |
| Neutral | `n` |
| Semantic | `s` |
| Decorative | `d` |

## Selectors

- **Toolbar**: `role=group` named `Filter by color group`. It only exists when at least one color has a group — no groups, no toolbar.
- **Chips**: buttons inside the toolbar, named for the group (`Brand`, exact). State is `aria-pressed`. **`Clear group filters` also lives inside the toolbar** and has no `aria-pressed` — so identify chips by *having* `aria-pressed`, not by "button inside the toolbar", or you'll count N+1 while a filter is active.
- **Clear**: button `Clear group filters` (only rendered while a filter is active).
- **Assign**: the color's container — `role=group` named `<Name> settings` (sidebar card) or `<Name> scale` (scale row) — then button `Color group for <Name>`, then a `menuitemradio`.
- **Scales**: testid `Scale`, one per visible color. Counting these is how you prove a filter worked.

**The menu's items are conditional and not in the order you'd guess.** For an *ungrouped* color the menu is just `Brand` / `Neutral` / `Semantic` / `Decorative` — there is **no `None`**. `None` only appears once a group is assigned, and then it is the **first** item.

**`find role menuitemradio` does not resolve** — agent-browser returns "Element not found" even when the item is plainly in the snapshot. `snapshot -s '[role=menu]'` and click by `@ref`. You also need an explicit `wait '[role=menu]'` after clicking the group button, or the next command fires too early.

The sidebar card's group menu **only exists for the active color** (it's in the Collapse). The scale row's menu always exists. On a fresh seed the first color is active, so the card path works for Primary; use the scale row for everything else — but those buttons are far down the page, so `scrollintoview` first, then `scroll up ~120` to clear the sticky header, or the click lands on it.

## Flow

| Step | Drive | Expect |
|---|---|---|
| no groups yet | — | toolbar count `0` · one `Scale` |
| assign from the **card** | group `Primary settings` → `Color group` → `Brand` | URL: Primary's segment carries `g:b` · chip `Brand` appears |
| assign from the **scale row** | `Add Color`, then group `Secondary scale` → `Color group` → `Brand` | Secondary's segment carries `g:b` · still **one** chip — one chip per *used* group, not per group that exists |
| fill out the rest | add colors, assign Decorative ×2, Neutral ×2, Semantic ×3 (9 colors total) | chips read `Brand`, `Neutral`, `Semantic`, `Decorative` — **config order, not assignment order** |
| filter by one | click chip `Brand` | chip `aria-pressed=true` · `Scale` count = 2 |
| toggle it off | click chip `Brand` again | `aria-pressed=false` · count back to 9 |
| filter by two | click `Brand`, then `Semantic` | count = 5 — chips are additive (OR), not exclusive |
| clear | button `Clear group filters` | count = 9 · the Clear button itself disappears |
| filter the Grid | `Display Options` → radio `Grid`, then chip `Neutral` | testid `PaletteGrid` has 2 buttons — the lens applies to Grid too |
| preview view | `Display Options` → radio `Preview` | toolbar count `0` — hidden entirely in preview |

## The retirement rules

The filter can point at a group that no longer exists. Two ways that happens, and both must self-heal rather than leaving you staring at an empty palette.

**A group's last color loses its group:**

| Step | Drive | Expect |
|---|---|---|
| filter Decorative (2 colors) | click chip `Decorative` | `Scale` count = 2 |
| ungroup one of them | `Tertiary scale` → `Color group` → `None` | segment loses `g` · count = 1 · chip **still there** (group still in use) |
| ungroup the last one | `Accent scale` → `Color group` → `None` | segment loses `g` · chip **gone** · count = 9 — the filter retired itself instead of stranding the view empty |

**A group's last color is removed entirely:**

| Step | Drive | Expect |
|---|---|---|
| filter Brand (2 colors) | click chip `Brand` | count = 2 |
| remove both | `Select Primary` → confirm-remove; `Select Secondary` → confirm-remove | chip `Brand` gone · count = 7 |

Remove is a click-again-to-confirm control. It renders for every color but is `disabled` unless that color is **active** — so select the color from its (still visible) scale row first, confirm `aria-current="true"` on its `ColorItem` wrapper, then send both clicks with nothing in between.

## The invariant worth checking

Two sets of actions, two different rules about `showPreview`:

- `setGroupFilter` / `toggleGroupFilter` (**clicking a chip**) — *may* touch `showPreview`, and does: applying a filter collapses the live preview. `data-preview` going `open` → `closed` when you press a chip is **correct**, not a bug.
- `resetGroupFilter` / `pruneGroupFilter` (**clearing, or a group retiring itself**) — must **never** touch `showPreview`. These are bookkeeping. `showPreview` is persisted to localStorage, so a stray write here is a visible, sticky bug that follows the user across reloads.

How to check it properly:

| Step | Drive | Expect |
|---|---|---|
| baseline | read `dataset.preview` | `open` |
| apply a filter | click a chip | `aria-pressed=true` · `dataset.preview` → `closed` (allowed) |
| **clear it** | button `Clear group filters` | `dataset.preview` **still `closed`** — the clear must not flip it back open, or shut it further |

Naively asserting "preview unchanged across the whole flow" fails on the first step and looks like a bug. The rule is about *which* action wrote to it.

## Gotcha: drive the menu by `@ref`, not by `find role`

The `ColorGroupMenu` **does** close on selection — no lingering overlay, no backdrop — so you do **not** need a `press Escape` before clicking a chip; the menu unmounts.

What actually bites here is `find role`:

- **`find role menuitemradio` does not resolve at all** — "Element not found", even with the item plainly in the snapshot.
- **`find role button click --name "Color group for <Name>"` silently does nothing** — it reports `✓ Done` and leaves the button `aria-expanded=false`. `click @ref` opens it.

So: `snapshot`, `click @ref` on the group button, `wait '[role=menu]'`, `snapshot -s '[role=menu]'`, `click @ref` on the item. This is the general "prefer `click @ref` over `find role`" rule from CLAUDE.md — this is the place it actually bites.

Note there are three elements named `Brand` in the DOM while the menu is open: the toolbar chip (`button`), the menu item (`menuitemradio`), and a wrapper. Only the `button` is the chip.

**The overlay warning in SKILL.md is still real — it's just the `Color Spacing` dropdown, not this one.** That popover *does* stay mounted after a selection and swallows the next click. See `spacing.md`.

## What CI does not cover here

- Group filtering on **mobile** beyond a single chip.
- The filter's interaction with **Export All / Share** — `groups.spec.ts` explicitly declines to assert this. If you want to confirm the lens *doesn't* leak into export, you're on your own; nothing in CI protects it.
