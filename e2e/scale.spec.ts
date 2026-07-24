import { devices, expect, type Page, test } from '@playwright/test';

import { collapseDuration, seedPalette } from './__setup__/constants';
import { createPage } from './__setup__/page';
import {
  createScreenshotNamer,
  hasColorOptions,
  hasExactParams,
  hasNoQuery,
  hasParams,
  lacksParams,
  scrollPanelTo,
  scrollToTop,
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
  page = await createPage(browser, { url: seedPalette });
});

test.afterAll(async () => {
  await page.close();
});

/**
 * Presets, Advanced Options and the palette options panel are three UIs onto the same
 * GlobalScaleOptions (progressive discovery), so they live together.
 *
 * Step order is load-bearing: the presets assert with hasExactParams and reset asserts
 * hasNoQuery, both of which only hold while the query is otherwise clean. The palette options
 * panel writes i/v/m/s/o/k to that same query, so it has to come after.
 *
 * HeroUI sliders must be driven by keyboard (press Arrow/Page/Home/End), not fill(): fill()
 * fires react-aria's onChange but never onChangeEnd, so the interaction never releases and
 * useUrlSync stays paused, suppressing later URL writes. The assertion between presses forces
 * the controlled re-render, so the next keypress isn't dropped.
 */
test('scale', async () => {
  await test.step('resolves dark mode from the system preference', async () => {
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  await test.step('apply the "Tailwind" preset', async () => {
    await page.getByRole('button', { name: 'Apply a preset' }).click();
    await page.getByRole('menuitemradio', { name: 'Tailwind' }).click();

    // A preset writes its full curve set to the query, dropping any value at its default.
    await expect(page).toHaveURL(
      hasExactParams({ c: '0.75_0.83', f: '1.3_1.05', x: '0.99', n: '0.28' }),
    );

    await expect(page).toHaveScreenshot(screenshotName('preset-tailwind.png'));
  });

  await test.step('apply the "Material" preset', async () => {
    await page.getByRole('button', { name: 'Tailwind' }).click();
    await page.getByRole('menuitemradio', { name: 'Material' }).click();

    await expect(page).toHaveURL(
      hasExactParams({ c: '0.5_0.8', h: '1_-5', f: '0.8_0.9', x: '0.95', n: '0.48' }),
    );

    await expect(page).toHaveScreenshot(screenshotName('preset-material.png'));
  });

  await test.step('apply the "Bootstrap" preset', async () => {
    await page.getByRole('button', { name: 'Material' }).click();
    await page.getByRole('menuitemradio', { name: 'Bootstrap' }).click();

    await expect(page).toHaveURL(
      hasExactParams({ c: '0.73_0.7', h: '9_2', f: '0.9_1.1', x: '0.93', n: '0.24' }),
    );

    await expect(page).toHaveScreenshot(screenshotName('preset-bootstrap.png'));
  });

  await test.step('apply the "Open Color" preset', async () => {
    await page.getByRole('button', { name: 'Bootstrap' }).click();
    await page.getByRole('menuitemradio', { name: 'Open Color' }).click();

    await expect(page).toHaveURL(hasExactParams({ c: '0.8_0.75', f: '1.05_1.4', n: '0.48' }));

    await expect(page).toHaveScreenshot(screenshotName('preset-opencolor.png'));
  });

  await test.step('reset preset', async () => {
    await page.getByRole('button', { name: 'Reset preset' }).click();

    await expect(page.getByRole('button', { name: 'Apply a preset' })).toBeVisible();

    // Reset clears all five curve params; nothing else is set yet, so the query empties.
    await expect(page).toHaveURL(hasNoQuery());
  });

  await test.step('opens Advanced Options', async () => {
    await page.getByRole('button', { name: 'Advanced Options' }).click();
    await page.waitForTimeout(collapseDuration);

    await expect(page.getByTestId('ScaleColorOptions')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-color-options', 'open');

    await scrollPanelTo(page);

    await expect(page).toHaveScreenshot(screenshotName('advanced-options.png'));
  });

  await test.step('change global simple curves', async () => {
    const options = page.getByTestId('ScaleColorOptions');

    // Lightness Curve
    const lightnessCurve = options.locator('input[name="lightnessCurve"]');

    await expect(lightnessCurve).toHaveValue('1.3');

    await lightnessCurve.press('PageDown');

    await expect(page).toHaveURL(hasParams({ f: '1.2' }));
    await expect(lightnessCurve).toHaveValue('1.2');

    // Chroma Curve
    const chromaAmount = options.locator('input[name="chromaAmount"]');

    await expect(chromaAmount).toHaveValue('0');

    await chromaAmount.press('PageUp');
    await expect(page).toHaveURL(hasParams({ c: '0.1' }));
    await expect(chromaAmount).toHaveValue('0.1');

    await chromaAmount.press('PageUp');
    await expect(page).toHaveURL(hasParams({ c: '0.2' }));
    await expect(chromaAmount).toHaveValue('0.2');

    await chromaAmount.press('PageUp');
    await expect(page).toHaveURL(hasParams({ c: '0.3' }));
    await expect(chromaAmount).toHaveValue('0.3');

    // Chroma Curve Peak
    const chromaPeak = options.locator('input[name="chromaPeak"]');

    await expect(chromaPeak).toHaveValue('0.5');

    await chromaPeak.press('PageUp');
    await expect(page).toHaveURL(hasParams({ c: 'p0.3_0.6' }));
    await expect(chromaPeak).toHaveValue('0.6');

    // Hue Shift
    const hueShift = options.locator('input[name="hueShift"]');

    await expect(hueShift).toHaveValue('0');

    await hueShift.press('PageUp');

    await expect(page).toHaveURL(hasParams({ h: '10' }));
    await expect(hueShift).toHaveValue('10');

    await expect(page).toHaveScreenshot(screenshotName('advanced-color-simple-options.png'));
  });

  await test.step('change global range curves', async () => {
    const options = page.getByTestId('ScaleColorOptions');

    // Switching Simple → Split seeds both endpoints from the current scalar; nudging High
    // splits them.
    await options
      .getByRole('tablist', { name: 'Lightness curve mode' })
      .getByRole('tab', { name: 'Split' })
      .click();

    await expect(page).toHaveURL(hasParams({ f: '1.2_1.2' }));

    const lightnessHigh = options.locator('input[name="lightnessCurveHigh"]');

    await lightnessHigh.press('PageUp');
    await expect(lightnessHigh).toHaveValue('1.3');
    await lightnessHigh.press('PageUp');
    await expect(lightnessHigh).toHaveValue('1.4');
    await expect(page).toHaveURL(hasParams({ f: '1.2_1.4' }));

    // Chroma Split endpoints reseed from the input color's gamut fraction, so pin both ends
    // with Home/End rather than depend on the seed.
    await options
      .getByRole('tablist', { name: 'Chroma curve mode' })
      .getByRole('tab', { name: 'Split' })
      .click();

    const chromaLow = options.locator('input[name="chromaLow"]');
    const chromaHigh = options.locator('input[name="chromaHigh"]');

    await chromaLow.press('Home');
    await expect(chromaLow).toHaveValue('0');

    await chromaHigh.press('End');
    await expect(chromaHigh).toHaveValue('1');
    await expect(page).toHaveURL(hasParams({ c: '0_1' }));

    // Scalar hue shift expands to a symmetric pair on Split, so the endpoints are already set.
    await options
      .getByRole('tablist', { name: 'Hue shift mode' })
      .getByRole('tab', { name: 'Split' })
      .click();

    await expect(options.locator('input[name="hueShiftLow"]')).toHaveValue('-10');
    await expect(options.locator('input[name="hueShiftHigh"]')).toHaveValue('10');
    await expect(page).toHaveURL(hasParams({ h: '-10_10' }));

    await expect(page).toHaveScreenshot(screenshotName('advanced-color-split-options.png'));
  });

  await test.step('close Advanced Options', async () => {
    await page.getByRole('button', { name: 'Advanced Options' }).click();

    await expect(page.getByTestId('ColorOptions')).toHaveAttribute('data-open', 'false');
    await expect(page.locator('html')).toHaveAttribute('data-color-options', 'closed');

    await expect(page).toHaveScreenshot(screenshotName('post-advanced-color-options.png'));
  });

  await test.step('show Tertiary color options and update them', async () => {
    const colorItem = page.getByTestId('ColorItem').nth(2);

    // A ColorItem's actions live inside a Collapse gated on `isActive` (ColorItem.tsx:276), so
    // Tertiary has to be selected before its options exist. A seeded palette activates the
    // first color, not the last.
    await page.getByRole('button', { name: 'Select Tertiary' }).click();
    await expect(colorItem).toHaveAttribute('aria-current', 'true');

    await colorItem.getByRole('button', { name: 'Change color options' }).click();
    await page.waitForTimeout(collapseDuration);

    const colorItemOffset = await colorItem.evaluate(el => (el as HTMLElement).offsetTop);

    await scrollPanelTo(page, colorItemOffset);

    // The color inherits the global Split curves; switching its Lightness Curve back to Simple
    // writes a per-color override seeded from the range midpoint.
    await colorItem
      .getByRole('tablist', { name: 'Lightness curve mode' })
      .getByRole('tab', { name: 'Simple' })
      .click();

    const lightnessCurve = colorItem.locator('input[name="lightnessCurve"]');

    await expect(lightnessCurve).toHaveValue('1.3');

    await lightnessCurve.press('PageDown');

    await expect(lightnessCurve).toHaveValue('1.2');
    await expect(page).toHaveURL(hasColorOptions('Tertiary', { f: '1.2' }));

    await page.getByTestId('ColorLockOptions').click();
    await page.getByRole('option', { name: '400', exact: true }).click();

    await expect(page.getByTestId('ColorLockOptions')).toHaveText('400');
    await expect(page).toHaveURL(hasColorOptions('Tertiary', { f: '1.2', k: 400 }));

    await expect(page).toHaveScreenshot(screenshotName('color-options.png'));
  });

  await test.step('closes Tertiary color options', async () => {
    const colorItem = page.getByTestId('ColorItem').nth(2);

    await colorItem.getByRole('button', { name: 'Change color options' }).click();

    await expect(colorItem.locator('input[name="lightnessCurve"]')).not.toBeVisible();

    await expect(page).toHaveScreenshot(screenshotName('post-color-options.png'));
  });

  await test.step('opens palette options panel', async () => {
    await scrollToTop(page);

    await page.getByRole('button', { name: 'Palette Options' }).click();

    await expect(page.locator('html')).toHaveAttribute('data-palette-options', 'open');

    await expect(page).toHaveScreenshot(screenshotName('palette-options.png'));
  });

  await test.step('switches the scale mode', async () => {
    const lightRadio = page.getByRole('radio', { name: 'Light' });
    const darkRadio = page.getByRole('radio', { name: 'Dark' });
    const reversedRadio = page.getByRole('radio', { name: 'Reversed' });

    await expect(darkRadio).toBeVisible();

    await darkRadio.click();

    await expect(darkRadio).toBeChecked();
    // Dark is non-default, so it surfaces in the query as `m=d`.
    await expect(page).toHaveURL(hasParams({ m: 'd' }));

    await expect(page).toHaveScreenshot(screenshotName('dark-scale.png'));

    await reversedRadio.click();
    await expect(reversedRadio).toBeChecked();
    // Reverse is non-default, so it surfaces in the query as `m=r`.
    await expect(page).toHaveURL(hasParams({ m: 'r' }));

    await expect(page).toHaveScreenshot(screenshotName('reversed-scale.png'));

    await lightRadio.click();
    await expect(lightRadio).toBeChecked();
    // Light is the default, so the param is dropped entirely.
    await expect(page).toHaveURL(lacksParams('m'));
  });

  await test.step('adjusts scale options and updates URL', async () => {
    const paletteOptions = page.getByTestId('PaletteOptions');
    const steps = page.locator('input[name="steps"]');

    await steps.press('ArrowLeft');
    await expect(steps).toHaveValue('10');
    await expect(page).toHaveURL(hasParams({ i: 10 }));

    await page.getByRole('button', { name: /^select variant/i }).click();
    await page.getByRole('option', { name: 'Neutral' }).click();
    await expect(page).toHaveURL(hasParams({ v: 'neutral' }));

    await expect(page).toHaveScreenshot(screenshotName('custom-steps-and-variant.png'));

    await paletteOptions.getByRole('button', { name: 'Reset', exact: true }).click();

    await page.getByRole('switch', { name: 'Apply saturation to all colors' }).click();

    const saturation = page.locator('input[name="saturation"]');

    await saturation.press('End');
    await expect(saturation).toHaveValue('100');

    // Maxing saturation with the override on writes both o=1 and s=100.
    await expect(page).toHaveURL(hasParams({ o: 1, s: 100 }));

    await expect(page).toHaveScreenshot(screenshotName('saturation-override.png'));

    // With the override on, Color Info surfaces the global saturation as a row (hidden otherwise).
    await page.getByRole('button', { name: 'View color info' }).first().click();

    const scaleOptions = page.getByTestId('ColorInfo-ScaleOptions');

    await expect(scaleOptions.getByText('Saturation')).toBeVisible();
    await expect(scaleOptions.getByText('100%')).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(scaleOptions).not.toBeVisible();

    // Reset clears only the palette options (steps/variant/saturation), leaving the curves.
    await paletteOptions.getByRole('button', { name: 'Reset', exact: true }).click();

    await expect(page).toHaveURL(lacksParams('i', 'o', 's', 'v'));
  });

  await test.step("enable lock 300 and set steps thet don't have it", async () => {
    await page.getByRole('button', { name: /^select lock/i }).click();
    await page.getByRole('option', { name: '300', exact: true }).click();

    await expect(page.getByRole('button', { name: /^300 lock/i })).toBeVisible();
    await expect(page).toHaveURL(hasParams({ k: 300 }));

    const steps = page.locator('input[name="steps"]');

    await steps.press('ArrowLeft');
    await expect(steps).toHaveValue('10');
    await expect(page).toHaveURL(hasParams({ i: 10 }));

    await steps.press('ArrowLeft');
    await expect(steps).toHaveValue('9');
    await expect(page).toHaveURL(hasParams({ i: 9 }));

    await steps.press('ArrowLeft');
    await expect(steps).toHaveValue('8');
    await expect(page).toHaveURL(hasParams({ i: 8 }));

    await steps.press('ArrowLeft');
    await expect(steps).toHaveValue('7');
    await expect(page).toHaveURL(hasParams({ i: 7 }));

    await expect(page).toHaveScreenshot(screenshotName('invalid-lock-300.png'));

    await page
      .getByTestId('PaletteOptions')
      .getByRole('button', { name: 'Reset', exact: true })
      .click();
  });

  await test.step('enable lock 500', async () => {
    await page.getByRole('button', { name: /^select lock/i }).click();
    await page.getByRole('option', { name: '500', exact: true }).click();

    await expect(page.getByRole('button', { name: /^500 lock/i })).toBeVisible();
    await expect(page).toHaveURL(hasParams({ k: 500 }));

    await expect(page).toHaveScreenshot(screenshotName('lock-500.png'));
  });

  await test.step('close the palette options', async () => {
    await page.getByRole('button', { name: 'Palette Options' }).click();

    await expect(page.locator('html')).toHaveAttribute('data-palette-options', 'closed');

    await expect(page).toHaveScreenshot(screenshotName('post-palette-options.png'));
  });

  await test.step('opens export scale drawer', async () => {
    // One Export scale button per color — this exports Primary's scale.
    await page.getByLabel('Export scale').first().click();

    await expect(page.getByRole('tab', { name: 'Tailwind 4' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'OKLCH' })).toBeVisible();

    await expect(page).toHaveScreenshot(screenshotName('export-scale.png'));

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('tab', { name: 'Tailwind 4' })).not.toBeVisible();
  });
});
