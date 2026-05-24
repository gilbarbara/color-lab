import { devices, expect, type Page, test } from '@playwright/test';

import { collapseDuration } from './fixtures/constants';

let page: Page;

test.use({
  ...devices['Desktop Chrome'],
  viewport: {
    width: 1440,
    height: 810,
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

test('desktop', async () => {
  await test.step('displays main elements on initial load', async () => {
    // Header elements
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /new palette/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /toggle dark mode/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Palette area
    await expect(page.getByRole('button', { name: /export all/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();

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

    // Wait for Collapse to finish animating
    await page.waitForTimeout(collapseDuration);

    await expect(removeButtons).toHaveCount(2);
    await expect(removeButtons.first()).toBeEnabled();

    await expect(page).toHaveScreenshot('03-two-colors.png');
  });

  await test.step('opens Advanced Options', async () => {
    await page.getByRole('button', { name: 'Advanced Options' }).click();

    await expect(page.getByTestId('ScaleColorOptions')).toBeVisible();

    // Wait for Collapse to finish animating
    await page.waitForTimeout(collapseDuration);

    await page.getByTestId('Sidebar').evaluate(el => {
      el.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    });

    await expect(page).toHaveScreenshot('04-advanced-options.png');
  });

  await test.step('change global Lightness Curve', async () => {
    const lightnessCurveSlider = page.locator('input[name="lightnessCurve"]');

    await expect(lightnessCurveSlider).toHaveValue('1.3');

    await lightnessCurveSlider.fill('1.2');

    await page.getByRole('button', { name: 'Advanced Options' }).click();

    await expect(page.getByTestId('ScaleColorOptions')).not.toBeVisible();

    await expect(page).toHaveScreenshot('05-post-advanced-color-options.png');
  });

  await test.step('opens color options popover', async () => {
    await page.getByRole('button', { name: 'Change color options' }).click();

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

  await test.step('opens palette options panel', async () => {
    await page.getByRole('button', { name: 'Palette Options' }).click();

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
    // Open the Lock select dropdown inside the Palette Options popover
    await page.getByRole('button', { name: /^select lock/i }).click();

    await page.getByRole('option', { name: '500', exact: true }).click();

    // Selection updates the dropdown label to "500 Lock options"
    await expect(page.getByRole('button', { name: /^500 lock options/i })).toBeVisible();

    // Close the panel
    await page.getByRole('button', { name: 'Palette Options' }).click();

    await expect(page).toHaveScreenshot('09-post-palette-options.png');
  });

  await test.step('opens color info', async () => {
    await page.getByRole('button', { name: 'View color info' }).first().click();

    // Wait for modal content
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

    // Wait for Collapse animation to settle
    await page.waitForTimeout(collapseDuration);

    await expect(page).toHaveScreenshot('12-select-primary.png');
  });

  await test.step('opens export drawer with format tabs', async () => {
    await page.getByRole('button', { name: 'Export All' }).click();

    await expect(page.getByRole('tab', { name: 'Tailwind 4' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Tailwind 3' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'CSS', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'SCSS', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: /svg/i })).toBeVisible();

    await expect(page.getByRole('tab', { name: 'OKLCH' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /hex/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'HSL' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'RGB' })).toBeVisible();

    await expect(page).toHaveScreenshot('13-export-drawer.png');
  });

  await test.step('switches between format tabs', async () => {
    await page.getByRole('tab', { name: 'CSS', exact: true }).click();
    await expect(page.getByRole('tab', { name: 'CSS', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await page.getByRole('tab', { name: /hex/i }).click();
    await expect(page.getByRole('tab', { name: /hex/i })).toHaveAttribute('aria-selected', 'true');
  });

  await test.step('closes export drawer', async () => {
    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('tab', { name: 'Tailwind 4' })).not.toBeVisible();
  });

  await test.step('shows toast when clicking swatch to copy', async () => {
    await page.getByRole('button', { name: '500', exact: true }).first().click();

    // Toast may say "copied" or "failed to copy" in headless
    const toast = page.locator('[data-slot="toast"]').or(page.getByRole('alert'));

    await expect(toast.first()).toBeVisible({ timeout: 2000 });
  });

  await test.step('removes a color with confirmation', async () => {
    const removeButtons = page.getByRole('button', { name: 'Remove color' });

    await expect(removeButtons).toHaveCount(2);

    // First click shows confirmation; second click within 2s confirms
    const secondRemove = removeButtons.nth(1);

    await secondRemove.click();
    await secondRemove.click();

    await expect(removeButtons).toHaveCount(1);

    // Wait for Collapse re-open animation on the remaining color (~400ms).
    // Without this, the next step clicks while the trigger button is clipped
    // by the still-animating overflow:hidden container, missing the popover.
    await page.waitForTimeout(collapseDuration);

    await expect(page).toHaveScreenshot('14-single-color.png');
  });
});
