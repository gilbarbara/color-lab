import { devices, expect, type Page, test } from '@playwright/test';

import { collapseDuration, seedSingle } from './__setup__/constants';
import { createPage } from './__setup__/page';
import {
  createScreenshotNamer,
  dragReorderRow,
  hasColor,
  lacksColor,
  removeColor,
  scrollPanelToTop,
  scrollToTop,
} from './__setup__/utils';

const screenshotName = createScreenshotNamer();

let page: Page;

const sessionStack = [
  '/p/Primary-73_0.23_321',
  '/p/Primary-60_0.276_321',
  '/p/Primary-60_0.21_321',
  '/p/Primary-60_0.157_150',
  '/p/Primary-60_0.21_150',
  '/p/Primary-60_0.21_150/Secondary-60_0.139_227',
  '/p/Primary-60_0.21_150/Secondary-60_0.139_227/Tertiary-60_0.266_304',
  '/p/Tertiary-60_0.266_304/Primary-60_0.21_150/Secondary-60_0.139_227',
  '/p/Tertiary-60_0.266_304/Secondary-60_0.139_227/Primary-60_0.21_150',
  '/p/Secondary-60_0.139_227/Primary-60_0.21_150',
  '/p/Primary-60_0.21_150',
];

// The only spec that boots on the default (light) color scheme: it owns the dark-mode toggle
// and has to start light to prove the toggle and its persistence. Every other spec seeds
// `colorScheme: 'dark'` and inherits dark via next-themes' `system` default.
test.use({
  ...devices['Desktop Chrome'],
  viewport: {
    width: 1440,
    height: 810,
  },
});

test.beforeAll(async ({ browser }) => {
  page = await createPage(browser, { historyStack: true, url: seedSingle });
});

test.afterAll(async () => {
  await page.close();
});

