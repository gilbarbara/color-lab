import { devices, expect, type Page, test } from '@playwright/test';

let page: Page;

test.describe.configure({ mode: 'serial' });
test.use({
  ...devices['Desktop Chrome'],
  viewport: { width: 390, height: 768 },
  isMobile: true,
  hasTouch: true,
});

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();

  await page.goto('/p/Primary-73_0.12745_321');
});

test.afterAll(async () => {
  await page.close();
});

test.describe('Mobile', () => {
  test.describe('Page Load', () => {
    test('should display mobile header elements', async () => {
      await expect(page.getByRole('link', { name: /lab/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /new/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /toggle dark mode/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should have correct page title', async () => {
      await expect(page).toHaveTitle(/colormeup/i);
    });

    test('should encode palette state in URL', async () => {
      await expect(page).toHaveURL(/Primary-73_0\.12745_321/);
    });

    test('should display swatches', async () => {
      await expect(page.getByRole('button', { name: '50', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: '500', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: '950', exact: true })).toBeVisible();
    });
  });

  test.describe('Theme', () => {
    test('should toggle dark mode', async () => {
      const toggleButton = page.getByRole('button', { name: /toggle dark mode/i });

      // Toggle to dark mode
      await toggleButton.click();

      const html = page.locator('html');

      await expect(html).toHaveClass(/dark/);

      // Toggle back to light mode
      await toggleButton.click();

      await expect(html).not.toHaveClass(/dark/);
    });

    test('should persist theme preference', async () => {
      const toggleButton = page.getByRole('button', { name: /toggle dark mode/i });

      // Toggle to dark mode
      await toggleButton.click();

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Dark mode should persist
      const html = page.locator('html');

      await expect(html).toHaveClass(/dark/);
    });
  });

  test.describe('Menu', () => {
    test('should open menu dropdown', async () => {
      await page.getByRole('button', { name: /menu/i }).click();

      await expect(page.getByRole('menuitem', { name: /my palettes/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /about/i })).toBeVisible();

      // Dismiss menu
      await page.keyboard.press('Escape');
    });
  });

  test.describe('Bottom Drawer', () => {
    test('should expand with color controls', async () => {
      const toggleButton = page.getByRole('button', { name: /toggle bottom bar/i });

      await toggleButton.click();

      await expect(page.getByRole('slider', { name: 'Lightness' })).toBeVisible();
      await expect(page.getByRole('slider', { name: 'Chroma' })).toBeVisible();
      await expect(page.getByRole('slider', { name: 'Hue' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add Color' })).toBeVisible();
    });

    test('should modify lightness slider', async () => {
      const lightnessSlider = page.getByRole('slider', { name: 'Lightness' });

      await lightnessSlider.fill('0.6');
      await expect(lightnessSlider).toHaveValue('0.6');
      await expect(page).toHaveURL(/60_/);
    });

    test('should modify chroma slider', async () => {
      const chromaSlider = page.getByRole('slider', { name: 'Chroma' });

      await chromaSlider.fill('0.15');

      const value = await chromaSlider.inputValue();

      expect(parseFloat(value)).toBeGreaterThan(0);
    });

    test('should modify hue slider', async () => {
      const hueSlider = page.getByRole('slider', { name: 'Hue' });

      await hueSlider.fill('200');

      await expect(page).toHaveURL(/200/);
    });

    test('should add a color', async () => {
      const removeButtons = page.getByRole('button', { name: 'Remove color' });

      await expect(removeButtons.first()).toBeDisabled();

      await page.getByRole('button', { name: 'Add Color' }).click();

      await expect(removeButtons).toHaveCount(2);
      await expect(removeButtons.first()).toBeEnabled();
    });

    test('should remove color with confirmation', async () => {
      const removeButtons = page.getByRole('button', { name: 'Remove color' });

      await expect(removeButtons).toHaveCount(2);

      const secondRemove = removeButtons.nth(1);

      await secondRemove.click();
      await secondRemove.click();

      await expect(removeButtons).toHaveCount(1);
    });

    test('should collapse drawer', async () => {
      const toggleButton = page.getByRole('button', { name: /toggle bottom bar/i });

      await toggleButton.click();

      await expect(page.getByRole('slider', { name: 'Lightness' })).not.toBeVisible();
    });
  });

  test.describe('Color Options', () => {
    test('should open color options in drawer', async () => {
      // Expand drawer first
      await page.getByRole('button', { name: /toggle bottom bar/i }).click();
      await expect(page.getByRole('slider', { name: 'Lightness' })).toBeVisible();

      await page.getByRole('button', { name: 'Change color options' }).click();

      const popover = page.locator('[data-slot="content"]').last();

      await expect(popover.getByText(/options for/i)).toBeVisible();
      await expect(popover.getByText('Lightness Curve')).toBeVisible();
      await expect(popover.getByText('Chroma Curve')).toBeVisible();
    });

    test('should close popover with Escape', async () => {
      const popover = page.locator('[data-slot="content"]').last();

      await expect(popover.getByText(/options for/i)).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(popover).not.toBeVisible();
    });

    test('should collapse drawer', async () => {
      const toggleButton = page.getByRole('button', { name: /toggle bottom bar/i });

      await toggleButton.click();

      await expect(page.getByRole('slider', { name: 'Lightness' })).not.toBeVisible();
    });
  });

  test.describe('Palette Options', () => {
    test('should open palette options panel', async () => {
      await page.getByRole('button', { name: 'Palette Options' }).click();

      await expect(page.getByText('Steps')).toBeVisible();
      await expect(page.getByText('Saturation', { exact: true })).toBeVisible();
      await expect(page.getByRole('switch', { name: /light scale/i })).toBeVisible();
    });

    test('should toggle light/dark scale', async () => {
      const scaleSwitch = page.getByRole('switch', { name: /light scale/i });

      await scaleSwitch.click();

      await expect(page.getByRole('switch', { name: /dark scale/i })).toBeVisible();

      // Toggle back
      await page.getByRole('switch', { name: /dark scale/i }).click();
      await expect(page.getByRole('switch', { name: /light scale/i })).toBeVisible();
    });
  });

  test.describe('Export Drawer', () => {
    test('should open with format tabs', async () => {
      await page.getByRole('button', { name: 'Export All' }).click();

      await expect(page.getByRole('tab', { name: 'Tailwind 4' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'CSS', exact: true })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'OKLCH' })).toBeVisible();
      await expect(page.getByRole('tab', { name: /hex/i })).toBeVisible();
    });

    test('should switch between tabs', async () => {
      const cssTab = page.getByRole('tab', { name: 'CSS', exact: true });

      await cssTab.tap();
      await expect(cssTab).toHaveAttribute('aria-selected', 'true');

      const hexTab = page.getByRole('tab', { name: /hex/i });

      await hexTab.tap();
      await expect(hexTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should close modal', async () => {
      await page.getByRole('button', { name: 'Close' }).click();

      await expect(page.getByRole('tab', { name: 'Tailwind 4' })).not.toBeVisible();
    });
  });

  test.describe('Swatch Interaction', () => {
    test('should show toast when copying', async () => {
      await page.getByRole('button', { name: '500', exact: true }).first().click();

      const toast = page.locator('[data-slot="toast"]').or(page.getByRole('alert'));

      await expect(toast.first()).toBeVisible({ timeout: 2000 });
    });

    test('should have color box indicator', async () => {
      await expect(page.getByRole('button', { name: 'Color Box' }).first()).toBeVisible();
    });
  });
});
