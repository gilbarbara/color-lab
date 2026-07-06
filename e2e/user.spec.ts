import { devices, expect, type Page, test } from '@playwright/test';

import { getParam, waitForScrollEnd } from './__setup__/utils';
import { collapseDuration } from './fixtures/constants';
import { FirebaseMockState, setupFirebaseMocks } from './fixtures/firebase-mock';

let screenshotCount = 0;

function getScreenshotName(name: string) {
  screenshotCount += 1;

  return `${screenshotCount.toString().padStart(3, '0')}-${name}`;
}

let page: Page;
let mockState: FirebaseMockState;

test.use({
  ...devices['Desktop Chrome'],
  viewport: {
    width: 1440,
    height: 810,
  },
});

test.beforeAll(async ({ browser }) => {
  mockState = new FirebaseMockState();
  page = await browser.newPage();

  await setupFirebaseMocks(page, mockState);

  await page.addInitScript(() => {
    const original = window.matchMedia;

    window.matchMedia = (q: string) => {
      if (q === '(color-gamut: p3)') {
        return { ...original.call(window, q), matches: true } as MediaQueryList;
      }

      return original.call(window, q);
    };
  });

  await page.goto('/p/Primary-73.0_0.23001_321');
  // Wait for Firebase auth to finish restoring the (logged-out) session before driving the
  // flow. The Sign In button renders a spinner while auth is loading; clicking during that
  // window races the loading->ready re-render and React Aria drops the press.
  await page.waitForLoadState('networkidle');
});

test.afterAll(async () => {
  await page.close();
});

