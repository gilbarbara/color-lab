import { devices, expect, type Page, test } from '@playwright/test';

import { collapseDuration } from './fixtures/constants';

let page: Page;

test.setTimeout(60_000);

test.use({
  ...devices['iPhone 12 Pro'],
  viewport: {
    width: 390,
    height: 844,
  },
});

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();

  await page.addInitScript(() => {
    const original = window.matchMedia;

    window.matchMedia = (q: string) => {
      if (q === '(color-gamut: p3)') {
        return { ...original.call(window, q), matches: true } as MediaQueryList;
      }

      return original.call(window, q);
    };
  });

  await page.goto('/p/Primary-73.0_0.12745_321');
});

test.afterAll(async () => {
  await page.close();
});

async function scrollBottomBarToTop() {
  // Adding or selecting a color triggers an async scroll-to-color (a rAF gated
  // by collapse animations, and a 500ms timeout when the bar opens). Under load
  // that scroll can fire after a one-shot reset and offset the screenshot. Pin
  // the panel to the top, re-zeroing on any late movement, until it holds for a
  // sustained window so the capture is deterministic.
  await page.getByTestId('GeneratorPanel').evaluate(
    el =>
      new Promise<void>(resolve => {
        const QUIET_FRAMES = 12; // ~200ms of no movement
        const MAX_FRAMES = 180; // ~3s safety cap
        let quiet = 0;
        let frames = 0;

        const tick = () => {
          frames += 1;

          if (el.scrollTop !== 0) {
            el.scrollTop = 0;
            quiet = 0;
          } else {
            quiet += 1;
          }

          if (quiet >= QUIET_FRAMES || frames >= MAX_FRAMES) {
            resolve();
          } else {
            requestAnimationFrame(tick);
          }
        };

        requestAnimationFrame(tick);
      }),
  );
}

async function toggleBottomBar() {
  await page.getByRole('button', { name: /toggle bottom bar/i }).click();
  await page.waitForTimeout(collapseDuration);
}

