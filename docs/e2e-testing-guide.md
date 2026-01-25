# E2E Testing Plan: Color Lab Generator

## Overview

Structured, repeatable E2E test steps for the Color Lab palette generator using `agent-browser` automation. Covers both desktop (1280x800) and mobile (iPhone 14) viewports.

---

## Element Reference Guide

### Slider Interaction Methods

Sliders are the primary input method (textboxes are readonly).

```bash
# Method 1: Set exact value
agent-browser fill @ref "0.5"

# Method 2: Keyboard increments (after focus)
agent-browser focus @ref
agent-browser press ArrowRight    # +0.001
agent-browser press ArrowLeft     # -0.001
agent-browser press PageUp        # +0.1
agent-browser press PageDown      # -0.1
agent-browser press Home          # min value
agent-browser press End           # max value

# Method 3: Verify value
agent-browser get value @ref
```

### Key Element Selectors (Desktop)

| Element | Selector Pattern | Notes |
| --- | --- | --- |
| Color name | `textbox` (first) | e.g., "Primary" |
| Color mode | `button "OKLCH"` or `button "sRGB"` | Toggle dropdown |
| L/C/H display | `textbox [nth=1,2,3]` | Readonly |
| Lightness slider | `slider "Lightness"` | Range: 0-1 |
| Chroma slider | `slider "Chroma"` | Range: 0-0.4 |
| Hue slider | `slider "Hue"` | Range: 0-360 |
| Add Color | `button "Add Color"` |  |
| Remove Color | `button "Remove color"` | Disabled if only 1 color |
| Color options | `button "Change color options"` | Opens popover |
| Export All | `button "Export All"` | Opens modal |
| Export (single) | `button "Export"` | Per-color scale |
| Swatch | `button "50"`, `button "100"`, etc. | Copies to clipboard |
| Toggle Bottom Bar | `button "Toggle Bottom Bar"` | Mobile only: expands/collapses color editor drawer |

---

## Desktop Test Scenarios (1280x800)

### Setup

```bash
agent-browser set viewport 1280 800
agent-browser open http://localhost:3000/p/Primary-0.73_0.12745_321
agent-browser wait --load networkidle
agent-browser snapshot -i
```

### Test 1: Verify Initial Page Load

```bash
# Verify header elements
agent-browser is visible @e1   # LAB logo
agent-browser is visible @e2   # New Palette button
agent-browser is visible @e5   # Dark mode toggle
agent-browser is visible @e6   # Sign In button

# Verify sidebar
agent-browser is visible @e7   # Advanced Options
agent-browser is visible @e19  # Color name textbox
agent-browser is visible @e32  # Add Color button

# Verify palette area
agent-browser is visible @e35  # Export All
agent-browser is visible @e36  # Save button
agent-browser is visible @e53  # Swatch 50
```

### Test 2: Modify Color via Sliders

```bash
agent-browser snapshot -i

# Get initial Lightness value
agent-browser get value @e28   # Should be ~0.73

# Change Lightness to 0.5
agent-browser fill @e28 "0.5"
agent-browser get value @e28   # Verify: 0.5

# Change Chroma
agent-browser fill @e30 "0.2"

# Change Hue
agent-browser fill @e31 "180"

# Verify URL updated (palette state in URL)
agent-browser get url
```

### Test 3: Add and Remove Color

```bash
agent-browser snapshot -i

# Add a new color
agent-browser click @e32   # Add Color button
agent-browser wait 500
agent-browser snapshot -i

# Verify second color appears
# Look for new color selector and second scale

# Remove the second color (requires confirmation - 2 clicks within 2 seconds)
agent-browser snapshot -i
# Find the Remove button for second color (will have [nth=1])
# Note: Use shell sleep for quick succession; agent-browser wait may invalidate refs
agent-browser click @e35 && sleep 0.3 && agent-browser click @e35
```

### Test 4: Export Modal