test('user', async () => {
  let paletteName = `Test-${Date.now()}`;

  await test.step('logs in with credentials', async () => {
    await page.getByTestId('Header').getByRole('button', { name: 'Sign In' }).click();

    await page.getByRole('textbox', { name: 'Email*' }).fill('test@example.com');
    await page.getByRole('textbox', { name: 'Password*' }).fill('password123');

    await page.getByRole('button', { name: 'Login', exact: true }).click();

    await expect(
      page.getByTestId('Header').getByRole('button', { name: 'Sign In' }),
    ).not.toBeVisible({
      timeout: 10000,
    });

    const avatar = page.getByLabel('User Menu');

    await expect(avatar).toBeVisible();

    await expect(page).toHaveScreenshot(getScreenshotName('logged-in.png'));
  });

  await test.step('shows user info in menu', async () => {
    await page.getByLabel('User Menu').click();

    await expect(page.getByRole('menuitem', { name: /test@example.com/i })).toBeVisible();

    await page.keyboard.press('Escape');
  });

  await test.step('render empty palettes', async () => {
    await page.getByRole('link', { name: 'My Palettes' }).click();
    await page.waitForURL(/\/palettes/);

    await expect(page).toHaveScreenshot(getScreenshotName('empty-palettes.png'));

    // Return to the generator so subsequent steps have Add Color etc.
    await page.getByRole('link', { name: /colormeup/i }).click();
    await page.waitForURL(/\/p\//);
  });

  await test.step('logs out user', async () => {
    await page.getByRole('button', { name: 'User Menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign Out' }).click();

    await expect(page.getByTestId('Header').getByRole('button', { name: 'Sign In' })).toBeVisible({
      timeout: 10000,
    });
  });

  await test.step('adds 3 colors to palette', async () => {
    const addButton = page.getByRole('button', { name: 'Add Color' });

    await addButton.click();
    await page.waitForTimeout(collapseDuration);
    await addButton.click();
    await page.waitForTimeout(collapseDuration);
    await addButton.click();
    await page.waitForTimeout(collapseDuration);

    await expect(page.getByLabel('Export scale')).toHaveCount(4);

    await page.evaluate(() => window.scrollTo(0, 0));

    await waitForScrollEnd(page);

    await expect(page).toHaveScreenshot(getScreenshotName('unsaved-palette.png'));
  });

  await test.step('logs back in via Save flow', async () => {
    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByRole('textbox', { name: 'Email*' }).fill('test@example.com');
    await page.getByRole('textbox', { name: 'Password*' }).fill('password123');

    await page.getByRole('button', { name: 'Login', exact: true }).click();

    await expect(
      page.getByTestId('Header').getByRole('button', { name: 'Sign In' }),
    ).not.toBeVisible({
      timeout: 10000,
    });

    const avatar = page.getByLabel('User Menu');

    await expect(avatar).toBeVisible();
  });

  await test.step('saves palette with name', async () => {
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('textbox', { name: 'Name*' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Name*' }).fill(paletteName);

    await page.getByRole('button', { name: 'Save', exact: true }).last().click();

    await expect(page.getByRole('textbox', { name: 'Name*' })).not.toBeVisible();

    expect(mockState.palettes.length).toBe(1);
    expect(mockState.palettes[0].name).toBe(paletteName);

    await expect(page).toHaveScreenshot(getScreenshotName('palette-saved.png'));
  });

  await test.step('navigates to My Palettes', async () => {
    await page.getByRole('link', { name: 'My Palettes' }).click();
    await page.waitForURL(/\/palettes/);

    await expect(page).toHaveScreenshot(getScreenshotName('my-palettes.png'));
  });

  await test.step('shows saved palette', async () => {
    await expect(page.getByText(paletteName)).toBeVisible({ timeout: 10000 });
  });

  await test.step('favorites palette', async () => {
    const favoriteButton = page.getByRole('button', {
      name: `Favorite Palette (${paletteName})`,
    });

    await expect(favoriteButton).toBeVisible({ timeout: 5000 });
    await favoriteButton.click();

    await expect(favoriteButton).toHaveClass(/text-success/, { timeout: 5000 });

    const buttonClass = await favoriteButton.getAttribute('class');

    expect(buttonClass).toContain('text-success');
    expect(mockState.palettes[0].isFavorite).toBe(true);
  });

  await test.step('persists favorite after refresh', async () => {
    await page.reload();
    await page.waitForLoadState('networkidle');

    const unfavoriteButton = page.getByRole('button', {
      name: `Unfavorite Palette (${paletteName})`,
    });

    await expect(unfavoriteButton).toBeVisible({ timeout: 10000 });

    const buttonClass = await unfavoriteButton.getAttribute('class');

    expect(buttonClass).toContain('text-success');
  });

  await test.step('loads palette', async () => {
    const loadLink = page.getByRole('link', { name: `Load Palette (${paletteName})` });

    await expect(loadLink).toBeVisible({ timeout: 5000 });
    await loadLink.click();
    await page.waitForURL(/\/p\//);

    const url = page.url();
    const colorSegments = url.split('/p/')[1]?.split('/') ?? [];

    expect(colorSegments.length).toBe(4);

    const paletteId = getParam(url, 'id');

    expect(paletteId).toBeTruthy();

    await expect(page).toHaveScreenshot(getScreenshotName('loaded-palette.png'));
  });

  await test.step('verifies loaded palette has 4 colors', async () => {
    await expect(page.getByLabel('Export scale')).toHaveCount(4);
  });

  await test.step('renames palette', async () => {
    const nameInput = page.locator('input[name="palette-name"]');

    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue(paletteName);

    const newName = `${paletteName}-renamed`;

    await nameInput.clear();
    await nameInput.fill(newName);
    await nameInput.press('Enter');

    // Naming is decoupled from saving: committing the name updates the store/URL but
    // does not persist. Click Update to write the new name to the saved record.
    const updateButton = page.getByRole('button', { name: 'Update' });

    await expect(updateButton).toBeEnabled();
    await updateButton.click();
    await expect(updateButton).toBeDisabled({ timeout: 5000 });

    expect(mockState.palettes[0].name).toBe(newName);

    // Dismiss the "Palette updated" toast so it doesn't stack with the one from the
    // next step's update (which would break its single-toast closeButton click).
    await page.getByLabel('closeButton').click();
    await expect(page.getByLabel('closeButton')).toHaveCount(0);

    paletteName = newName;
  });

  await test.step('renames colors and persists palette id', async () => {
    const paletteId = getParam(page.url(), 'id');

    expect(paletteId).toBeTruthy();

    const colorNames = ['One', 'Two', 'Three', 'Four'];

    for (const [index, colorName] of colorNames.entries()) {
      const input = page.locator(`input[name="color-name-${index}"]`);

      await input.clear();
      await input.fill(colorName);
      await input.press('Enter');
    }

    const updateButton = page.getByRole('button', { name: 'Update' });

    await expect(updateButton).toBeVisible();
    await expect(updateButton).toBeEnabled();

    await updateButton.click();

    // Button disables when no unsaved changes
    await expect(updateButton).toBeDisabled({ timeout: 5000 });

    await expect(page).toHaveScreenshot(getScreenshotName('updated-palettes.png'));

    await page.getByLabel('closeButton').click();

    await page.getByRole('link', { name: 'My Palettes' }).click();
    await page.waitForURL(/\/palettes/);

    const loadLink = page.getByRole('link', { name: `Load Palette (${paletteName})` });

    await expect(loadLink).toBeVisible({ timeout: 5000 });
    await loadLink.click();
    await page.waitForURL(/\/p\//);

    const newPaletteId = getParam(page.url(), 'id');

    expect(newPaletteId).toBe(paletteId);
  });

  await test.step('deletes the test palette', async () => {
    await page.getByRole('link', { name: 'My Palettes' }).click();
    await page.waitForURL(/\/palettes/);

    await page
      .getByRole('button', {
        name: `Remove Palette (${paletteName})`,
      })
      .click();

    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(
      page.getByRole('link', { name: `Load Palette (${paletteName})` }),
    ).not.toBeVisible();

    expect(mockState.palettes.length).toBe(0);

    await expect(page).toHaveScreenshot(getScreenshotName('clean-palettes.png'));
  });
});
