/* eslint-disable no-restricted-globals */
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

  // Record the real history back-stack the app commits, mirroring history semantics:
  // pushState appends an entry, replaceState rewrites the current one (e.g. rename). The
  // back/forward step at the end replays this exact sequence — a URL being different on
  // back isn't enough; it must match the URL the app actually produced. Survives Next's own
  // history patch, which delegates to the pushState we install here first.
  await page.addInitScript(() => {
    const w = window as unknown as { __historyStack: string[] };

    w.__historyStack = [location.pathname + location.search];

    (['pushState', 'replaceState'] as const).forEach(name => {
      const original = history[name].bind(history);

      history[name] = (data: unknown, unused: string, url?: string | URL | null) => {
        const result = original(data, unused, url);
        const full = location.pathname + location.search;

        if (name === 'pushState') {
          w.__historyStack.push(full);
        } else {
          w.__historyStack[w.__historyStack.length - 1] = full;
        }

        return result;
      };
    });
  });

  await page.goto('/p/Primary-73.0_0.12745_321');
});

test.afterAll(async () => {
  await page.close();
});

test('desktop', async () => {
  await test.step('displays main elements on initial load', async () => {
    // Header elements
    await expect(page.getByRole('link', { name: /colormeup/i })).toBeVisible();
    await expect(page.getByTestId('NewPalette')).toBeVisible();
    await expect(page.getByRole('button', { name: /toggle dark mode/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Palette area
    await expect(page.getByRole('button', { name: /export all/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();

    await expect(page).toHaveScreenshot('01-initial.png');
  });

  await test.step('has correct page title', async () => {
    await expect(page).toHaveTitle(/color palette generator/i);
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
  });

  await test.step('persists theme preference across reload', async () => {
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  await test.step('modifies color via lightness slider and updates URL', async () => {
    const lightnessSlider = page.getByRole('slider', { exact: true, name: 'Lightness' });

    await expect(lightnessSlider).toHaveValue('0.73');

    await lightnessSlider.fill('0.5');
    await expect(lightnessSlider).toHaveValue('0.5');

    await expect(page).toHaveURL(/50/);
  });

  await test.step('modifies chroma slider', async () => {
    const chromaSlider = page.getByRole('slider', { exact: true, name: 'Chroma' });

    await chromaSlider.fill('0.2');

    // Value may be clamped by gamut limits
    const value = await chromaSlider.inputValue();

    expect(parseFloat(value)).toBeGreaterThan(0);
  });

  await test.step('modifies hue slider', async () => {
    const hueSlider = page.getByRole('slider', { exact: true, name: 'Hue' });

    await hueSlider.fill('180');

    await expect(page).toHaveURL(/180/);
  });

  await test.step('opens export scale drawer', async () => {
    await page.getByLabel('Export scale').click();

    await expect(page.getByRole('tab', { name: 'Tailwind 4' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'OKLCH' })).toBeVisible();

    await expect(page).toHaveScreenshot('03-export-scale.png');

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('tab', { name: 'Tailwind 4' })).not.toBeVisible();
  });

  await test.step('adds a new color', async () => {
    const addColorButton = page.getByRole('button', { name: 'Add Color' });
    const ColorItem = page.getByTestId('ColorItem');

    await expect(ColorItem.first()).toHaveAttribute('aria-current', 'true');

    await addColorButton.click();

    // Wait for Collapse to finish animating
    await page.waitForTimeout(collapseDuration);

    await expect(ColorItem).toHaveCount(2);
    await expect(ColorItem.first()).toHaveAttribute('aria-current', 'false');
    await expect(ColorItem.nth(1)).toHaveAttribute('aria-current', 'true');

    await expect(page).toHaveScreenshot('04-two-colors.png');
  });

  await test.step('opens Advanced Options', async () => {
    await page.getByRole('button', { name: 'Advanced Options' }).click();

    await expect(page.getByTestId('ScaleColorOptions')).toBeVisible();

    // Wait for Collapse to finish animating
    await page.waitForTimeout(collapseDuration);

    await page.getByTestId('GeneratorPanel').evaluate(el => {
      el.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    });

    await expect(page).toHaveScreenshot('05-advanced-options.png');
  });

  await test.step('change global Lightness Curve', async () => {
    const lightnessCurveSlider = page.locator('input[name="lightnessCurve"]');

    await expect(lightnessCurveSlider).toHaveValue('1.3');

    // Drive HeroUI sliders by keyboard, not fill(): fill() fires react-aria's
    // onChange (which sets data-interacting) but never onChangeEnd, so the
    // interaction never releases and useUrlSync stays paused — suppressing all
    // later URL writes (e.g. the rename below). ArrowDown steps 1.3 → 1.2.
    await lightnessCurveSlider.focus();
    await page.keyboard.press('ArrowDown');
    await expect(lightnessCurveSlider).toHaveValue('1.2');

    await page.getByRole('button', { name: 'Advanced Options' }).click();

    await expect(page.getByTestId('ColorOptions')).toHaveAttribute('data-open', 'false');

    await expect(page).toHaveScreenshot('06-post-advanced-color-options.png');
  });

  await test.step('opens color options popover', async () => {
    await page.getByRole('button', { name: 'Change color options' }).click();

    const popover = page.locator('[data-slot="content"]').last();

    const lightnessCurveSlider = popover.locator('input[name="lightnessCurve"]');

    await expect(lightnessCurveSlider).toHaveValue('1.2');

    // Keyboard, not fill() — see the global Lightness Curve step. ArrowUp steps 1.2 → 1.3.
    await lightnessCurveSlider.focus();
    await page.keyboard.press('ArrowUp');
    await expect(lightnessCurveSlider).toHaveValue('1.3');

    await expect(page).toHaveScreenshot('07-color-options.png');
  });

  await test.step('closes color options popover with Escape', async () => {
    const popover = page.locator('[data-slot="content"]').last();

    await expect(popover.getByText(/options for/i)).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(popover).not.toBeVisible();

    await expect(page).toHaveScreenshot('08-post-color-options.png');
  });

  await test.step('renames the palette', async () => {
    const nameInput = page.locator('input[name="palette-name"]');

    await nameInput.clear();
    await nameInput.fill('My Palette');
    await nameInput.press('Enter');

    await expect(nameInput).toHaveValue('My Palette');
    await expect(page).toHaveURL(/name=My\+Palette/);
  });

  await test.step('opens palette options panel', async () => {
    await page.getByRole('button', { name: 'Palette Options' }).click();

    await expect(page).toHaveScreenshot('09-palette-options.png');
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

    await expect(page.getByRole('button', { name: /^500 lock/i })).toBeVisible();

    // Close the panel
    await page.getByRole('button', { name: 'Palette Options' }).click();

    await expect(page).toHaveScreenshot('10-post-palette-options.png');
  });

  await test.step('opens color info', async () => {
    await page.getByRole('button', { name: 'View color info' }).first().click();

    // Wait for modal content
    await expect(page.getByRole('columnheader', { name: 'APCA LC' })).toBeVisible();

    await expect(page).toHaveScreenshot('11-color-info.png');

    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('columnheader', { name: 'APCA LC' })).not.toBeVisible();
  });

  await test.step('opens contrast grid', async () => {
    await page.getByRole('button', { name: 'View Contrast Grid' }).first().click();

    await expect(page.getByRole('button', { name: 'WCAG 3 · APCA' })).toBeVisible();

    await expect(page).toHaveScreenshot('12-contrast-grid.png');

    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('button', { name: 'WCAG 3 · APCA' })).not.toBeVisible();
  });

  await test.step('select first color', async () => {
    await page.getByRole('button', { name: 'Select Primary' }).click();

    // Wait for Collapse animation to settle
    await page.waitForTimeout(collapseDuration);

    await expect(page).toHaveScreenshot('13-select-primary.png');
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

    await expect(page).toHaveScreenshot('14-export-palette.png');
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

  await test.step('removes the second color with confirmation', async () => {
    await page.getByRole('button', { name: 'Select Secondary' }).click();

    const ColorItem = page.getByTestId('ColorItem').nth(1);

    await expect(ColorItem).toHaveAttribute('aria-current', 'true');

    const removeButton = ColorItem.getByRole('button', { name: 'Remove color' });

    await removeButton.click();
    await page.waitForTimeout(100);

    // Confirm the removal
    await removeButton.click();

    // Wait for Collapse re-open animation on the remaining color (~400ms).
    // Without this, the next step clicks while the trigger button is clipped
    // by the still-animating overflow:hidden container, missing the popover.
    await page.waitForTimeout(collapseDuration);

    await expect(page).toHaveScreenshot('15-single-color.png');
  });

  await test.step('walks the palette history back and forward', async () => {
    const ColorItem = page.getByTestId('ColorItem');
    // The exact entries the app committed across the flow (see the beforeAll collector).
    const stack = await page.evaluate(
      () => (window as unknown as { __historyStack: string[] }).__historyStack,
    );

    // Sanity: the recorded top must be where we are now, and there must be a stack to walk.
    expect(stack.length).toBeGreaterThan(2);
    await expect(page).toHaveURL(url => url.pathname + url.search === stack.at(-1));

    // Back: every step must land on the exact prior entry, in order. toHaveURL auto-retries
    // until the popstate-driven hydrate settles, so each nav is paced like a real user.
    for (let index = stack.length - 1; index > 0; index--) {
      await page.goBack();
      await expect(page).toHaveURL(url => url.pathname + url.search === stack[index - 1]);

      if (index === 8) {
        await expect(page).toHaveScreenshot('16-history-back-middle.png');
      }
    }

    // Bottom of the stack is the initial single-color palette.
    await expect(ColorItem).toHaveCount(1);
    await expect(page).toHaveScreenshot('17-history-initial.png');

    // Forward: must walk back up the same entries to where we left off. This is the
    // regression guard — the History API switch must not clobber forward entries.
    for (let index = 1; index < stack.length; index++) {
      await page.goForward();
      await expect(page).toHaveURL(url => url.pathname + url.search === stack[index]);

      if (index === 8) {
        await expect(page).toHaveScreenshot('18-history-forward-middle.png');
      }
    }

    await expect(ColorItem).toHaveCount(1);
    await expect(page).toHaveScreenshot('19-history-final.png');
  });
});
