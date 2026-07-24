import { devices, expect, type Page, test } from '@playwright/test';

import { seedSingle } from './__setup__/constants';
import { createPage } from './__setup__/page';
import { createScreenshotNamer, scrollPanelToTop, scrollToTop } from './__setup__/utils';

const screenshotName = createScreenshotNamer();

let page: Page;

test.use({
  ...devices['Desktop Chrome'],
  colorScheme: 'dark',
  viewport: {
    width: 1440,
    height: 810,
  },
});

test.beforeAll(async ({ browser }) => {
  page = await createPage(browser, { url: seedSingle });
});

test.afterAll(async () => {
  await page.close();
});

/**
 * Reset to the single-color seed, pick a spacing, and add 5 colors (6 total). Each new color
 * rotates the previous hue by the spacing's angle, so the swatches fan out progressively wider
 * from Tight to Golden (137.5°).
 *
 * Each case rebuilds from one color, which is why this doesn't ride along with `basic`'s
 * linear add/remove chain.
 */
async function addSpacedColors(spacing: string, screenshot: string) {
  await page.goto(seedSingle);
  await page.waitForLoadState('networkidle');

  await expect(page.locator('html')).toHaveAttribute('data-sidebar', 'open');

  const ColorItem = page.getByTestId('ColorItem');

  await expect(ColorItem).toHaveCount(1);

  // The trigger's accessible name is compound and changes with the selection, so target its id.
  await page.locator('#color-spacing-value').click();
  await page.getByRole('menuitemradio', { name: spacing }).click();
  await expect(page.locator('#color-spacing-value')).toContainText(spacing);

  const addColor = page.getByRole('button', { name: 'Add Color' });

  for (let count = 2; count <= 6; count++) {
    await addColor.click();
    await expect(ColorItem).toHaveCount(count);
  }

  await scrollPanelToTop(page);
  await scrollToTop(page);

  await expect(page).toHaveScreenshot(screenshotName(screenshot));
}

test('spacing', async () => {
  await test.step('resolves dark mode from the system preference', async () => {
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  await test.step('add tight spaced colors', () =>
    addSpacedColors('Tight', 'tight-spaced-colors.png'));

  await test.step('add even spaced colors', () =>
    addSpacedColors('Even', 'even-spaced-colors.png'));

  await test.step('add wide spaced colors', () =>
    addSpacedColors('Wide', 'wide-spaced-colors.png'));

  await test.step('add golden spaced colors', () =>
    addSpacedColors('Golden', 'golden-spaced-colors.png'));
});
