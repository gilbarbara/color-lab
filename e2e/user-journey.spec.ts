import { devices, expect, type Page, test } from '@playwright/test';

import { FirebaseMockState, setupFirebaseMocks } from './fixtures/firebase-mock';

let page: Page;
let mockState: FirebaseMockState;
let paletteName = `Test-${Date.now()}`;

test.describe.configure({ mode: 'serial' });
test.use({ ...devices['Desktop Chrome'] });

test.beforeAll(async ({ browser }) => {
  mockState = new FirebaseMockState();
  page = await browser.newPage();
  await setupFirebaseMocks(page, mockState);
  await page.goto('/');
});

test.afterAll(async () => {
  await page.close();
});

test.describe('User Journey', () => {
  test.describe('Authentication', () => {
    test('should login with credentials', async () => {
      await page.getByRole('button', { name: 'Sign In' }).click();

      await page.getByRole('textbox', { name: 'Email*' }).fill('test@example.com');
      await page.getByRole('textbox', { name: 'Password*' }).fill('password123');

      await page.getByRole('button', { name: 'Login', exact: true }).click();

      await expect(page.getByRole('button', { name: 'Sign In' })).not.toBeVisible({
        timeout: 10000,
      });

      // Avatar shows user menu button
      const avatar = page.getByLabel('User Menu');

      await expect(avatar).toBeVisible();
    });

    test('should show user info in menu', async () => {
      await page.getByLabel('User Menu').click();

      await expect(page.getByRole('menuitem', { name: /test@example.com/i })).toBeVisible();

      await page.keyboard.press('Escape');
    });

    test('should logout user', async () => {
      await page.getByRole('button', { name: 'User Menu' }).click();
      await page.getByRole('menuitem', { name: 'Sign Out' }).click();

      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Palette Creation', () => {
    test('should add 3 colors to palette', async () => {
      const addButton = page.getByRole('button', { name: 'Add Color' });

      await addButton.click();
      await addButton.click();
      await addButton.click();

      await expect(page.getByLabel('Export scale')).toHaveCount(4);
    });

    test('should login with credentials', async () => {
      await page.getByRole('button', { name: 'Save' }).click();

      await page.getByRole('textbox', { name: 'Email*' }).fill('test@example.com');
      await page.getByRole('textbox', { name: 'Password*' }).fill('password123');

      await page.getByRole('button', { name: 'Login', exact: true }).click();

      await expect(page.getByRole('button', { name: 'Sign In' })).not.toBeVisible({
        timeout: 10000,
      });

      // Avatar shows user menu button
      const avatar = page.getByLabel('User Menu');

      await expect(avatar).toBeVisible();
    });
  });

  test.describe('Palette Management', () => {
    test('should save palette with name', async () => {
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByRole('textbox', { name: 'Name*' })).toBeVisible();
      await page.getByRole('textbox', { name: 'Name*' }).fill(paletteName);

      await page.getByRole('button', { name: 'Save', exact: true }).last().click();

      await expect(page.getByRole('textbox', { name: 'Name*' })).not.toBeVisible();

      expect(mockState.palettes.length).toBe(1);
      expect(mockState.palettes[0].name).toBe(paletteName);
    });

    test('should navigate to My Palettes', async () => {
      await page.getByRole('link', { name: 'My Palettes' }).click();
      await page.waitForURL(/\/palettes/);
    });

    test('should show saved palette', async () => {
      await expect(page.getByText(paletteName)).toBeVisible({ timeout: 10000 });
    });

    test('should favorite palette', async () => {
      const favoriteButton = page.getByRole('button', {
        name: `Favorite Palette (${paletteName})`,
      });

      await expect(favoriteButton).toBeVisible({ timeout: 5000 });
      await favoriteButton.click();

      // Wait for favorite state to update
      await expect(favoriteButton).toHaveClass(/text-success/, { timeout: 5000 });

      const buttonClass = await favoriteButton.getAttribute('class');

      expect(buttonClass).toContain('text-success');
      expect(mockState.palettes[0].isFavorite).toBe(true);
    });

    test('should persist favorite after refresh', async () => {
      await page.reload();
      await page.waitForLoadState('networkidle');

      const unfavoriteButton = page.getByRole('button', {
        name: `Unfavorite Palette (${paletteName})`,
      });

      await expect(unfavoriteButton).toBeVisible({ timeout: 10000 });

      const buttonClass = await unfavoriteButton.getAttribute('class');

      expect(buttonClass).toContain('text-success');
    });

    test('should load palette', async () => {
      const loadLink = page.getByRole('link', { name: `Load Palette (${paletteName})` });

      await expect(loadLink).toBeVisible({ timeout: 5000 });
      await loadLink.click();
      await page.waitForURL(/\/p\//);

      const url = page.url();
      const colorSegments = url.split('/p/')[1]?.split('/') ?? [];

      expect(colorSegments.length).toBe(4);

      // Verify palette ID is in URL
      const urlObject = new URL(url);
      const paletteId = urlObject.searchParams.get('id');

      expect(paletteId).toBeTruthy();
    });

    test('should verify loaded palette has 4 colors', async () => {
      await expect(page.getByLabel('Export scale')).toHaveCount(4);
    });

    test('should rename palette', async () => {
      // HeroUI Input wraps the actual input element
      const paletteHeader = page.locator('[data-testid="PaletteHeader"]');
      const nameInput = paletteHeader.locator('input');

      await expect(nameInput).toBeVisible();
      await expect(nameInput).toHaveValue(paletteName);

      // Clear and enter new name
      const newName = `${paletteName}-renamed`;

      await nameInput.clear();
      await nameInput.fill(newName);
      await nameInput.press('Enter');

      // Verify mock state updated
      expect(mockState.palettes[0].name).toBe(newName);

      // Update variable for subsequent tests
      paletteName = newName;
    });

    test('should rename colors and persist palette id', async () => {
      // Store the initial palette ID
      const initialUrl = page.url();
      const initialUrlObject = new URL(initialUrl);
      const paletteId = initialUrlObject.searchParams.get('id');

      expect(paletteId).toBeTruthy();

      // Rename colors to One, Two, Three, Four
      const colorNames = ['One', 'Two', 'Three', 'Four'];

      for (const [index, colorName] of colorNames.entries()) {
        const input = page.locator(`input[name="color-name-${index}"]`);

        await input.clear();
        await input.fill(colorName);
        await input.press('Enter');
      }

      // Verify Update button is active (not disabled)
      const updateButton = page.getByRole('button', { name: 'Update' });

      await expect(updateButton).toBeVisible();
      await expect(updateButton).toBeEnabled();

      // Click Update
      await updateButton.click();

      // Wait for save to complete (button becomes disabled when no unsaved changes)
      await expect(updateButton).toBeDisabled({ timeout: 5000 });

      // Navigate to My Palettes
      await page.getByRole('link', { name: 'My Palettes' }).click();
      await page.waitForURL(/\/palettes/);

      // Load the palette again
      const loadLink = page.getByRole('link', { name: `Load Palette (${paletteName})` });

      await expect(loadLink).toBeVisible({ timeout: 5000 });
      await loadLink.click();
      await page.waitForURL(/\/p\//);

      // Verify the palette ID persists
      const newUrl = page.url();
      const newUrlObject = new URL(newUrl);
      const newPaletteId = newUrlObject.searchParams.get('id');

      expect(newPaletteId).toBe(paletteId);
    });
  });

  test.describe('Cleanup', () => {
    test('should delete the test palette', async () => {
      await page.getByRole('link', { name: 'My Palettes' }).click();
      await page.waitForURL(/\/palettes/);

      const removeButton = page.getByRole('button', {
        name: `Remove Palette (${paletteName})`,
      });

      await expect(removeButton).toBeVisible({ timeout: 10000 });
      await removeButton.click();

      await page.getByRole('button', { name: 'Confirm' }).click();

      await expect(
        page.getByRole('link', { name: `Load Palette (${paletteName})` }),
      ).not.toBeVisible();

      expect(mockState.palettes.length).toBe(0);
    });
  });
});
