import { devices, expect, type Page, test } from '@playwright/test';

let page: Page;

test.describe.configure({ mode: 'serial' });
test.use({ ...devices['Desktop Chrome'] });

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

  await page.goto('/p/Primary-73.0_0.12745_321');
});

test.afterAll(async () => {
  await page.close();
});

test.describe('Desktop', () => {
  test.describe('Page Load', () => {
    test('should display all main elements on initial load', async () => {
      // Header elements
      await expect(page.getByRole('link', { name: /lab/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /new palette/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /toggle dark mode/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

      // Palette area
      await expect(page.getByRole('button', { name: /export all/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /save/i })).toBeVisible();

      // Swatches
      await expect(page.getByRole('button', { name: '50', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: '500', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: '950', exact: true })).toBeVisible();
    });

    test('should have correct page title', async () => {
      await expect(page).toHaveTitle(/colormeup/i);
    });

    test('should encode palette state in URL', async () => {
      await expect(page).toHaveURL(/Primary-73_0\.127_321/);
    });
  });

  test.describe('Theme', () => {
    test('should toggle dark mode', async () => {
      const toggleButton = page.getByRole('button', { name: /toggle dark mode/i });

      // Toggle to dark mode
      await toggleButton.click();

      // Check that dark mode is applied
      const html = page.locator('html');

      await expect(html).toHaveClass(/dark/);

      // Toggle back to light mode
      await toggleButton.click();

      await expect(html).not.toHaveClass(/dark/);
    });

    test('should persist theme preference', async () => {
      await page.reload();
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

  test.describe('Color Controls', () => {
    test('should modify color via sliders and update URL', async () => {
      const lightnessSlider = page.getByRole('slider', { name: 'Lightness' });

      // Verify initial value
      await expect(lightnessSlider).toHaveValue('0.73');

      // Change lightness
      await lightnessSlider.fill('0.5');
      await expect(lightnessSlider).toHaveValue('0.5');

      // URL should update
      await expect(page).toHaveURL(/50/);
    });

    test('should modify chroma slider', async () => {
      const chromaSlider = page.getByRole('slider', { name: 'Chroma' });

      await chromaSlider.fill('0.2');

      // Value may be clamped by gamut limits
      const value = await chromaSlider.inputValue();

      expect(parseFloat(value)).toBeGreaterThan(0);
    });

    test('should modify hue slider', async () => {
      const hueSlider = page.getByRole('slider', { name: 'Hue' });

      await hueSlider.fill('180');

      await expect(page).toHaveURL(/180/);
    });

    test('should add a new color', async () => {
      const addColorButton = page.getByRole('button', { name: 'Add Color' });
      const removeButtons = page.getByRole('button', { name: 'Remove color' });

      // Initially one color (remove button disabled)
      await expect(removeButtons.first()).toBeDisabled();

      // Add color
      await addColorButton.click();

      // Now two colors (remove buttons enabled)
      await expect(removeButtons).toHaveCount(2);
      await expect(removeButtons.first()).toBeEnabled();
    });

    test('should remove a color with confirmation', async () => {
      const removeButtons = page.getByRole('button', { name: 'Remove color' });

      await expect(removeButtons).toHaveCount(2);

      // Click remove on second color - first click shows confirmation
      const secondRemove = removeButtons.nth(1);

      await secondRemove.click();

      // Second click within 2 seconds confirms removal
      await secondRemove.click();

      // Back to one color
      await expect(removeButtons).toHaveCount(1);

      // Wait for Collapse re-open animation on the remaining color (~400ms).
      // Without this, the next test clicks while the trigger button is clipped
      // by the still-animating overflow:hidden container, missing the popover.
      await page.waitForTimeout(500);
    });
  });

  test.describe('Color Options Popover', () => {
    test('should open color options popover', async () => {
      await page.getByRole('button', { name: 'Change color options' }).click();

      // Verify popover content - look for title that includes color name
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

    test('should have reset buttons for each option', async () => {
      await page.getByRole('button', { name: 'Change color options' }).click();

      // Look for reset buttons (may be disabled by default)
      const resetButtons = page.getByRole('button', { name: /reset.*to default/i });

      await expect(resetButtons.first()).toBeVisible();
    });
  });

  test.describe('Palette Options Panel', () => {
    test('should open palette options panel', async () => {
      await page.getByRole('button', { name: 'Palette Options' }).click();

      // Verify panel content
      await expect(page.getByText('Steps')).toBeVisible();
      await expect(page.getByText('Saturation', { exact: true })).toBeVisible();
      await expect(page.getByRole('switch', { name: /light scale/i })).toBeVisible();
    });

    test('should toggle light/dark scale', async () => {
      const scaleSwitch = page.getByRole('switch', { name: /light scale/i });

      await expect(scaleSwitch).toBeVisible();

      // Toggle to dark scale
      await scaleSwitch.click();

      // Switch label should change to "Dark scale"
      await expect(page.getByRole('switch', { name: /dark scale/i })).toBeVisible();

      // Toggle back
      await page.getByRole('switch', { name: /dark scale/i }).click();
      await expect(page.getByRole('switch', { name: /light scale/i })).toBeVisible();
    });

    test('should have saturation controls', async () => {
      await expect(
        page.getByRole('switch', { name: /apply saturation to all colors/i }),
      ).toBeVisible();
    });
  });

  test.describe('Export Drawer', () => {
    test('should open export drawer with format tabs', async () => {
      await page.getByRole('button', { name: 'Export All' }).click();

      // Verify format tabs
      await expect(page.getByRole('tab', { name: 'Tailwind 4' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Tailwind 3' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'CSS', exact: true })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'SCSS', exact: true })).toBeVisible();
      await expect(page.getByRole('tab', { name: /svg/i })).toBeVisible();

      // Verify color format tabs
      await expect(page.getByRole('tab', { name: 'OKLCH' })).toBeVisible();
      await expect(page.getByRole('tab', { name: /hex/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'HSL' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'RGB' })).toBeVisible();
    });

    test('should switch between format tabs', async () => {
      // Switch to CSS
      await page.getByRole('tab', { name: 'CSS', exact: true }).click();
      await expect(page.getByRole('tab', { name: 'CSS', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      // Switch to Hex
      await page.getByRole('tab', { name: /hex/i }).click();
      await expect(page.getByRole('tab', { name: /hex/i })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    test('should have copy buttons', async () => {
      await expect(page.getByRole('button', { name: /copy all/i })).toBeVisible();
    });

    test('should close modal', async () => {
      // Close with button
      await page.getByRole('button', { name: 'Close' }).click();

      // Modal should be gone
      await expect(page.getByRole('tab', { name: 'Tailwind 4' })).not.toBeVisible();
    });
  });

  test.describe('Swatch Interaction', () => {
    test('should display all swatches', async () => {
      const swatchLabels = [
        '50',
        '100',
        '200',
        '300',
        '400',
        '500',
        '600',
        '700',
        '800',
        '900',
        '950',
      ];

      for (const label of swatchLabels) {
        await expect(page.getByRole('button', { name: label, exact: true }).first()).toBeVisible();
      }
    });

    test('should show toast when clicking swatch to copy', async () => {
      // Click on swatch 500
      await page.getByRole('button', { name: '500', exact: true }).first().click();

      // Toast should appear (may say "copied" or "failed to copy" in headless)
      const toast = page.locator('[data-slot="toast"]').or(page.getByRole('alert'));

      await expect(toast.first()).toBeVisible({ timeout: 2000 });
    });

    test('should have color box indicator', async () => {
      await expect(page.getByLabel('Color Box').first()).toBeVisible();
    });
  });
});
