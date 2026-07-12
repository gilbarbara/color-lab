import { devices, expect, type Page, test } from '@playwright/test';

import { collapseDuration, seedPalette } from './__setup__/constants';
import { createPage } from './__setup__/page';
import {
  closeToast,
  createScreenshotNamer,
  expectToast,
  hasParams,
  scrollPanelToTop,
} from './__setup__/utils';

const screenshotName = createScreenshotNamer();

let page: Page;

test.use({
  ...devices['Desktop Chrome'],
  colorScheme: 'dark',
  permissions: ['clipboard-read', 'clipboard-write'],
  viewport: {
    width: 1440,
    height: 810,
  },
});

test.beforeAll(async ({ browser }) => {
  page = await createPage(browser, { url: seedPalette });
});

test.afterAll(async () => {
  await page.close();
});

test('palette', async () => {
  await test.step('resolves dark mode from the system preference', async () => {
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  await test.step('close sidebar and rename palette', async () => {
    await page.getByRole('button', { name: 'Toggle Sidebar' }).click();

    await expect(page.locator('html')).toHaveAttribute('data-sidebar', 'closed');

    await page.evaluate(() => window.scrollTo(0, 0));

    const nameInput = page.locator('input[name="palette-name"]');

    await nameInput.clear();
    await nameInput.fill('Design System');
    await nameInput.press('Enter');

    await expect(nameInput).toHaveValue('Design System');
    await expect(page).toHaveURL(hasParams({ name: 'Design System' }));

    await expect(page).toHaveScreenshot(screenshotName('rename-palette.png'));
  });

  await test.step('switch views', async () => {
    await page.getByRole('button', { name: 'Display Options' }).click();

    await expect(page).toHaveScreenshot(screenshotName('display-menu.png'));

    await page.getByRole('radio', { name: 'Grid' }).click();

    await expect(page).toHaveScreenshot(screenshotName('grid-view.png'));

    // Switch to Preview
    await page.getByRole('button', { name: 'Display Options' }).click();
    await page.getByRole('radio', { name: 'Preview' }).click();

    await expect(page).toHaveScreenshot(screenshotName('preview-view.png'));

    // Switch to list
    await page.getByRole('button', { name: 'Display Options' }).click();
    await page.getByRole('radio', { name: 'List' }).click();

    await expect(page).toHaveScreenshot(screenshotName('list-view.png'));
  });

  await test.step('opens color charts', async () => {
    await page.getByRole('button', { name: 'View Charts' }).first().click();
    await page.waitForTimeout(collapseDuration);

    await expect(page.getByRole('tab', { name: 'Chroma' })).toBeVisible();

    await expect(page).toHaveScreenshot(screenshotName('chroma-chart.png'));

    await page.getByRole('tab', { name: 'Lightness' }).click();

    await expect(page).toHaveScreenshot(screenshotName('lightness-chart.png'));

    await page.getByRole('tab', { name: 'Hue' }).click();

    await expect(page).toHaveScreenshot(screenshotName('hue-chart.png'));

    await page.getByRole('button', { name: 'View Charts' }).first().click();
  });

  await test.step('opens color info', async () => {
    await page.getByRole('button', { name: 'View color info' }).first().click();

    await expect(page.getByRole('columnheader', { name: 'APCA LC' })).toBeVisible();

    await expect(page).toHaveScreenshot(screenshotName('color-info.png'));

    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('columnheader', { name: 'APCA LC' })).not.toBeVisible();
  });

  await test.step('opens contrast grid', async () => {
    await page.getByRole('button', { name: 'View Contrast Grid' }).first().click();

    await expect(page.getByRole('button', { name: 'WCAG 3 · APCA' })).toBeVisible();

    await expect(page).toHaveScreenshot(screenshotName('contrast-grid.png'));

    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('button', { name: 'WCAG 3 · APCA' })).not.toBeVisible();
  });

  await test.step('select first color', async () => {
    await page.getByRole('button', { name: 'Select Primary' }).click();

    await page.waitForTimeout(collapseDuration);
    await scrollPanelToTop(page);

    await expect(page).toHaveScreenshot(screenshotName('select-primary.png'));
  });

  await test.step('shows toast when clicking swatch to copy', async () => {
    await page.getByRole('button', { name: '500', exact: true }).first().click();

    await expectToast(page);

    await expect(page).toHaveScreenshot(screenshotName('copy-swatch.png'));

    await closeToast(page);
  });

  await test.step('click Share button', async () => {
    await page.getByRole('button', { name: 'Share' }).click();

    await expectToast(page);

    await expect(page).toHaveScreenshot(screenshotName('share-palette-url.png'));

    await closeToast(page);
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

    await expect(page).toHaveScreenshot(screenshotName('export-palette.png'));
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
});