test('mobile', async () => {
  await test.step('displays main elements on initial load', async () => {
    await expect(page.getByRole('link', { name: /colormeup/i })).toBeVisible();
    await expect(page.getByTestId('NewPalette')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
    await expect(page.getByRole('button', { name: /toggle dark mode/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    await expect(page.getByRole('button', { name: /export all/i })).toBeVisible();

    await expect(page.getByRole('button', { name: '50', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '500', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '950', exact: true })).toBeVisible();

    await expect(page).toHaveScreenshot('01-initial.png');
  });

  await test.step('has correct page title', async () => {
    await expect(page).toHaveTitle(/colormeup/i);
  });

  await test.step('encodes palette state in URL', async () => {
    await expect(page).toHaveURL(/Primary-73_0\.127_321/);
  });

  await test.step('toggles dark mode', async () => {
    const toggleButton = page.getByRole('button', { name: /toggle dark mode/i });

    await toggleButton.click();

    const html = page.locator('html');

    await expect(html).toHaveClass(/dark/);

    await expect(page).toHaveScreenshot('02-dark-mode.png');
  });

  await test.step('persists theme preference across reload', async () => {
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  await test.step('opens menu dropdown', async () => {
    await page.getByRole('button', { name: /menu/i }).click();

    await expect(page.getByRole('menuitem', { name: /my palettes/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /about/i })).toBeVisible();

    await page.keyboard.press('Escape');
  });

  // === Bar OPEN: slider edits, Add Color, Advanced Options, Color Options ===

  await test.step('opens bottom bar', async () => {
    await toggleBottomBar();
  });

  await test.step('modifies color via lightness slider and updates URL', async () => {
    const lightnessSlider = page.getByRole('slider', { name: 'Lightness' });

    await expect(lightnessSlider).toHaveValue('0.73');

    await lightnessSlider.fill('0.5');
    await expect(lightnessSlider).toHaveValue('0.5');

    await expect(page).toHaveURL(/50/);
  });

  await test.step('modifies chroma slider', async () => {
    const chromaSlider = page.getByRole('slider', { name: 'Chroma' });

    await chromaSlider.fill('0.2');

    // Value may be clamped by gamut limits
    const value = await chromaSlider.inputValue();

    expect(parseFloat(value)).toBeGreaterThan(0);
  });

  await test.step('modifies hue slider', async () => {
    const hueSlider = page.getByRole('slider', { name: 'Hue' });

    await hueSlider.fill('180');

    await expect(page).toHaveURL(/180/);
  });

  await test.step('adds a new color', async () => {
    const addColorButton = page.getByRole('button', { name: 'Add Color' });
    const ColorItem = page.getByTestId('ColorItem');

    await expect(ColorItem.first()).toHaveAttribute('aria-current', 'true');

    await addColorButton.click();

    // Wait for Collapse animation
    await page.waitForTimeout(collapseDuration);

    await expect(ColorItem).toHaveCount(2);
    await expect(ColorItem.first()).toHaveAttribute('aria-current', 'false');
    await expect(ColorItem.nth(1)).toHaveAttribute('aria-current', 'true');

    // Adding a color auto-scrolls the bar to the new color; reset to top so
    // the screenshot starts from Advanced Options + Primary.
    await scrollBottomBarToTop();

    await expect(page).toHaveScreenshot('03-two-colors.png');
  });

  await test.step('opens Advanced Options', async () => {
    await page.getByRole('button', { name: 'Advanced Options' }).click();

    await expect(page.getByTestId('ScaleColorOptions')).toBeVisible();

    await page.waitForTimeout(collapseDuration);
    await scrollBottomBarToTop();

    await expect(page).toHaveScreenshot('04-advanced-options.png');
  });

  await test.step('change global Lightness Curve', async () => {
    const lightnessCurveSlider = page.locator('input[name="lightnessCurve"]');

    await expect(lightnessCurveSlider).toHaveValue('1.3');

    await lightnessCurveSlider.fill('1.2');

    await page.getByRole('button', { name: 'Advanced Options' }).click();

    await expect(page.getByTestId('ColorOptions')).toHaveAttribute('data-open', 'false');

    await page.waitForTimeout(collapseDuration);
    await scrollBottomBarToTop();

    await expect(page).toHaveScreenshot('05-post-advanced-color-options.png');
  });

  await test.step('opens color options popover', async () => {
    await page.getByRole('button', { name: 'Change color options' }).first().click();

    const popover = page.locator('[data-slot="content"]').last();
    const lightnessCurveSlider = popover.locator('input[name="lightnessCurve"]');

    await expect(lightnessCurveSlider).toHaveValue('1.2');
    await lightnessCurveSlider.fill('1.3');

    // Floating popover capture: its position can vary by a few px between runs
    // and isn't covered by the panel scroll-pin, so allow a wider diff like the
    // export drawer shot (13).
    await expect(page).toHaveScreenshot('06-color-options-popover.png', {
      maxDiffPixelRatio: 0.1,
    });
  });

  await test.step('closes color options popover with Escape', async () => {
    const popover = page.locator('[data-slot="content"]').last();

    await expect(popover.getByText(/options for/i)).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(popover).not.toBeVisible();

    await expect(page).toHaveScreenshot('07-color-options-popover-indicator.png');
  });

  // === Bar CLOSED: Palette Options, Color Info, Contrast Grid ===

  await test.step('closes bottom bar', async () => {
    await toggleBottomBar();
  });

  await test.step('opens palette options panel', async () => {
    await page.getByRole('button', { name: 'Palette Options' }).click();

    await page.waitForTimeout(collapseDuration);

    await expect(page).toHaveScreenshot('08-palette-options.png');
  });

  await test.step('toggles light/dark scale', async () => {
    const scaleSwitch = page.getByRole('switch', { name: /light scale/i });

    await expect(scaleSwitch).toBeVisible();

    await scaleSwitch.click();

    await expect(page.getByRole('switch', { name: /dark scale/i })).toBeVisible();

    await page.getByRole('switch', { name: /dark scale/i }).click();
    await expect(page.getByRole('switch', { name: /light scale/i })).toBeVisible();
  });

  await test.step('enable lock 500 and close the palette options', async () => {
    await page.getByRole('button', { name: /^select lock/i }).click();

    await page.getByRole('option', { name: '500', exact: true }).click();

    await expect(page.getByRole('button', { name: /^500 lock options/i })).toBeVisible();

    await page.getByRole('button', { name: 'Palette Options' }).click();

    await expect(page).toHaveScreenshot('09-post-palette-options.png');
  });

  await test.step('opens color info', async () => {
    await page.getByRole('button', { name: 'View color info' }).first().click();

    await expect(page.getByRole('columnheader', { name: 'APCA LC' })).toBeVisible();

    await expect(page).toHaveScreenshot('10-color-info.png');

    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('columnheader', { name: 'APCA LC' })).not.toBeVisible();
  });

  await test.step('opens contrast grid', async () => {
    await page.getByRole('button', { name: 'View Contrast Grid' }).first().click();

    await expect(page.getByRole('button', { name: 'WCAG 3 · APCA' })).toBeVisible();

    await expect(page).toHaveScreenshot('11-contrast-grid.png');

    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('button', { name: 'WCAG 3 · APCA' })).not.toBeVisible();
  });

  await test.step('select first color', async () => {
    await page.getByRole('button', { name: 'Select Primary' }).click();

    // Select Primary auto-opens the bottom bar; let the animation settle
    await page.waitForTimeout(collapseDuration);

    await expect(page).toHaveScreenshot('12-select-primary.png');
  });

  // === Bar CLOSED again: Export drawer, swatch toast ===

  await test.step('closes bottom bar before export', async () => {
    await toggleBottomBar();
  });

  await test.step('opens export drawer with format tabs', async () => {
    await page.getByRole('button', { name: 'Export All' }).click();

    await expect(page.getByRole('tab', { name: 'Tailwind 4' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'CSS', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'OKLCH' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /hex/i })).toBeVisible();

    await expect(page).toHaveScreenshot('13-export-drawer.png', { maxDiffPixelRatio: 0.1 });
  });

  await test.step('switches between format tabs', async () => {
    const cssTab = page.getByRole('tab', { name: 'CSS', exact: true });

    await cssTab.tap();
    await expect(cssTab).toHaveAttribute('aria-selected', 'true');

    const hexTab = page.getByRole('tab', { name: /hex/i });

    await hexTab.tap();
    await expect(hexTab).toHaveAttribute('aria-selected', 'true');
  });

  await test.step('closes export drawer', async () => {
    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('tab', { name: 'Tailwind 4' })).not.toBeVisible();
  });

  await test.step('shows toast when clicking swatch to copy', async () => {
    await page.getByRole('button', { name: '500', exact: true }).first().click();

    const toast = page.getByRole('alertdialog', { name: 'toast' });

    await expect(toast).toBeVisible({ timeout: 2000 });
  });

  // === Bar OPEN again: remove color ===

  await test.step('removes the second color with confirmation', async () => {
    // Toast overlaps the palette on mobile; dismiss it explicitly.
    const toast = page.getByRole('alertdialog', { name: 'toast' });

    if (await toast.isVisible()) {
      await toast.getByRole('button', { name: 'closeButton' }).click();
      await expect(toast).not.toBeVisible();
    }

    // Selecting the color activates it and auto-opens the bottom bar. An inactive
    // color swallows its first click to activate (handleCaptureInactive), so it
    // must be active for the remove button's first click to register.
    await page.getByRole('button', { name: 'Select Secondary' }).click();
    await page.waitForTimeout(collapseDuration);
    await scrollBottomBarToTop();

    const ColorItem = page.getByTestId('ColorItem').nth(1);

    await expect(ColorItem).toHaveAttribute('aria-current', 'true');

    const removeButton = ColorItem.getByRole('button', { name: 'Remove color' });

    // First click shows confirmation; second click within 2s confirms.
    await removeButton.click();
    await page.waitForTimeout(100);
    await removeButton.click();

    await expect(page.getByTestId('ColorItem')).toHaveCount(1);

    // Wait for Collapse re-open animation on the remaining color
    await page.waitForTimeout(collapseDuration);

    await expect(page).toHaveScreenshot('14-single-color.png');
  });
});
