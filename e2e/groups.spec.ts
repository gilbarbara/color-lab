import { devices, expect, type Page, test } from '@playwright/test';

import { collapseDuration, seedSingle } from './__setup__/constants';
import { createPage } from './__setup__/page';
import {
  createScreenshotNamer,
  hasColorOptions,
  lacksColor,
  lacksColorOptions,
  removeColor,
  scrollPanelToTop,
  setColorGroup,
} from './__setup__/utils';

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

const toolbar = () => page.getByRole('group', { name: 'Filter by color group' });
const scales = () => page.getByTestId('Scale');

/** Add a color and wait for the new card's collapse + auto-scroll to settle. */
async function addColor(expectedCount: number) {
  await page.getByRole('button', { name: 'Add Color' }).click();
  await expect(page.getByTestId('ColorItem')).toHaveCount(expectedCount);
  await page.waitForTimeout(collapseDuration);
  await scrollPanelToTop(page);
}

async function scrollToTop() {
  await page.evaluate(() => window.scrollTo(0, 0));
}

/**
 * Color groups are two features sharing one piece of state: assignment (a `g:` code on the
 * color's URL segment, set from either the Scale row or the sidebar card) and filtering (an
 * in-memory `appStore.groupFilter` the Grid/List views read through `useGroupFilteredColors`).
 *
 * The filter is a view lens only — Export All and Share still act on the whole palette, so
 * nothing here asserts against them.
 *
 * Step order is load-bearing: the palette is built up to nine grouped colors once, and every
 * filter assertion below counts scales against that fixed set.
 */
