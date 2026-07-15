# Validate: preview

The live preview renders real UI components and typography in your palette's colors. It has its **own** theme, independent of the app's theme — that's the whole point (you're checking whether your colors work in light and dark without flipping the whole app).

**Seed:** palette — `/p/Primary-60_0.21_150/Secondary-60_0.139_227/Tertiary-60_0.266_304`

Testids: `Preview`, `Preview-Header`, `Preview-Toolbar`, `Preview-Controls`, `Preview-Typography`, `Preview-Cards`.

It's a collapsible panel below the palette in List view, and the whole region in Preview view.

## Flow

The panel opens on the **Components** tab, so drive Typography first — otherwise the Components row's expectation (`Preview-Typography` count `0`) is already true before you click anything and proves nothing.

| Step | Drive | Expect |
|---|---|---|
| scroll to it | `agent-browser scrollintoview '[data-testid=Preview]'` | panel visible |
| cycle the theme | button matching `/^Preview theme:/` | the button's **accessible name carries the mode** and cycles `Preview theme: Auto` → `Light` → `Dark` → `Auto`, **while `<html>` keeps its own theme** — that independence is the thing being tested. Target it by prefix; the name changes on every click |
| Typography tab | tab `Typography` | `aria-selected=true` · testid `Preview-Typography` renders |
| Components tab | tab `Components` | testid `Preview-Controls` visible · `Preview-Typography` count `0` |
| change preview color | radio `Secondary` | `aria-checked=true` · components repaint in Secondary |
| collapse | button `Collapse Live preview` | `data-preview` → `closed` |
| expand | button `Expand Live preview` | `data-preview` → `open` |

The collapse button's accessible name flips between `Collapse Live preview` and `Expand Live preview` — target the one matching the current state, or you'll miss.

## Things worth knowing

**The color radiogroup is keyboard-navigable.** `role=radiogroup` named `Preview color`, with roving tabindex — arrow keys move between color dots. Nothing in CI drives that path.

**`showPreview` is persisted.** Collapsing it sticks across reloads (localStorage), which is exactly why the group-filter code must never touch it as a side effect — see the invariant in `groups.md`. If you collapse the preview here and then go validate groups, clear storage first or you'll confuse yourself.

**`Preview/Controls.tsx` is `inert`.** The buttons, switches, sliders and chips inside the Components tab are decorative — they exist to be *looked at*, not clicked. Don't report them as broken interactive controls.

**The preview gets its own token ramps.** `utils/preview-tokens.ts` generates light and dark CSS custom properties at a minimum step count so the `50…900` slots always exist, independent of the palette's actual step count. So setting steps to 3 should not break the preview.

## What CI does not cover here

- The **per-color preview button** (`View Live Preview for <name>`) in the sidebar card and on each scale row — the eye icon that jumps the preview to that color. Never clicked.
- Arrow-key navigation of the preview color radiogroup.
- The preview's behavior at extreme step counts (3 or 20).