```bash
agent-browser snapshot -i
agent-browser click @e35   # Export All button
agent-browser wait 300
agent-browser snapshot -i

# Verify modal elements
# - Format tabs: Tailwind 4, Tailwind 3, CSS, SCSS, SVG/Figma
# - Color format tabs: OKLCH, Hex, HSL, RGB
# - Select All/None buttons
# - Copy buttons

# Switch format
agent-browser click @e5    # CSS tab
agent-browser click @e9    # Hex code tab

# Copy
agent-browser click @e16   # Copy All

# Close modal
agent-browser click @e2    # Close button
```

### Test 5: Color Options Popover

```bash
agent-browser snapshot -i
agent-browser click @e21   # Change color options (gear icon)
agent-browser wait 300
agent-browser snapshot -i

# Verify popover elements
# - Lightness Range (dual-handle range slider)
# - Lightness Curve slider
# - Chroma Curve slider
# - Reset button (per slider + overall)

# Note: Popover element refs may become stale after interactions.
# Re-snapshot if fills fail. Popover may close unexpectedly.
# Modify lightness range (dual-handle slider - two thumb elements)
agent-browser fill @e69 "0.3"   # Left thumb (min lightness)
agent-browser fill @e70 "0.9"   # Right thumb (max lightness)

# Close popover
agent-browser press Escape
```

### Test 6: Palette Options Panel

```bash
agent-browser snapshot -i

# Adjust Steps slider
agent-browser fill @e43 "7"     # Change to 7 steps

# Toggle switches
agent-browser click @e46        # Apply saturation to all
agent-browser click @e48        # Light scale toggle

# Verify scale updates
agent-browser snapshot -i
```

### Test 7: Dark Mode Toggle

```bash
agent-browser click @e5         # Toggle dark mode
agent-browser wait 300
agent-browser screenshot /tmp/dark-mode.png

agent-browser click @e5         # Toggle back to light
```

### Test 8: Copy Swatch Color

```bash
agent-browser click @e58        # Click swatch 500
# Verify toast appears (color copied to clipboard)
```

---

## Mobile Test Scenarios (iPhone 14)

### Setup

```bash
agent-browser set device "iPhone 14"
agent-browser open http://localhost:3000/p/Primary-0.73_0.12745_321
agent-browser wait --load networkidle
agent-browser snapshot -i
```

### Test M1: Verify Mobile Layout

```bash
# Header should show: LAB, +New, Menu, dark mode, Sign In
agent-browser is visible @e1   # LAB logo
agent-browser is visible @e2   # New button (shortened)
agent-browser is visible @e3   # Menu button
agent-browser is visible @e4   # Dark mode
agent-browser is visible @e5   # Sign In

# Palette should be visible
agent-browser is visible @e9   # Save button
agent-browser is visible @e26  # First swatch
```

### Test M2: Menu Dropdown

```bash
agent-browser snapshot -i
agent-browser click @e3        # Menu button
agent-browser wait 200
agent-browser snapshot -i

# Verify menu items
# - My Palettes
# - About
# - Dismiss

agent-browser click @e69       # My Palettes (navigate)
# OR
agent-browser click @e71       # Dismiss
```

### Test M3: Bottom Drawer Color Controls

```bash
agent-browser snapshot -i

# Expand bottom drawer
agent-browser click @e37       # Toggle Bottom Bar
agent-browser wait 500
agent-browser snapshot -i

# Now color controls visible:
# - Advanced Options (collapsible)
# - Colors section with sliders

# Modify color
agent-browser fill @e61 "0.6"  # Lightness slider
agent-browser fill @e63 "0.15" # Chroma slider

# Collapse drawer
agent-browser click @e37       # Toggle Bottom Bar
```

### Test M4: Add Color on Mobile

```bash
agent-browser snapshot -i

# Step 1: Expand bottom drawer
agent-browser click @e37       # Toggle Bottom Bar
agent-browser wait 500
agent-browser snapshot -i

# Step 2: Click Add Color (now visible in expanded drawer)
agent-browser click @e65       # Add Color button
agent-browser wait 500
agent-browser snapshot -i

# Verify second color scale appears
```