test('groups', async () => {
  await test.step('hides the toolbar while no color has a group', async () => {
    await expect(scales()).toHaveCount(1);
    await expect(toolbar()).toHaveCount(0);
  });

  await test.step('assigns a group from the sidebar color card', async () => {
    // The card's ColorGroupMenu only exists for the active color (it lives in the Collapse),
    // which Primary is on load. Every other assignment below goes through the Scale row.
    await setColorGroup(page, 'Primary', 'Brand', 'card');

    await expect(page).toHaveURL(hasColorOptions('Primary', { g: 'b' }));
    await expect(toolbar().getByRole('button', { name: 'Filter By Brand' })).toBeVisible();
  });

  await test.step('assigns a group from the scale row', async () => {
    await addColor(2);
    await setColorGroup(page, 'Secondary', 'Brand');

    await expect(page).toHaveURL(hasColorOptions('Secondary', { g: 'b' }));

    // One chip per *used* group, not one per group that exists.
    await expect(toolbar().getByRole('button')).toHaveCount(1);

    await scrollToTop();
    await expect(page).toHaveScreenshot(screenshotName('brand-colors.png'));
  });

  await test.step('groups the remaining colors', async () => {
    await addColor(3);
    await setColorGroup(page, 'Tertiary', 'Decorative');

    await addColor(4);
    await setColorGroup(page, 'Accent', 'Decorative');

    await addColor(5);
    await setColorGroup(page, 'Color 5', 'Neutral');

    await addColor(6);
    await setColorGroup(page, 'Color 6', 'Neutral');

    await addColor(7);
    await setColorGroup(page, 'Color 7', 'Semantic');

    await addColor(8);
    await setColorGroup(page, 'Color 8', 'Semantic');

    await addColor(9);
    await setColorGroup(page, 'Color 9', 'Semantic');

    await expect(page).toHaveURL(hasColorOptions('Tertiary', { g: 'd' }));
    await expect(page).toHaveURL(hasColorOptions('Color+5', { g: 'n' }));
    await expect(page).toHaveURL(hasColorOptions('Color+7', { g: 's' }));

    // Chips follow COLOR_GROUPS key order, not the order the groups were assigned in
    // (Decorative was used before Neutral and Semantic).
    await expect(toolbar().getByRole('button')).toHaveText([
      'Brand',
      'Neutral',
      'Semantic',
      'Decorative',
    ]);

    await scrollToTop();
    await expect(page).toHaveScreenshot(screenshotName('all-groups.png'));
  });

  await test.step('filters by each group', async () => {
    const cases = [
      { count: 2, group: 'Brand' },
      { count: 2, group: 'Neutral' },
      { count: 3, group: 'Semantic' },
      { count: 2, group: 'Decorative' },
    ];

    for (const { count, group } of cases) {
      const chip = toolbar().getByRole('button', { name: `Filter by ${group}`, exact: true });

      await chip.click();

      await expect(chip).toHaveAttribute('aria-pressed', 'true');
      await expect(scales()).toHaveCount(count);

      await scrollToTop();
      await expect(page).toHaveScreenshot(screenshotName(`filter-${group.toLowerCase()}.png`));

      // Toggle off, so each case starts from an unfiltered palette.
      await chip.click();
      await expect(chip).toHaveAttribute('aria-pressed', 'false');
      await expect(scales()).toHaveCount(9);
    }
  });

  await test.step('filters by more than one group at once', async () => {
    await toolbar().getByRole('button', { name: 'Filter by Brand', exact: true }).click();
    await toolbar().getByRole('button', { name: 'Filter by Semantic', exact: true }).click();

    await expect(scales()).toHaveCount(5);

    await scrollToTop();
    await expect(page).toHaveScreenshot(screenshotName('filter-multiple.png'));
  });

  await test.step('clears the filter', async () => {
    await toolbar().getByRole('button', { name: 'Clear group filters' }).click();

    await expect(scales()).toHaveCount(9);
    await expect(toolbar().getByRole('button', { name: 'Clear group filters' })).toHaveCount(0);
  });

  await test.step('filters the grid view', async () => {
    await page.getByRole('button', { name: 'Display Options' }).click();
    await page.getByRole('radio', { name: 'Grid' }).click();

    await toolbar().getByRole('button', { name: 'Filter by Neutral', exact: true }).click();

    await expect(page.getByTestId('PaletteGrid').getByRole('button')).toHaveCount(2);

    await scrollToTop();
    await expect(page).toHaveScreenshot(screenshotName('filter-grid.png'));

    await page.getByRole('button', { name: 'Display Options' }).click();
    await page.getByRole('radio', { name: 'List' }).click();

    await toolbar().getByRole('button', { name: 'Clear group filters' }).click();
    await expect(scales()).toHaveCount(9);
  });

  await test.step('hides the toolbar in the preview view', async () => {
    await page.getByRole('button', { name: 'Display Options' }).click();
    await page.getByRole('radio', { name: 'Preview' }).click();

    await expect(toolbar()).toHaveCount(0);

    await page.getByRole('button', { name: 'Display Options' }).click();
    await page.getByRole('radio', { name: 'List' }).click();

    await expect(toolbar()).toBeVisible();
  });

  await test.step('clear the filter toolbar when its last color loses the group', async () => {
    await toolbar().getByRole('button', { name: 'Filter by Decorative', exact: true }).click();
    await expect(scales()).toHaveCount(2);

    // One of the two goes ungrouped: the group is still in use, so the filter holds.
    await setColorGroup(page, 'Tertiary', 'None');

    await expect(page).toHaveURL(lacksColorOptions('Tertiary', 'g'));
    await expect(scales()).toHaveCount(1);
    await expect(toolbar().getByRole('button', { name: 'Filter by Decorative' })).toBeVisible();

    // The last one goes too: the chip disappears, and useGroupFilterSync retires the now
    // unreachable filter instead of stranding the view empty.
    await setColorGroup(page, 'Accent', 'None');

    await expect(page).toHaveURL(lacksColorOptions('Accent', 'g'));
    await expect(toolbar().getByRole('button', { name: 'Filter by Decorative' })).toHaveCount(0);
    await expect(scales()).toHaveCount(9);

    await scrollToTop();
    await expect(page).toHaveScreenshot(screenshotName('hide-decorative-filter.png'));
  });

  await test.step('retires the filter when its last color is removed', async () => {
    await toolbar().getByRole('button', { name: 'Filter by Brand', exact: true }).click();
    await expect(scales()).toHaveCount(2);

    // Remove is a click-again-to-confirm control on the *active* color's card only, so each
    // color is selected from its (still visible) scale row first.
    await page.getByRole('button', { name: 'Select Primary' }).click();
    await expect(page.getByTestId('ColorItem').nth(0)).toHaveAttribute('aria-current', 'true');
    await removeColor(page, 0);

    await expect(page).toHaveURL(lacksColor('Primary'));
    await expect(scales()).toHaveCount(1);

    await page.getByRole('button', { name: 'Select Secondary' }).click();
    await expect(page.getByTestId('ColorItem').nth(0)).toHaveAttribute('aria-current', 'true');
    await removeColor(page, 0);

    await expect(page).toHaveURL(lacksColor('Secondary'));
    await expect(toolbar().getByRole('button', { name: 'Filter by Brand' })).toHaveCount(0);
    await expect(scales()).toHaveCount(7);
  });

  await test.step('restores the groups from the URL, with no filter applied', async () => {
    await toolbar().getByRole('button', { name: 'Filter by Semantic', exact: true }).click();
    await expect(scales()).toHaveCount(3);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // The groups ride in the URL; the filter is in-memory only, so it resets to "All".
    await expect(toolbar().getByRole('button')).toHaveText(['Neutral', 'Semantic']);
    await expect(scales()).toHaveCount(7);
  });

  // A new color is ungrouped and the filter excludes ungrouped colors, so adding one under an
  // active filter would strand it: visible in the sidebar, absent from the palette.
  await test.step('clears the filter when a color is added', async () => {
    await toolbar().getByRole('button', { name: 'Filter by Semantic', exact: true }).click();
    await expect(scales()).toHaveCount(3);

    await addColor(8);

    await expect(toolbar().getByRole('button', { name: 'Clear group filters' })).toHaveCount(0);
    await expect(
      toolbar().getByRole('button', { name: 'Filter by Semantic', exact: true }),
    ).toHaveAttribute('aria-pressed', 'false');
    await expect(scales()).toHaveCount(8);
  });
});
