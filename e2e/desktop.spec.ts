/* eslint-disable no-restricted-globals */
import { devices, expect, type Page, test } from '@playwright/test';

import {
  hasColor,
  hasColorOptions,
  hasExactParams,
  hasNoQuery,
  hasParams,
  lacksColor,
  lacksParams,
  scrollPanelToTop,
} from './__setup__/utils';
import { collapseDuration, scrollOffset } from './fixtures/constants';

let screenshotCount = 0;

function getScreenshotName(name: string) {
  screenshotCount += 1;

  return `${screenshotCount.toString().padStart(3, '0')}-${name}`;
}

// HeroUI sliders must be driven by keyboard (focus + Arrow/Page/Home/End), not fill():
// fill() fires react-aria's onChange but never onChangeEnd, so the interaction never
// releases and useUrlSync stays paused, suppressing later URL writes.
let page: Page;

// The clean single-color palette URL captured mid-flow, replayed by the color-spacing steps.
let savedColorUrl = '';

test.use({
  ...devices['Desktop Chrome'],
  permissions: ['clipboard-read', 'clipboard-write'],
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

  // Record the history back-stack the app commits (pushState appends, replaceState rewrites)
  // so the back/forward step can replay the exact sequence. Survives Next's own history patch.
  await page.addInitScript(() => {
    const w = window as unknown as { __historyStack: string[] };

    w.__historyStack = [location.pathname + location.search];

    (['pushState', 'replaceState'] as const).forEach(name => {
      const original = history[name].bind(history);

      history[name] = (data: unknown, unused: string, url?: string | URL | null) => {
        original(data, unused, url);
        const full = location.pathname + location.search;

        if (name === 'pushState') {
          w.__historyStack.push(full);
        } else {
          w.__historyStack[w.__historyStack.length - 1] = full;
        }
      };
    });
  });

  await page.goto('/p/Primary-73.0_0.23001_321');
});

test.afterAll(async () => {
  await page.close();
});

// Replay the saved single-color palette, pick a spacing, and add 5 colors (6 total). Each new
// color rotates the previous hue by the spacing's angle, so the swatches fan out progressively
// wider from Even (36°) to Golden (137.5°).
async function addSpacedColors(spacing: string, screenshot: string) {
  await page.goto(savedColorUrl);
  await page.waitForLoadState('networkidle');

  // The sidebar is persisted open (Select Primary auto-opened it); assert before driving it.
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
  await page.evaluate(() => window.scrollTo(0, 0));

  await expect(page).toHaveScreenshot(getScreenshotName(screenshot));
}