---

## User Journey: Create and Export Palette

### Desktop Journey

```bash
# 1. Start fresh
agent-browser set viewport 1280 800
agent-browser open http://localhost:3000
agent-browser wait --load networkidle

# 2. Modify the default color
agent-browser snapshot -i
agent-browser fill @e19 "Brand"           # Rename color
agent-browser fill @e28 "0.6"             # Set Lightness
agent-browser fill @e30 "0.18"            # Set Chroma
agent-browser fill @e31 "220"             # Set Hue (blue)

# 3. Add a second color
agent-browser click @e32                  # Add Color
agent-browser wait 500
agent-browser snapshot -i

# 4. Configure second color
agent-browser fill @e32 "Accent"          # Name second color
agent-browser fill @e41 "0.65"            # Lightness
agent-browser fill @e43 "0.2"             # Chroma
agent-browser fill @e44 "30"              # Hue (orange)

# 5. Adjust global options
agent-browser fill @e43 "9"               # Steps to 9

# 6. Export
agent-browser click @e35                  # Export All
agent-browser wait 300
agent-browser click @e3                   # Tailwind 4 tab
agent-browser click @e8                   # OKLCH format
agent-browser click @e16                  # Copy All
agent-browser click @e2                   # Close

# 7. Verify URL is shareable
agent-browser get url
```

### Mobile Journey

```bash
# 1. Start fresh
agent-browser set viewport 375 812
agent-browser open http://localhost:3000
agent-browser wait --load networkidle

# 2. Open bottom drawer
agent-browser snapshot -i
agent-browser click @e39                  # Expand drawer
agent-browser wait 500

# 3. Modify color
agent-browser snapshot -i
agent-browser fill @e52 "Primary"         # Rename
agent-browser fill @e61 "0.55"            # Lightness
agent-browser fill @e64 "270"             # Hue

# 4. Export
agent-browser click @e8                   # Share/Export button
agent-browser wait 300
agent-browser snapshot -i
agent-browser click @e16                  # Copy
agent-browser press Escape
```

---

## Logged-In User Journey

Tests authenticated user flows: save palette, manage favorites, load/delete palettes.

### Prerequisites

Add credentials to `.env`:

```bash
PLAYWRIGHT_USERNAME=your-email@example.com
PLAYWRIGHT_PASSWORD=your-password
```

### Key Element Selectors (Auth)

| Element | Selector Pattern | Notes |
| --- | --- | --- |
| Sign In | `button "Sign In"` | Opens login modal |
| User Menu | `button "User Menu"` | Shows after login, aria-label="User Menu" |
| Email field | `textbox "Email*"` | In login modal |
| Password field | `textbox "Password*"` | In login modal |
| Login button | `button "Login"` | In login modal |
| User info | `menuitem "Name email"` | In user menu dropdown |
| Sign Out | `menuitem "Sign Out"` | In user menu dropdown |
| My Palettes | `link "My Palettes"` | Navigation link |
| Save | `button "Save"` | Opens save modal (when logged in) |
| Load Palette | `link "Load Palette (name)"` | On My Palettes page |
| Favorite | `button "Favorite Palette (name)"` | On My Palettes page |
| Unfavorite | `button "Unfavorite Palette (name)"` | Shows when favorited |
| Remove | `button "Remove Palette (name)"` | On My Palettes page |

### Test: Complete Palette Management Flow

