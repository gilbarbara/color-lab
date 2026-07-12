import { devices, expect, type Page, test } from '@playwright/test';

import { collapseDuration, seedSingle } from './__setup__/constants';
import { createPage } from './__setup__/page';
import {
  createScreenshotNamer,
  hasColor,
  hasParams,
  lacksColor,
  scrollPanelToTop,
} from './__setup__/utils';

const getScreenshotName = createScreenshotNamer();

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
  page = await createPage(browser, { url: seedSingle });
});

test.afterAll(async () => {
  await page.close();
});

async function toggleBottomBar() {
  await page.getByRole('button', { name: /toggle bottom bar/i }).click();
  await page.waitForTimeout(collapseDuration);
}

/**
 * HeroUI sliders must be driven by keyboard (focus + Arrow/Page/Home/End), not fill(): fill()
 * fires react-aria's onChange but never onChangeEnd, so the interaction never releases and
 * useUrlSync stays paused, suppressing later URL writes.
 */
test('mobile', async () => {
  await test.step('displays main elements on initial load', async () => {
    await expect(page.getByRole('link', { name: /colormeup/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
    await expect(page.getByRole('button', { name: /toggle dark mode/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    await expect(page.getByRole('button', { name: /export all/i })).toBeVisible();

    await expect(page.getByRole('button', { name: '50', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '500', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '950', exact: true })).toBeVisible();

    await expect(page.locator('html')).toHaveAttribute('data-gamut', 'p3');
    await expect(page.locator('html')).toHaveAttribute('data-p3-supported', 'true');

    await expect(page).toHaveScreenshot(getScreenshotName('initial.png'));
  });

  await test.step('has correct page title', async () => {
    await expect(page).toHaveTitle(/color palette generator/i);
  });

  await test.step('encodes palette state in URL', async () => {
    await expect(page).toHaveURL(hasColor('Primary', '73_0.23_321'));
  });

  await test.step('toggles dark mode', async () => {
    const toggleButton = page.getByRole('button', { name: /toggle dark mode/i });

    await toggleButton.click();

    const html = page.locator('html');

    await expect(html).toHaveClass(/dark/);

    await expect(page).toHaveScreenshot(getScreenshotName('dark-mode.png'));
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

  // Export scale lives in the palette area; capture it while the bottom bar is
  // still closed (an open bar overlays the palette and would intercept the click).
  await test.step('opens export scale drawer', async () => {
    await page.getByLabel('Export scale').click();

    await expect(page.getByRole('tab', { name: 'Tailwind 4' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'OKLCH' })).toBeVisible();

    await expect(page).toHaveScreenshot(getScreenshotName('export-scale.png'), {
      maxDiffPixelRatio: 0.1,
    });

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('tab', { name: 'Tailwind 4' })).not.toBeVisible();
  });

  // === Bar OPEN: slider edits, Add Color, Advanced Options, Color Options ===

  await test.step('opens bottom bar', async () => {
    await toggleBottomBar();
  });

  await test.step('modifies color via lightness slider and updates URL', async () => {
    const lightnessSlider = page.getByRole('slider', { exact: true, name: 'Lightness' });

    await expect(lightnessSlider).toHaveValue('0.73');

    await lightnessSlider.fill('0.6');
    await expect(lightnessSlider).toHaveValue('0.6');

    await expect(page).toHaveURL(hasColor('Primary', '60'));
  });

  await test.step('modifies chroma slider', async () => {
    const chromaSlider = page.getByRole('slider', { exact: true, name: 'Chroma' });

    await chromaSlider.fill('0.21');

    await expect(page).toHaveURL(hasColor('Primary', '60_0.21'));
  });

  await test.step('modifies hue slider', async () => {
    const hueSlider = page.getByRole('slider', { exact: true, name: 'Hue' });
    const chromaSlider = page.getByRole('slider', { exact: true, name: 'Chroma' });

    await hueSlider.fill('150');
    await expect(page).toHaveURL(/150/);
    await page.waitForTimeout(100);

    await chromaSlider.fill('0.21');
    await expect(page).toHaveURL(hasColor('Primary', '60_0.21_150'));
  });

  await test.step('adds a new color', async () => {
    const addColorButton = page.getByRole('button', { name: 'Add Color' });
    const ColorItem = page.getByTestId('ColorItem');

    await expect(ColorItem.first()).toHaveAttribute('aria-current', 'true');

    await addColorButton.click();

    await page.waitForTimeout(collapseDuration);

    await expect(ColorItem).toHaveCount(2);
    await expect(ColorItem.first()).toHaveAttribute('aria-current', 'false');
    await expect(ColorItem.nth(1)).toHaveAttribute('aria-current', 'true');

    // Adding a color auto-scrolls the bar to the new color; reset to top so
    // the screenshot starts from Advanced Options + Primary.
    await scrollPanelToTop(page);

    await expect(page).toHaveScreenshot(getScreenshotName('two-colors.png'));
  });

  await test.step('opens Advanced Options', async () => {
    await page.getByRole('button', { name: 'Advanced Options' }).click();

    await expect(page.getByTestId('ScaleColorOptions')).toBeVisible();

    await page.waitForTimeout(collapseDuration);
    await scrollPanelToTop(page);

    await expect(page).toHaveScreenshot(getScreenshotName('advanced-options.png'));
  });

  await test.step('change global Lightness Curve', async () => {
    const lightnessCurveSlider = page.locator('input[name="lightnessCurve"]');

    await expect(lightnessCurveSlider).toHaveValue('1.3');

    await lightnessCurveSlider.focus();
    await page.keyboard.press('PageDown');
    await expect(lightnessCurveSlider).toHaveValue('1.2');

    await page.getByRole('button', { name: 'Advanced Options' }).click();

    await expect(page.getByTestId('ColorOptions')).toHaveAttribute('data-open', 'false');

    await page.waitForTimeout(collapseDuration);
    await scrollPanelToTop(page);

    await expect(page).toHaveScreenshot(getScreenshotName('post-advanced-color-options.png'));
  });

  await test.step('opens color options', async () => {
    const colorItem = page.getByTestId('ColorItem').nth(1);

    await colorItem.getByRole('button', { name: 'Change color options' }).click();
    await page.waitForTimeout(collapseDuration);

    const colorItemOffset = await colorItem.evaluate(el => (el as HTMLElement).offsetTop);

    await page.getByTestId('GeneratorPanel').evaluate((el, scrollTop) => {
      el.scrollTo({ top: scrollTop, behavior: 'instant' });
    }, colorItemOffset);

    const lightnessCurveSlider = colorItem.locator('input[name="lightnessCurve"]');

    await expect(lightnessCurveSlider).toHaveValue('1.2');

    await lightnessCurveSlider.focus();
    await page.keyboard.press('PageUp');
    await expect(lightnessCurveSlider).toHaveValue('1.3');

    const hueShiftSlider = colorItem.locator('input[name="hueShift"]');

    await expect(hueShiftSlider).toHaveValue('0');

    await hueShiftSlider.focus();
    await page.keyboard.press('PageUp');
    await expect(hueShiftSlider).toHaveValue('10');
    await page.keyboard.press('PageUp');
    await expect(hueShiftSlider).toHaveValue('20');

    // Floating popover position varies a few px between runs, so allow a wider diff.
    await expect(page).toHaveScreenshot(getScreenshotName('color-options.png'), {
      maxDiffPixelRatio: 0.1,
    });
  });

  await test.step('closes color options', async () => {
    const colorItem = page.getByTestId('ColorItem').nth(1);

    await colorItem.getByRole('button', { name: 'Change color options' }).click();

    const lightnessCurveSlider = colorItem.locator('input[name="lightnessCurve"]');

    await expect(lightnessCurveSlider).not.toBeVisible();

    await expect(page).toHaveScreenshot(getScreenshotName('post-color-options.png'));
  });

  await test.step('closes bottom bar', async () => {
    await toggleBottomBar();
  });

  // === Bar CLOSED: Palette Options, Color Info, Contrast Grid ===

  await test.step('renames the palette', async () => {
    const nameInput = page.locator('input[name="palette-name"]');

    await nameInput.clear();
    await nameInput.fill('My Palette');
    await nameInput.press('Enter');

    await expect(nameInput).toHaveValue('My Palette');
    await expect(page).toHaveURL(hasParams({ name: 'My Palette' }));

    await expect(page).toHaveScreenshot(getScreenshotName('rename-palette.png'));
  });

  await test.step('opens palette options panel', async () => {
    await page.getByRole('button', { name: 'Palette Options' }).click();

    await expect(page).toHaveScreenshot(getScreenshotName('palette-options.png'));
  });

  await test.step('switches the scale mode', async () => {
    const darkRadio = page.getByRole('radio', { name: 'Dark' });

    await expect(darkRadio).toBeVisible();

    await darkRadio.click();
    await expect(darkRadio).toBeChecked();

    await expect(page).toHaveScreenshot(getScreenshotName('dark-scale.png'));

    await page.getByRole('radio', { name: 'Light' }).click();
    await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
  });

  await test.step('enable lock 500 and close the palette options', async () => {
    await page.getByRole('button', { name: /^select lock/i }).click();

    await page.getByRole('option', { name: '500', exact: true }).click();

    await expect(page.getByRole('button', { name: /^500 lock/i })).toBeVisible();

    await page.getByRole('button', { name: 'Palette Options' }).click();

    await expect(page).toHaveScreenshot(getScreenshotName('post-palette-options.png'));
  });

  await test.step('opens color charts', async () => {
    await page.getByRole('button', { name: 'View Charts' }).first().click();
    await page.waitForTimeout(collapseDuration);

    await page.getByRole('tab', { name: 'Chroma' }).click();

    await expect(page).toHaveScreenshot(getScreenshotName('chroma-chart.png'));

    await page.getByRole('tab', { name: 'Lightness' }).click();

    await expect(page).toHaveScreenshot(getScreenshotName('lightness-chart.png'));

    await page.getByRole('tab', { name: 'Hue' }).click();

    await expect(page).toHaveScreenshot(getScreenshotName('hue-chart.png'));
  });

  await test.step('opens color info', async () => {
    await page.getByRole('button', { name: 'View color info' }).first().click();

    await expect(page.getByRole('columnheader', { name: 'APCA LC' })).toBeVisible();

    await expect(page).toHaveScreenshot(getScreenshotName('color-info.png'));

    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('columnheader', { name: 'APCA LC' })).not.toBeVisible();
  });

  await test.step('opens contrast grid', async () => {
    await page.getByRole('button', { name: 'View Contrast Grid' }).first().click();

    await expect(page.getByRole('button', { name: 'WCAG 3 · APCA' })).toBeVisible();

    await expect(page).toHaveScreenshot(getScreenshotName('contrast-grid.png'));

    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('button', { name: 'WCAG 3 · APCA' })).not.toBeVisible();
  });

  await test.step('select first color', async () => {
    await page.getByRole('button', { name: 'Select Primary' }).click();

    // Select Primary auto-opens the bottom bar; let the animation settle
    await page.waitForTimeout(collapseDuration);

    await expect(page).toHaveScreenshot(getScreenshotName('select-primary.png'));
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

    await expect(page).toHaveScreenshot(getScreenshotName('export-drawer.png'), {
      maxDiffPixelRatio: 0.1,
    });
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

    // An inactive color swallows its first click to activate, so select it first or the
    // remove button's first click is lost. Selecting also auto-opens the bottom bar.
    await page.getByRole('button', { name: 'Select Secondary' }).click();
    await page.waitForTimeout(collapseDuration);
    await scrollPanelToTop(page);

    const ColorItem = page.getByTestId('ColorItem').nth(1);

    await expect(ColorItem).toHaveAttribute('aria-current', 'true');

    const removeButton = ColorItem.getByRole('button', { name: 'Remove color' });

    // First click shows confirmation; second click within 2s confirms.
    await removeButton.click();
    await page.waitForTimeout(100);
    await removeButton.click();

    await expect(page.getByTestId('ColorItem')).toHaveCount(1);

    await page.waitForTimeout(collapseDuration);

    // The Secondary segment is dropped, but the palette identity and global options are kept.
    await expect(page).toHaveURL(lacksColor('Secondary'));
    await expect(page).toHaveURL(hasColor('Primary'));
    await expect(page).toHaveURL(hasParams({ k: 500, name: 'My Palette' }));

    await expect(page).toHaveScreenshot(getScreenshotName('single-color.png'));
  });
});