test('desktop', async () => {
  await test.step('displays main elements on initial load', async () => {
    await expect(page.getByRole('link', { name: /colormeup/i })).toBeVisible();

    // check for the default data attributes in the HTML
    await expect(page.locator('html')).toHaveAttribute('data-sidebar', 'open');
    await expect(page.locator('html')).toHaveAttribute('data-preview', 'open');
    await expect(page.locator('html')).toHaveAttribute('data-palette-options', 'closed');
    await expect(page.locator('html')).toHaveAttribute('data-color-options', 'closed');
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

  await test.step('modifies color via lightness slider and updates URL', async () => {
    const lightnessSlider = page.getByRole('slider', { exact: true, name: 'Lightness' });

    await expect(lightnessSlider).toHaveValue('0.73');

    await lightnessSlider.fill('0.6');
    await expect(lightnessSlider).toHaveValue('0.6');

    await expect(page).toHaveURL(hasColor('Primary', '60'));
    await expect(page).toHaveScreenshot(getScreenshotName('update-primary-lightness.png'));
  });

  await test.step('modifies chroma slider and updates URL', async () => {
    const chromaSlider = page.getByRole('slider', { exact: true, name: 'Chroma' });

    await chromaSlider.fill('0.21');

    await expect(page).toHaveURL(hasColor('Primary', '60_0.21'));

    await expect(page).toHaveScreenshot(getScreenshotName('update-primary-chroma.png'));
  });

  await test.step('modifies hue slider (and recalibrate chroma)', async () => {
    const hueSlider = page.getByRole('slider', { exact: true, name: 'Hue' });
    const chromaSlider = page.getByRole('slider', { exact: true, name: 'Chroma' });

    await hueSlider.fill('150');
    await expect(page).toHaveURL(/150/);

    await chromaSlider.fill('0.21');
    await expect(page).toHaveURL(hasColor('Primary', '60_0.21_150'));

    await expect(page).toHaveScreenshot(getScreenshotName('update-primary-hue.png'));
  });

  await test.step('opens export scale drawer', async () => {
    await page.getByLabel('Export scale').click();

    await expect(page.getByRole('tab', { name: 'Tailwind 4' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'OKLCH' })).toBeVisible();

    await expect(page).toHaveScreenshot(getScreenshotName('export-scale.png'));

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('tab', { name: 'Tailwind 4' })).not.toBeVisible();
  });

  await test.step('adds a secondary color', async () => {
    const addColorButton = page.getByRole('button', { name: 'Add Color' });
    const ColorItem = page.getByTestId('ColorItem');

    await expect(ColorItem.first()).toHaveAttribute('aria-current', 'true');

    await addColorButton.click();

    await page.waitForTimeout(collapseDuration);

    await expect(ColorItem).toHaveCount(2);
    await expect(ColorItem.first()).toHaveAttribute('aria-current', 'false');
    await expect(ColorItem.nth(1)).toHaveAttribute('aria-current', 'true');

    await expect(page).toHaveURL(hasColor('Secondary'));

    await expect(page).toHaveScreenshot(getScreenshotName('secondary-color.png'));
  });

  await test.step('adds a third color', async () => {
    const addColorButton = page.getByRole('button', { name: 'Add Color' });
    const ColorItem = page.getByTestId('ColorItem');

    await expect(ColorItem.nth(1)).toHaveAttribute('aria-current', 'true');

    await addColorButton.click();

    await page.waitForTimeout(collapseDuration);

    await expect(ColorItem).toHaveCount(3);
    await expect(ColorItem.nth(1)).toHaveAttribute('aria-current', 'false');
    await expect(ColorItem.nth(2)).toHaveAttribute('aria-current', 'true');

    await expect(page).toHaveURL(hasColor('Tertiary'));

    await expect(page).toHaveScreenshot(getScreenshotName('third-color.png'));
  });

  await test.step('apply the "Tailwind" preset', async () => {
    await page.getByRole('button', { name: 'Apply a preset' }).click();

    await page.getByRole('menuitemradio', { name: 'Tailwind' }).click();

    // A preset writes its full curve set to the query, dropping any value at its default.
    await expect(page).toHaveURL(
      hasExactParams({ c: '0.75_0.83', f: '1.3_1.05', x: '0.99', n: '0.28' }),
    );

    await expect(page).toHaveScreenshot(getScreenshotName('preset-tailwind.png'));
  });

  await test.step('apply the "Material" preset', async () => {
    await page.getByRole('button', { name: 'Tailwind' }).click();

    await page.getByRole('menuitemradio', { name: 'Material' }).click();

    await expect(page).toHaveURL(
      hasExactParams({ c: '0.5_0.8', h: '1_-5', f: '0.8_0.9', x: '0.95', n: '0.48' }),
    );

    await expect(page).toHaveScreenshot(getScreenshotName('preset-material.png'));
  });

  await test.step('apply the "Bootstrap" preset', async () => {
    await page.getByRole('button', { name: 'Material' }).click();

    await page.getByRole('menuitemradio', { name: 'Bootstrap' }).click();

    await expect(page).toHaveURL(
      hasExactParams({ c: '0.73_0.7', h: '9_2', f: '0.9_1.1', x: '0.93', n: '0.24' }),
    );

    await expect(page).toHaveScreenshot(getScreenshotName('preset-bootstrap.png'));
  });

  await test.step('apply the "Open Color" preset', async () => {
    await page.getByRole('button', { name: 'Bootstrap' }).click();

    await page.getByRole('menuitemradio', { name: 'Open Color' }).click();

    await expect(page).toHaveURL(hasExactParams({ c: '0.8_0.75', f: '1.05_1.4', n: '0.48' }));

    await expect(page).toHaveScreenshot(getScreenshotName('preset-opencolor.png'));
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

    await page.getByTestId('GeneratorPanel').evaluate(el => {
      el.scrollTo({ top: 0, behavior: 'instant' });
    });

    await expect(page).toHaveScreenshot(getScreenshotName('advanced-options.png'));
  });

  await test.step('change global simple curves', async () => {
    const lightnessCurveSlider = page.locator('input[name="lightnessCurve"]');

    await expect(lightnessCurveSlider).toHaveValue('1.3');

    await lightnessCurveSlider.focus();
    await page.keyboard.press('PageDown');

    await expect(page).toHaveURL(hasParams({ f: '1.2' }));
    await expect(lightnessCurveSlider).toHaveValue('1.2');

    // Chroma Curve
    const chromaCurveSlider = page.locator('input[name="chromaAmount"]');

    await expect(chromaCurveSlider).toHaveValue('0');

    await chromaCurveSlider.focus();
    await page.keyboard.press('PageUp');
    await expect(page).toHaveURL(hasParams({ c: '0.1' }));
    await expect(chromaCurveSlider).toHaveValue('0.1');

    await page.keyboard.press('PageUp');
    await expect(page).toHaveURL(hasParams({ c: '0.2' }));
    await expect(chromaCurveSlider).toHaveValue('0.2');

    await page.keyboard.press('PageUp');
    await expect(page).toHaveURL(hasParams({ c: '0.3' }));
    await expect(chromaCurveSlider).toHaveValue('0.3');

    // Chroma Curve Peak
    const chromaCurvePeakSlider = page.locator('input[name="chromaPeak"]');

    await expect(chromaCurvePeakSlider).toHaveValue('0.5');

    await chromaCurvePeakSlider.focus();

    await page.keyboard.press('PageUp');
    await expect(page).toHaveURL(hasParams({ c: 'p0.3_0.6' }));

    await expect(chromaCurvePeakSlider).toHaveValue('0.6');

    // Hue Shift
    const hueShiftSlider = page.locator('input[name="hueShift"]');

    await expect(hueShiftSlider).toHaveValue('0');

    await hueShiftSlider.focus();
    await page.keyboard.press('PageUp');

    await expect(page).toHaveURL(hasParams({ h: '10' }));
    await expect(hueShiftSlider).toHaveValue('10');

    await expect(page).toHaveScreenshot(getScreenshotName('advanced-color-simple-options.png'));
  });

  await test.step('change global range curves', async () => {
    // Switching Simple → Split seeds both endpoints from the current scalar; nudging
    // High splits them. The mid-assertion forces the controlled re-render so the next
    // keypress isn't dropped.
    await page
      .getByRole('tablist', { name: 'Lightness curve mode' })
      .getByRole('tab', { name: 'Split' })
      .click();

    await expect(page).toHaveURL(hasParams({ f: '1.2_1.2' }));

    const lightnessHigh = page.locator('input[name="lightnessCurveHigh"]');

    await lightnessHigh.focus();
    await page.keyboard.press('PageUp');
    await expect(lightnessHigh).toHaveValue('1.3');
    await page.keyboard.press('PageUp');
    await expect(lightnessHigh).toHaveValue('1.4');
    await expect(page).toHaveURL(hasParams({ f: '1.2_1.4' }));

    // Chroma Split endpoints reseed from the input color's gamut fraction, so pin both
    // ends with Home/End rather than depend on the seed.
    await page
      .getByRole('tablist', { name: 'Chroma curve mode' })
      .getByRole('tab', { name: 'Split' })
      .click();

    const chromaLow = page.locator('input[name="chromaLow"]');
    const chromaHigh = page.locator('input[name="chromaHigh"]');

    await chromaLow.focus();
    await page.keyboard.press('Home');
    await expect(chromaLow).toHaveValue('0');

    await chromaHigh.focus();
    await page.keyboard.press('End');
    await expect(chromaHigh).toHaveValue('1');
    await expect(page).toHaveURL(hasParams({ c: '0_1' }));

    // Scalar hue shift expands to a symmetric pair on Split, so the endpoints are already set.
    await page
      .getByRole('tablist', { name: 'Hue shift mode' })
      .getByRole('tab', { name: 'Split' })
      .click();

    await expect(page.locator('input[name="hueShiftLow"]')).toHaveValue('-10');
    await expect(page.locator('input[name="hueShiftHigh"]')).toHaveValue('10');
    await expect(page).toHaveURL(hasParams({ h: '-10_10' }));

    await expect(page).toHaveScreenshot(getScreenshotName('advanced-color-split-options.png'));
  });

  await test.step('close Advanced Options', async () => {
    await page.getByRole('button', { name: 'Advanced Options' }).click();

    await expect(page.getByTestId('ColorOptions')).toHaveAttribute('data-open', 'false');
    await expect(page.locator('html')).toHaveAttribute('data-color-options', 'closed');

    await expect(page).toHaveScreenshot(getScreenshotName('post-advanced-color-options.png'));
  });

  await test.step('show Tertiary color options and update them', async () => {
    const colorItem = page.getByTestId('ColorItem').nth(2);

    await colorItem.getByRole('button', { name: 'Change color options' }).click();
    await page.waitForTimeout(collapseDuration);

    const colorItemOffset = await colorItem.evaluate(el => (el as HTMLElement).offsetTop);

    await page.getByTestId('GeneratorPanel').evaluate((el, scrollTop) => {
      el.scrollTo({ top: scrollTop, behavior: 'instant' });
    }, colorItemOffset);

    // The color inherits the global Split curves; switching its Lightness Curve back to
    // Simple writes a per-color override seeded from the range midpoint.
    await colorItem
      .getByRole('tablist', { name: 'Lightness curve mode' })
      .getByRole('tab', { name: 'Simple' })
      .click();

    const lightnessCurveSlider = colorItem.locator('input[name="lightnessCurve"]');

    await expect(lightnessCurveSlider).toHaveValue('1.3');

    await lightnessCurveSlider.focus();
    await page.keyboard.press('PageDown');

    await expect(lightnessCurveSlider).toHaveValue('1.2');
    await expect(page).toHaveURL(hasColorOptions('Tertiary', { f: '1.2' }));

    await page.getByTestId('ColorLockOptions').click();

    await page.getByRole('option', { name: '400', exact: true }).click();

    await expect(page.getByTestId('ColorLockOptions')).toHaveText('400');
    await expect(page).toHaveURL(hasColorOptions('Tertiary', { f: '1.2', k: 400 }));

    await expect(page).toHaveScreenshot(getScreenshotName('color-options.png'));
  });

  await test.step('closes Tertiary color options', async () => {
    const colorItem = page.getByTestId('ColorItem').nth(2);

    await colorItem.getByRole('button', { name: 'Change color options' }).click();

    await expect(colorItem.locator('input[name="lightnessCurve"]')).not.toBeVisible();

    await expect(page).toHaveScreenshot(getScreenshotName('post-color-options.png'));
  });

  await test.step('close sidebar and rename palette', async () => {
    await page.getByRole('button', { name: 'Toggle Sidebar' }).click();

    await expect(page.locator('html')).toHaveAttribute('data-sidebar', 'closed');

    await page.evaluate(() => window.scrollTo(0, 0));

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

    await expect(page.locator('html')).toHaveAttribute('data-palette-options', 'open');

    await expect(page).toHaveScreenshot(getScreenshotName('palette-options.png'));
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

    await expect(page).toHaveScreenshot(getScreenshotName('dark-scale.png'));

    await reversedRadio.click();
    await expect(reversedRadio).toBeChecked();
    // Reverse is non-default, so it surfaces in the query as `m=r`.
    await expect(page).toHaveURL(hasParams({ m: 'r' }));

    await expect(page).toHaveScreenshot(getScreenshotName('reversed-scale.png'));

    await lightRadio.click();
    await expect(lightRadio).toBeChecked();
    // Light is the default, so the param is dropped entirely.
    await expect(page).toHaveURL(lacksParams('m'));
  });

  await test.step('adjusts scale options and updates URL', async () => {
    const paletteOptions = page.getByTestId('PaletteOptions');
    const stepsSlider = page.locator('input[name="steps"]');

    await stepsSlider.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(stepsSlider).toHaveValue('10');
    await expect(page).toHaveURL(hasParams({ i: 10 }));

    await page.getByRole('button', { name: /^select variant/i }).click();
    await page.getByRole('option', { name: 'Neutral' }).click();
    await expect(page).toHaveURL(hasParams({ v: 'neutral' }));

    await expect(page).toHaveScreenshot(getScreenshotName('custom-steps-and-variant.png'));

    await paletteOptions.getByRole('button', { name: 'Reset', exact: true }).click();

    await page.getByRole('switch', { name: 'Apply saturation to all colors' }).click();

    const saturationSlider = page.locator('input[name="saturation"]');

    await saturationSlider.focus();
    await page.keyboard.press('End');
    await expect(saturationSlider).toHaveValue('100');

    // Maxing saturation with the override on writes both o=1 and s=100.
    await expect(page).toHaveURL(hasParams({ o: 1, s: 100 }));

    await expect(page).toHaveScreenshot(getScreenshotName('saturation-override.png'));

    // Reset clears only the palette options (steps/variant/saturation), leaving the curves.
    await paletteOptions.getByRole('button', { name: 'Reset', exact: true }).click();

    await expect(page).toHaveURL(lacksParams('i', 'o', 's', 'v'));
  });

  await test.step('enable lock 500 and switch to grid', async () => {
    await page.getByRole('button', { name: /^select lock/i }).click();

    await page.getByRole('option', { name: '500', exact: true }).click();

    await expect(page.getByRole('button', { name: /^500 lock/i })).toBeVisible();
    await expect(page).toHaveURL(hasParams({ k: 500 }));

    await expect(page).toHaveScreenshot(getScreenshotName('lock-500.png'));
  });

  await test.step('close the palette options', async () => {
    await page.getByRole('button', { name: 'Palette Options' }).click();

    await expect(page.locator('html')).toHaveAttribute('data-palette-options', 'closed');

    await expect(page).toHaveScreenshot(getScreenshotName('post-palette-options.png'));
  });

  await test.step('switch views', async () => {
    await page.getByRole('button', { name: 'Display Options' }).click();

    await expect(page).toHaveScreenshot(getScreenshotName('display-menu.png'));

    await page.getByRole('radio', { name: 'Grid' }).click();

    await expect(page).toHaveScreenshot(getScreenshotName('grid-view.png'));

    // Switch to Preview
    await page.getByRole('button', { name: 'Display Options' }).click();
    await page.getByRole('radio', { name: 'Preview' }).click();

    await expect(page).toHaveScreenshot(getScreenshotName('preview-view.png'));

    // Switch to list
    await page.getByRole('button', { name: 'Display Options' }).click();
    await page.getByRole('radio', { name: 'List' }).click();

    await expect(page).toHaveScreenshot(getScreenshotName('list-view.png'));
  });

  await test.step('opens color charts', async () => {
    await page.getByRole('button', { name: 'View Charts' }).first().click();
    await page.waitForTimeout(collapseDuration);

    await expect(page.getByRole('tab', { name: 'Chroma' })).toBeVisible();

    await expect(page).toHaveScreenshot(getScreenshotName('chroma-chart.png'));

    await page.getByRole('tab', { name: 'Lightness' }).click();

    await expect(page).toHaveScreenshot(getScreenshotName('lightness-chart.png'));

    await page.getByRole('tab', { name: 'Hue' }).click();

    await expect(page).toHaveScreenshot(getScreenshotName('hue-chart.png'));

    await page.getByRole('button', { name: 'View Charts' }).first().click();
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

  await test.step('interacts with the live preview', async () => {
    await page.getByTestId('Preview').evaluate((el, offset) => {
      const top = window.scrollY + el.getBoundingClientRect().top - offset;

      window.scrollTo({ top, behavior: 'instant' });
    }, scrollOffset);

    await expect(page).toHaveScreenshot(getScreenshotName('preview-components.png'));

    const themeToggle = page.getByRole('button', { name: 'Toggle preview theme' });

    await themeToggle.click();

    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot(getScreenshotName('preview-light-theme.png'));

    // cycle back to auto (light -> dark -> auto)
    await themeToggle.click();
    await themeToggle.click();

    await page.getByRole('tab', { name: 'Typography' }).click();
    await expect(page.getByRole('tab', { name: 'Typography' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page).toHaveScreenshot(getScreenshotName('preview-typography.png'));

    await page.getByRole('tab', { name: 'Components' }).click();

    await expect(page.getByTestId('Preview-Controls')).toBeVisible();
    await expect(page.getByTestId('Preview-Typography')).toHaveCount(0);

    await page.getByRole('button', { name: 'Use Secondary as primary' }).click();
    await expect(page.getByRole('button', { name: 'Use Secondary as primary' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await expect(page).toHaveScreenshot(getScreenshotName('preview-secondary.png'));

    await page.getByRole('button', { name: 'Collapse Live preview' }).click();
    await page.waitForTimeout(collapseDuration);
    await expect(page.locator('html')).toHaveAttribute('data-preview', 'closed');

    await page.getByRole('button', { name: 'Expand Live preview' }).click();
    await page.waitForTimeout(collapseDuration);
    await expect(page.locator('html')).toHaveAttribute('data-preview', 'open');
  });

  await test.step('select first color', async () => {
    await page.getByRole('button', { name: 'Select Primary' }).click();

    await page.waitForTimeout(collapseDuration);

    await expect(page).toHaveScreenshot(getScreenshotName('select-primary.png'));
  });

  await test.step('shows toast when clicking swatch to copy', async () => {
    await page.getByRole('button', { name: '500', exact: true }).first().click();

    // Toast may say "copied" or "failed to copy" in headless
    const toast = page.locator('[data-slot="toast"]').or(page.getByRole('alert'));

    await expect(toast.first()).toBeVisible({ timeout: 2000 });

    await expect(page).toHaveScreenshot(getScreenshotName('copy-toast.png'));

    await page.getByLabel('closeButton').click();
    await expect(page.getByLabel('closeButton')).toHaveCount(0);
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

    await expect(page).toHaveScreenshot(getScreenshotName('export-palette.png'));
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

  await test.step('click Share button', async () => {
    await page.getByRole('button', { name: 'Share' }).click();

    // Toast may say "copied" or "failed to copy" in headless
    const toast = page.locator('[data-slot="toast"]').or(page.getByRole('alert'));

    await expect(toast.first()).toBeVisible({ timeout: 2000 });

    await expect(page).toHaveScreenshot(getScreenshotName('share-palette-url.png'));

    await page.getByLabel('closeButton').click();
    await expect(page.getByLabel('closeButton')).toHaveCount(0);
  });

  await test.step('reorders colors to Tertiary first and Primary last', async () => {
    const reorderButton = page.getByRole('button', { name: 'Reorder colors' });

    await reorderButton.scrollIntoViewIfNeeded();
    await reorderButton.click();

    const panel = page.getByTestId('ReorderColors');
    const rows = panel.getByRole('listitem');

    await expect(rows).toHaveCount(3);

    await expect(page).toHaveScreenshot(getScreenshotName('reorder-menu.png'));

    // framer-motion Reorder needs a real pointer gesture: press, a small nudge to start
    // the drag, then a stepped move to the destination edge. Two drags turn
    // [Primary, Secondary, Tertiary] into [Tertiary, Secondary, Primary]: Tertiary up to
    // the top, then Primary down to the bottom.
    async function dragRow(name: string, edge: 'top' | 'bottom') {
      const box = await rows.filter({ hasText: name }).boundingBox();
      const first = await rows.first().boundingBox();
      const last = await rows.last().boundingBox();

      if (!box || !first || !last) {
        throw new Error(`Reorder row "${name}" is not measurable`);
      }

      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const targetY = edge === 'top' ? first.y - 6 : last.y + last.height + 6;

      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX, centerY + Math.sign(targetY - centerY) * 6, { steps: 3 });
      await page.mouse.move(centerX, targetY, { steps: 24 });
      await page.mouse.up();
    }

    await dragRow('Tertiary', 'top');
    await expect(page.locator('input[name="color-name-0"]')).toHaveValue('Tertiary');

    // Let the layout animation settle before measuring rows for the second drag.
    await page.waitForTimeout(collapseDuration);

    await dragRow('Primary', 'bottom');

    // Commit-on-drop reorders the store, re-basing the palette on Tertiary and
    // re-rendering the main list in the new order.
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

    await expect(page).toHaveScreenshot(getScreenshotName('reordered-colors.png'));
  });

  await test.step('removes the Tertiary color with confirmation', async () => {
    await page.getByRole('button', { name: 'Select Tertiary' }).click();

    // Tertiary is first after the reorder above.
    const ColorItem = page.getByTestId('ColorItem').nth(0);

    await expect(ColorItem).toHaveAttribute('aria-current', 'true');

    const removeButton = ColorItem.getByRole('button', { name: 'Remove color' });

    await removeButton.click();
    await page.waitForTimeout(100);

    // Confirm the removal
    await removeButton.click();

    await page.waitForTimeout(collapseDuration);

    // The Tertiary segment is dropped, but the palette identity and global options are kept.
    await expect(page).toHaveURL(lacksColor('Tertiary'));
    await expect(page).toHaveURL(hasColor('Primary'));
    await expect(page).toHaveURL(hasColor('Secondary'));
    await expect(page).toHaveURL(hasParams({ k: 500 }));
    await expect(page).toHaveURL(hasParams({ name: 'My Palette' }));

    await expect(page).toHaveScreenshot(getScreenshotName('remove-tertiary.png'));
  });

  await test.step('removes the Secondary color with confirmation', async () => {
    await page.getByRole('button', { name: 'Select Secondary' }).click();

    // Secondary is first after Tertiary's removal (order is [Secondary, Primary]).
    const ColorItem = page.getByTestId('ColorItem').nth(0);

    await expect(ColorItem).toHaveAttribute('aria-current', 'true');

    const removeButton = ColorItem.getByRole('button', { name: 'Remove color' });

    await removeButton.click();
    await page.waitForTimeout(100);

    // Confirm the removal
    await removeButton.click();

    await page.waitForTimeout(collapseDuration);

    // The Secondary segment is dropped, but the palette identity and global options are kept.
    await expect(page).toHaveURL(lacksColor('Secondary'));
    await expect(page).toHaveURL(hasColor('Primary'));
    await expect(page).toHaveURL(hasParams({ k: 500 }));
    await expect(page).toHaveURL(hasParams({ name: 'My Palette' }));

    await expect(page).toHaveScreenshot(getScreenshotName('remove-secondary.png'));
  });

  await test.step('walks the palette history back and forward', async () => {
    const ColorItem = page.getByTestId('ColorItem');
    // The exact entries the app committed across the flow (see the beforeAll collector).
    const stack = await page.evaluate(
      () => (window as unknown as { __historyStack: string[] }).__historyStack,
    );

    expect(stack.length).toBeGreaterThan(2);
    await expect(page).toHaveURL(url => url.pathname + url.search === stack.at(-1));

    // Mid-walk screenshot checkpoint, derived from the actual stack length so it stays
    // the true middle as steps are added/removed (not a hardcoded step count).
    const middleIndex = Math.floor(stack.length / 2);

    // toHaveURL auto-retries until the popstate-driven hydrate settles, so each nav is paced.
    for (let index = stack.length - 1; index > 0; index--) {
      await page.goBack();
      await expect(page).toHaveURL(url => url.pathname + url.search === stack[index - 1]);

      if (index === middleIndex) {
        await expect(page).toHaveScreenshot(getScreenshotName('history-back-middle.png'));
      }
    }

    await expect(ColorItem).toHaveCount(1);
    await expect(page).toHaveScreenshot(getScreenshotName('history-initial.png'));

    // Regression guard: the History API switch must not clobber forward entries.
    for (let index = 1; index < stack.length; index++) {
      await page.goForward();
      await expect(page).toHaveURL(url => url.pathname + url.search === stack[index]);

      if (index === middleIndex) {
        await expect(page).toHaveScreenshot(getScreenshotName('history-forward-middle.png'));
      }
    }

    await expect(ColorItem).toHaveCount(1);

    // Save the URL so the color-spacing steps can replay it.
    savedColorUrl = page.url();

    await expect(page).toHaveScreenshot(getScreenshotName('history-final.png'));
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
