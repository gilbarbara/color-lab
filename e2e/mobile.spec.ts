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
  await page.getByTestId('BottomBar').evaluate(el => {
    el.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  });
}

async function toggleBottomBar() {
  await page.getByRole('button', { name: /toggle bottom bar/i }).click();
  await page.waitForTimeout(collapseDuration);
}

test('mobile', async () => {
  await test.step('displays main elements on initial load', async () => {
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New' })).toBeVisible();
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

    await toggleButton.click();

    await expect(html).not.toHaveClass(/dark/);
  });

  await test.step('persists theme preference across reload', async () => {
    await page.reload();
    const toggleButton = page.getByRole('button', { name: /toggle dark mode/i });

    await toggleButton.click();

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
    const removeButtons = page.getByRole('button', { name: 'Remove color' });

    await expect(removeButtons.first()).toBeDisabled();

    await addColorButton.click();

    // Wait for Collapse animation
    await page.waitForTimeout(collapseDuration);

    await expect(removeButtons).toHaveCount(2);
    await expect(removeButtons.first()).toBeEnabled();

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

    await expect(page.getByTestId('ScaleColorOptions')).not.toBeVisible();

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

    await expect(page).toHaveScreenshot('06-color-options-popover.png');
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

  await test.step('removes a color with confirmation', async () => {
    // Toast overlaps the bottom-bar toggle on mobile; dismiss it explicitly.
    const toast = page.getByRole('alertdialog', { name: 'toast' });

    if (await toast.isVisible()) {
      await toast.getByRole('button', { name: 'closeButton' }).click();
      await expect(toast).not.toBeVisible();
    }

    await toggleBottomBar();
    await scrollBottomBarToTop();

    const removeButtons = page.getByRole('button', { name: 'Remove color' });

    await expect(removeButtons).toHaveCount(2);

    // First click shows confirmation tooltip; second click within 2s confirms.
    // React Aria's usePress doesn't reliably fire from Playwright tap/click under
    // iOS emulation — dispatch native click events instead.
    const secondRemove = removeButtons.nth(1);

    await secondRemove.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');

    await expect(removeButtons).toHaveCount(1);

    // Wait for Collapse re-open animation on the remaining color
    await page.waitForTimeout(collapseDuration);

    await expect(page).toHaveScreenshot('14-single-color.png');
  });
});
