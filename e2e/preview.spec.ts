import { devices, expect, type Page, test } from '@playwright/test';

import { collapseDuration, scrollOffset, seedPalette } from './__setup__/constants';
import { createPage } from './__setup__/page';
import { createScreenshotNamer } from './__setup__/utils';

const screenshotName = createScreenshotNamer();

let page: Page;

// Seeded dark via the system preference, which is what makes the preview's own theme toggle
// worth testing: it cycles the preview between auto/light/dark independently of the app theme.
test.use({
  ...devices['Desktop Chrome'],
  colorScheme: 'dark',
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

test('preview', async () => {
  await test.step('resolves dark mode from the system preference', async () => {
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  await test.step('scrolls the live preview into view', async () => {
    await page.getByTestId('Preview').evaluate((el, offset) => {
      const top = window.scrollY + el.getBoundingClientRect().top - offset;

      window.scrollTo({ top, behavior: 'instant' });
    }, scrollOffset);

    await expect(page).toHaveScreenshot(screenshotName('preview-components.png'));
  });

  await test.step('cycles the preview theme', async () => {
    // The accessible name carries the current mode — it's a 3-state cycle, so the name is the
    // only thing that tells you (and a screen reader) which theme is active.
    const themeToggle = page.getByRole('button', { name: /^Preview theme:/ });

    await expect(themeToggle).toHaveAccessibleName('Preview theme: Auto');

    await themeToggle.click();

    await expect(themeToggle).toHaveAccessibleName('Preview theme: Light');
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot(screenshotName('preview-light-theme.png'));

    // cycle back to auto (light -> dark -> auto)
    await themeToggle.click();
    await expect(themeToggle).toHaveAccessibleName('Preview theme: Dark');

    await themeToggle.click();
    await expect(themeToggle).toHaveAccessibleName('Preview theme: Auto');
  });

  await test.step('switches to the Typography tab', async () => {
    await page.getByRole('tab', { name: 'Typography' }).click();
    await expect(page.getByRole('tab', { name: 'Typography' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await expect(page).toHaveScreenshot(screenshotName('preview-typography.png'), {
      maxDiffPixelRatio: 0.1,
    });
  });

  await test.step('switches back to the Components tab', async () => {
    await page.getByRole('tab', { name: 'Components' }).click();

    await expect(page.getByTestId('Preview-Controls')).toBeVisible();
    await expect(page.getByTestId('Preview-Typography')).toHaveCount(0);
  });

  await test.step('uses Secondary as the preview primary', async () => {
    await page.getByRole('radio', { name: 'Secondary' }).click();
    await expect(page.getByRole('radio', { name: 'Secondary' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await expect(page).toHaveScreenshot(screenshotName('preview-secondary.png'));
  });

  await test.step('collapses and expands the live preview', async () => {
    await page.getByRole('button', { name: 'Collapse Live preview' }).click();
    await page.waitForTimeout(collapseDuration);
    await expect(page.locator('html')).toHaveAttribute('data-preview', 'closed');

    await page.getByRole('button', { name: 'Expand Live preview' }).click();
    await page.waitForTimeout(collapseDuration);
    await expect(page.locator('html')).toHaveAttribute('data-preview', 'open');
  });
});