test('basic', async () => {
  await test.step('displays main elements on initial load', async () => {
    await expect(page.getByRole('link', { name: /colormeup/i })).toBeVisible();

    // check for the default data attributes in the HTML
    await expect(page.locator('html')).toHaveAttribute('data-sidebar', 'open');
    await expect(page.locator('html')).toHaveAttribute('data-preview', 'open');
    await expect(page.locator('html')).toHaveAttribute('data-palette-options', 'closed');
    await expect(page.locator('html')).toHaveAttribute('data-color-options', 'closed');
    await expect(page.locator('html')).toHaveAttribute('data-gamut', 'p3');
    await expect(page.locator('html')).toHaveAttribute('data-p3-supported', 'true');

    await expect(page).toHaveScreenshot(screenshotName('initial.png'));
  });

  await test.step('has correct page title', async () => {
    await expect(page).toHaveTitle(/color palette generator/i);
  });

  await test.step('encodes palette state in URL', async () => {
    await expect(page).toHaveURL(hasColor('Primary', '73_0.23_321'));
  });

  await test.step('toggles dark mode', async () => {
    await page.getByRole('button', { name: /toggle dark mode/i }).click();

    await expect(page.locator('html')).toHaveClass(/dark/);

    await expect(page).toHaveScreenshot(screenshotName('dark-mode.png'));
  });

  await test.step('persists theme preference across reload', async () => {
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  await test.step('open color mode menu', async () => {
    await page.getByRole('button', { name: /color mode/i }).click();
    await expect(page).toHaveScreenshot(screenshotName('mode-menu.png'));
  });

  await test.step('switch color mode to HSL', async () => {
    await page.getByRole('menuitemradio', { name: 'HSL' }).click();

    await expect(page).toHaveScreenshot(screenshotName('mode-hsl.png'));
  });

  await test.step('switch color mode to RGB', async () => {
    await page.getByRole('button', { name: /color mode/i }).click();
    await page.getByRole('menuitemradio', { name: 'RGB' }).click();

    await expect(page).toHaveScreenshot(screenshotName('mode-rgb.png'));
  });

  await test.step('switch color mode back to OKLCH', async () => {
    await page.getByRole('button', { name: /color mode/i }).click();
    await page.getByRole('menuitemradio', { name: 'OKLCH' }).click();
    await expect(page.getByRole('menu')).toBeHidden();
  });

  await test.step('modifies color via lightness slider and updates URL', async () => {
    const lightnessSlider = page.getByRole('slider', { exact: true, name: 'Lightness' });

    await expect(lightnessSlider).toHaveValue('0.73');

    await lightnessSlider.fill('0.6');
    await expect(lightnessSlider).toHaveValue('0.6');

    await expect(page).toHaveURL(hasColor('Primary', '60'));
    await expect(page).toHaveScreenshot(screenshotName('update-primary-lightness.png'));
  });

  await test.step('modifies chroma slider and updates URL', async () => {
    await page.getByRole('slider', { exact: true, name: 'Chroma' }).fill('0.21');

    await expect(page).toHaveURL(hasColor('Primary', '60_0.21'));

    await expect(page).toHaveScreenshot(screenshotName('update-primary-chroma.png'));
  });

  await test.step('modifies hue slider (and recalibrate chroma)', async () => {
    const hueSlider = page.getByRole('slider', { exact: true, name: 'Hue' });
    const chromaSlider = page.getByRole('slider', { exact: true, name: 'Chroma' });

    await hueSlider.fill('150');
    await expect(page).toHaveURL(/150/);

    await chromaSlider.fill('0.21');
    await expect(page).toHaveURL(hasColor('Primary', '60_0.21_150'));

    await expect(page).toHaveScreenshot(screenshotName('update-primary-hue.png'));
  });

  await test.step('adds a secondary color', async () => {
    const ColorItem = page.getByTestId('ColorItem');

    await expect(ColorItem.first()).toHaveAttribute('aria-current', 'true');

    await page.getByRole('button', { name: 'Add Color' }).click();

    await page.waitForTimeout(collapseDuration);

    await expect(ColorItem).toHaveCount(2);
    await expect(ColorItem.first()).toHaveAttribute('aria-current', 'false');
    await expect(ColorItem.nth(1)).toHaveAttribute('aria-current', 'true');

    await expect(page).toHaveURL(hasColor('Secondary'));

    await expect(page).toHaveScreenshot(screenshotName('secondary-color.png'));
  });

  await test.step('adds a third color', async () => {
    const ColorItem = page.getByTestId('ColorItem');

    await page.getByRole('button', { name: 'Add Color' }).click();

    await page.waitForTimeout(collapseDuration);

    await expect(ColorItem).toHaveCount(3);
    await expect(ColorItem.nth(1)).toHaveAttribute('aria-current', 'false');
    await expect(ColorItem.nth(2)).toHaveAttribute('aria-current', 'true');

    await expect(page).toHaveURL(hasColor('Tertiary'));

    await expect(page).toHaveScreenshot(screenshotName('tertiary-color.png'));
  });

  await test.step('reorders colors to Tertiary first and Primary last', async () => {
    const reorderButton = page.getByRole('button', { name: 'Reorder colors' });

    await reorderButton.scrollIntoViewIfNeeded();
    await reorderButton.click();

    const panel = page.getByTestId('ReorderColors');

    await expect(panel.getByRole('listitem')).toHaveCount(3);

    await expect(page).toHaveScreenshot(screenshotName('reorder-menu.png'));

    // Two drags turn [Primary, Secondary, Tertiary] into [Tertiary, Secondary, Primary]:
    // Tertiary up to the top, then Primary down to the bottom.
    await dragReorderRow(page, 'Tertiary', 'top');
    await expect(page.locator('input[name="color-name-0"]')).toHaveValue('Tertiary');

    // Let the layout animation settle before measuring rows for the second drag.
    await page.waitForTimeout(collapseDuration);

    await dragReorderRow(page, 'Primary', 'bottom');

    // Commit-on-drop reorders the store, re-basing the palette on Tertiary and re-rendering
    // the main list in the new order.
    await expect(page.locator('input[name="color-name-0"]')).toHaveValue('Tertiary');
    await expect(page.locator('input[name="color-name-1"]')).toHaveValue('Secondary');
    await expect(page.locator('input[name="color-name-2"]')).toHaveValue('Primary');

    // The URL path segments follow the new order (Tertiary is now the base).
    await expect(page).toHaveURL(url => {
      const segments = url.pathname.split('/').filter(Boolean);
      const positions = ['Tertiary', 'Secondary', 'Primary'].map(name =>
        segments.findIndex(segment => segment.startsWith(`${name}-`)),
      );

      return positions.every(
        (value, index) => value !== -1 && (index === 0 || positions[index - 1] < value),
      );
    });

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await reorderButton.blur();

    await expect(page).toHaveScreenshot(screenshotName('reordered-colors.png'));
  });

  await test.step('removes the Tertiary color with confirmation', async () => {
    await page.getByRole('button', { name: 'Select Tertiary' }).click();

    // Tertiary is first after the reorder above.
    await expect(page.getByTestId('ColorItem').nth(0)).toHaveAttribute('aria-current', 'true');

    await removeColor(page, 0);

    await expect(page).toHaveURL(lacksColor('Tertiary'));
    await expect(page).toHaveURL(hasColor('Primary'));
    await expect(page).toHaveURL(hasColor('Secondary'));

    await page.waitForTimeout(collapseDuration);
    await scrollPanelToTop(page);
    await scrollToTop(page);

    await expect(page).toHaveScreenshot(screenshotName('remove-tertiary.png'));
  });

  await test.step('removes the Secondary color with confirmation', async () => {
    await page.getByRole('button', { name: 'Select Secondary' }).click();

    // Secondary is first after Tertiary's removal (order is [Secondary, Primary]).
    await expect(page.getByTestId('ColorItem').nth(0)).toHaveAttribute('aria-current', 'true');

    await removeColor(page, 0);

    await expect(page).toHaveURL(lacksColor('Secondary'));
    await expect(page).toHaveURL(hasColor('Primary'));

    await page.waitForTimeout(collapseDuration);
    await scrollPanelToTop(page);
    await scrollToTop(page);

    await expect(page).toHaveScreenshot(screenshotName('remove-secondary.png'));
  });

  await test.step('walks the palette history back and forward', async () => {
    const ColorItem = page.getByTestId('ColorItem');
    // The exact entries the app committed across this spec's mutations (see createPage's
    // historyStack collector). The add/reorder/remove chain above is what makes this walk
    // worth doing — it's a real sequence, not a manufactured one.
    const stack = await page.evaluate(
      () => (window as unknown as { __historyStack: string[] }).__historyStack,
    );

    expect(stack.length).toBe(11);
    expect(JSON.stringify(sessionStack)).toBe(JSON.stringify(stack));

    await expect(page).toHaveURL(url => url.pathname + url.search === stack.at(-1));

    // Mid-walk screenshot checkpoint, derived from the actual stack length so it stays the
    // true middle as steps are added/removed (not a hardcoded step count).
    const middleIndex = Math.floor(stack.length / 2);

    // toHaveURL auto-retries until the popstate-driven hydrate settles, so each nav is paced.
    for (let index = stack.length - 1; index > 0; index--) {
      await page.goBack();
      await expect(page).toHaveURL(url => url.pathname + url.search === stack[index - 1]);

      if (index === middleIndex) {
        await expect(page).toHaveScreenshot(screenshotName('history-back-middle.png'));
      }
    }

    await expect(ColorItem).toHaveCount(1);
    await expect(page).toHaveScreenshot(screenshotName('history-initial.png'));

    // Regression guard: the History API switch must not clobber forward entries.
    for (let index = 1; index < stack.length; index++) {
      await page.goForward();
      await expect(page).toHaveURL(url => url.pathname + url.search === stack[index]);

      if (index === middleIndex) {
        await expect(page).toHaveScreenshot(screenshotName('history-forward-middle.png'));
      }
    }

    await expect(ColorItem).toHaveCount(1);

    await expect(page).toHaveScreenshot(screenshotName('history-final.png'));
  });
});