```bash
# 1. Setup
agent-browser set viewport 1280 800
agent-browser open http://localhost:3000
agent-browser wait --load networkidle

# 2. Wait for auth to initialize (Sign In button becomes enabled)
sleep 1
agent-browser snapshot -i

# 3. Open login modal
agent-browser click @e6                    # Sign In button
sleep 0.5
agent-browser snapshot -i

# 4. Fill credentials and login
agent-browser fill @e8 "$PLAYWRIGHT_USERNAME"   # Email field
agent-browser fill @e9 "$PLAYWRIGHT_PASSWORD"   # Password field
agent-browser click @e11                        # Login button
sleep 1

# 5. Verify login succeeded
agent-browser snapshot -i
# Should see: button "User Menu" instead of "Sign In"

# 6. Verify user identity (optional)
agent-browser click @e6                    # User Menu
sleep 0.3
agent-browser snapshot -i
# Should see: menuitem "Name email@example.com"
agent-browser press Escape                 # Close menu

# 7. Add colors (starting with 1, add 3 more = 4 total)
agent-browser snapshot -i
agent-browser click @e21                   # Add Color
sleep 0.5
agent-browser snapshot -i
agent-browser click @e34                   # Add Color (ref changes after each add)
sleep 0.5
agent-browser snapshot -i
agent-browser click @e47                   # Add Color
sleep 0.5

# 8. Save palette
agent-browser snapshot -i
agent-browser click @e64                   # Save button (find via snapshot)
sleep 0.5
agent-browser snapshot -i

# 9. Enter palette name and save
PALETTE_NAME="[Palette] Test-$(date +%s)"
agent-browser fill @e3 "$PALETTE_NAME"     # Name* textbox
sleep 0.3
agent-browser click @e5                    # Save button in modal
sleep 1

# 10. Navigate to My Palettes
agent-browser snapshot -i
agent-browser click @e4                    # My Palettes link
sleep 1
agent-browser snapshot -i
# Verify: link "Load Palette ([Palette] Test-...)" appears

# 11. Favorite the palette
agent-browser click @e9                    # Favorite Palette button
sleep 0.5
agent-browser snapshot -i
# Verify: button changes to "Unfavorite Palette (...)"

# 12. Verify favorite persists after refresh
agent-browser reload
sleep 1
agent-browser snapshot -i
# Verify: still shows "Unfavorite Palette (...)"

# 13. Load the palette
agent-browser click @e7                    # Load Palette link
sleep 1
agent-browser get url
# Verify: URL contains 4 color segments

# 14. Verify 4 colors loaded
agent-browser snapshot -i
# Count: 4 "Export" buttons (one per color scale)

# 15. Navigate back to My Palettes
agent-browser click @e3                    # My Palettes link
sleep 1
agent-browser snapshot -i

# 16. Delete only the test palette
agent-browser click @e9                    # Remove Palette button for test palette
sleep 0.5
agent-browser snapshot -i
agent-browser click @e27                   # Confirm button
sleep 0.5

# 17. Verify deletion
agent-browser snapshot -i
# Test palette should no longer appear
# Other palettes should remain untouched
```

### Important Notes

- **Wait for auth**: Sign In button is initially disabled while auth initializes. Wait ~1s before interacting.
- **Ref instability**: After adding colors, element refs shift significantly. Always re-snapshot.
- **Palette names**: Use `[Palette]` prefix for easy identification in tests.
- **Confirmation dialogs**: Remove Palette shows Cancel/Confirm buttons - click Confirm to proceed.
- **Don't delete others**: When removing test palettes, verify you're clicking the correct Remove button by checking the palette name in the selector.

---

## Verification Checklist

After each test run, verify:

- [ ] URL reflects palette state
- [ ] Swatches update in real-time when sliders change
- [ ] Export produces valid output (check clipboard)
- [ ] No console errors (`agent-browser errors`)
- [ ] Toast notifications appear for copy actions

## Notes

- Element refs (`@e1`, `@e2`, etc.) are **dynamic** - always run `snapshot -i` before interacting
- Refs may become stale after interactions (especially with popovers) - re-snapshot if commands fail
- For quick successive clicks (e.g., confirmation dialogs), use shell `sleep 0.3` instead of `agent-browser wait`
- Modals/popovers require `wait 200-500` after open before snapshot
- Mobile bottom drawer must be expanded to access color controls
- Sliders accept decimal values directly via `fill`
