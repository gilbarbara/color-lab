# Validate: auth

Sign-in, and the only thing gated behind it: **persistence**. Saving, the saved list, favorites, delete.

**Seed:** single — `/p/Primary-73.0_0.23001_321`

Credentials are in the shell: `$COLOR_LAB_EMAIL` / `$COLOR_LAB_PASSWORD`. This drives **real Firebase** against the dev server — e2e mocks it, you don't. So:

- You are creating and deleting **real records**. Name test palettes distinctly (`Test-<timestamp>`) and delete them when you're done.
- Don't leave a signed-in session lying around if you cleared storage at the start; sign out or clear again at the end.

## What is and isn't gated

| Free (anonymous) | Requires sign-in |
|---|---|
| generate, edit, all scale options, presets, groups, reorder, export, share, **rename the palette** | **Save / Update** |
| every static page, feedback form | `/palettes` list, favorite, delete |

Naming and sharing are deliberately *not* gated — only persistence is. A palette you never save is not lost: it's in the URL.

## Sign in

Login is a modal. It opens from the header `Sign In` button, from `Save` while signed out, or from `/palettes` while signed out.

| Step | Drive | Expect |
|---|---|---|
| open | within testid `Header`: button `Sign In` | modal, heading `Sign in` |
| fill | textbox `Email*`, textbox `Password*` | — |
| submit | **button** `Login` — `scrollintoview` + `click`, or focus an input and `press Enter` | header `Sign In` disappears · label `User Menu` (avatar) appears |
| check the menu | click `User Menu` | menuitem showing the account email |
| sign out | `User Menu` → menuitem `Sign Out` | `Sign In` is back |

The modal has a **`tab` named `Login` as well as the submit `button`** — target the button by role, or `find text "Login"` will hit the tab.

Wait for auth to settle before clicking. The Sign In button renders a spinner while Firebase restores the session; a click landing in that window races the re-render and gets dropped. `wait --load networkidle` first.

The Save-gate step below starts from a **signed-out** state. If you run these tables top-to-bottom you'll already be signed in, see no modal, and mis-report the gate as broken — sign out first (the last row above does it).

The modal also has **Google** / **GitHub** buttons and **Sign Up** / **Magic Link** tabs. None of them are tested — see the gaps below.

## Save

The gate: clicking the header save button while signed out opens the login modal instead of saving. Worth confirming, since it's the whole auth story.

**Two different controls are both called "Save" — don't conflate them.** The header button is `Save palette` (heart), becoming `Update palette` (pencil) once the palette has an id. The button *inside* the save modal is `Save`, exactly.

| Step | Drive | Expect |
|---|---|---|
| build something | `Add Color` ×3 | 4 colors |
| save while signed out | button `Save palette` | the **login modal opens** — nothing was saved · URL gains no `?id=` |
| sign in from there | fill + `Login` | modal closes, signed in |
| save for real | `Save palette` → textbox `Name*` → fill → modal button `Save` | modal closes · toast "Palette saved" |

The header button turns `warning`-colored when there are unsaved changes and disables when there's nothing to save — that disabled state is a good assertion. So is the modal's `Save`, which stays `disabled` until the name is non-empty.

**Don't assert `?id=` right after `wait --load networkidle`.** The identity strip lands a beat later via `router.replace`, so an immediate read still shows the URL without it. Wait on the toast text, or on `?id=` actually appearing.

## My Palettes

| Step | Drive | Expect |
|---|---|---|
| navigate | link `My Palettes` | URL `/palettes` |
| the record is there | — | the palette name is visible |
| favorite | button `Favorite Palette (<name>)` | the accessible name flips to `Unfavorite Palette (<name>)` **immediately** — no reload needed |
| persists | reload | still `Unfavorite Palette (<name>)` |
| load | link `Load Palette (<name>)` | URL back to `/p/…` with **`?id=`** · the color count matches |
| delete | button `Remove Palette (<name>)` → button `Confirm` | the card is gone |

## Identity — the subtle part

**The stored `url` is the structural form only** — no `?id=`, no `?name=`. Identity lives in the record's fields and gets re-attached when the palette is read back. So:

- Renaming a saved palette is a **field write**, not a URL rewrite.
- A stored URL stays valid even if the identity scheme changes.
- **Committing a name does not save it.** The name lands in the store and the URL immediately; it only reaches the record when you click `Update`. This trips people up — check it:

| Step | Drive | Expect |
|---|---|---|
| rename a loaded palette | `input[name="palette-name"]` → clear, fill, `press Enter` | URL `?name=` updates · `Update palette` becomes **enabled** |
| persist it | button `Update palette` | it becomes **disabled** (nothing left unsaved) · toast "Palette updated" |
| confirm it stuck | go to `/palettes`, load it again | the new name is there · **the `?id=` is unchanged** |

That last check — the id surviving a rename — is the one that proves identity isn't riding on the URL.

## What CI does not cover here

- **OAuth**: the Google and GitHub buttons. Never clicked.
- **Sign Up** tab and **Magic Link** tab. The Firebase mock even implements `signUp` — it's just never driven.
- **`/auth/callback`** — the magic-link landing route. Never visited.
- Failed login, form validation errors, the password-visibility toggle.
- `/palettes` **empty-state CTA** (`Create Palette`) and the signed-out `Sign In` CTA.
- The swatch-strip link on a palette card (`Load Palette Colors (<name>)`) — only the name link is tested.
