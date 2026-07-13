import { expect, type Page } from '@playwright/test';

import { collapseDuration } from './constants';

type ParamValue = string | number;

/** Options map for the path segment named `name` (empty when the color or options are absent). */
function parseColorOptions(url: URL, name: string): Record<string, string> {
  const segment = url.pathname.split('/').find(part => part.startsWith(`${name}-`));
  const last = segment?.split('-').at(-1) ?? '';

  if (!last.includes(':')) {
    return {};
  }

  return Object.fromEntries(last.split(',').map(pair => pair.split(':') as [string, string]));
}

export async function closeToast(page: Page) {
  await page.getByLabel('closeButton').click();
  await expect(page.getByLabel('closeButton')).toHaveCount(0);
}

/**
 * Numbered screenshot names (`001-initial.png`), so the baseline directory reads in flow order.
 * One namer per spec.
 */
export function createScreenshotNamer() {
  let count = 0;

  return (name: string) => {
    count += 1;

    return `${count.toString().padStart(3, '0')}-${name}`;
  };
}

/**
 * Drag a row in the Reorder panel to the top or bottom edge.
 *
 * framer-motion's Reorder needs a real pointer gesture: press, a small nudge to start the
 * drag, then a stepped move to the destination. fill()/dispatchEvent won't start it.
 */
export async function dragReorderRow(page: Page, name: string, edge: 'bottom' | 'top') {
  const rows = page.getByTestId('ReorderColors').getByRole('listitem');
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

/** The toast is asserted loosely: in headless it may say "copied" or "failed to copy". */
export async function expectToast(page: Page) {
  const toast = page.locator('[data-slot="toast"]').or(page.getByRole('alert'));

  await expect(toast.first()).toBeVisible({ timeout: 2000 });
}

/** Read a single query param from a URL string (null when absent). */
export function getParam(url: string, key: string) {
  return new URL(url).searchParams.get(key);
}

/** The path contains a color segment for `name`, optionally with an exact value (L%_C_H). */
export function hasColor(name: string, value?: string) {
  const needle = value ? `${name}-${value}` : `${name}-`;

  return (url: URL) => url.pathname.includes(needle);
}

/** The color segment for `name` carries each given path option (short key:value). Extra allowed. */
export function hasColorOptions(name: string, expected: Record<string, ParamValue>) {
  return (url: URL) => {
    const options = parseColorOptions(url, name);

    return Object.entries(expected).every(([key, value]) => options[key] === String(value));
  };
}

/** The query contains exactly these params — no more, no less — with matching values. */
export function hasExactParams(expected: Record<string, ParamValue>) {
  return (url: URL) =>
    [...url.searchParams.keys()].length === Object.keys(expected).length &&
    hasParams(expected)(url);
}

/** No query string at all. */
export function hasNoQuery() {
  return (url: URL) => url.search === '';
}

/** Each given query param equals (exactly) its expected value. Extra params allowed. */
export function hasParams(expected: Record<string, ParamValue>) {
  return (url: URL) =>
    Object.entries(expected).every(([key, value]) => url.searchParams.get(key) === String(value));
}

/** The path contains no color segment named `name`. */
export function lacksColor(name: string) {
  return (url: URL) => !url.pathname.includes(`${name}-`);
}

/** The color segment for `name` carries none of the given path option keys. */
export function lacksColorOptions(name: string, ...keys: string[]) {
  return (url: URL) => {
    const options = parseColorOptions(url, name);

    return keys.every(key => !(key in options));
  };
}

/** None of the given query params are present. */
export function lacksParams(...keys: string[]) {
  return (url: URL) => keys.every(key => !url.searchParams.has(key));
}

/** Remove a color. The button is a click-again-to-confirm control. */
export async function removeColor(page: Page, index: number) {
  const removeButton = page
    .getByTestId('ColorItem')
    .nth(index)
    .getByRole('button', { name: /^remove .* color$/i });

  await removeButton.click();
  await page.waitForTimeout(100);
  await removeButton.click();
  await page.waitForTimeout(collapseDuration);
}

/** Scroll the generator panel (the sidebar's own scroll container, not the window). */
export async function scrollPanelTo(page: Page, top: number) {
  await page.getByTestId('GeneratorPanel').evaluate((el, scrollTop) => {
    el.scrollTo({ top: scrollTop, behavior: 'instant' });
  }, top);
}

export async function scrollPanelToTop(page: Page): Promise<void> {
  // Adding a color re-activates the new color, which closes the previously active
  // color's Collapse and opens the new one. The scroll-to-color is gated behind
  // those collapse animations, then runs a 400ms tween on the panel's scrollTop.
  // During the collapse phase the panel is still at the top, so waiting only for
  // stillness can resolve *before* the deferred scroll starts — it then fires into
  // the screenshot. Pin the panel to the top (re-zeroing on any movement, which
  // also absorbs the tween's trailing sub-pixel writes), but only accept the quiet
  // streak once we've actually observed the scroll move, so we can't exit in the
  // gap before it begins.
  await page.getByTestId('GeneratorPanel').evaluate(
    el =>
      new Promise<void>(resolve => {
        const QUIET_FRAMES = 12; // ~200ms of no movement
        const MAX_FRAMES = 240; // ~4s safety cap
        let quiet = 0;
        let frames = 0;
        let moved = false;

        const tick = () => {
          frames += 1;

          if (el.scrollTop !== 0) {
            el.scrollTop = 0;
            quiet = 0;
            moved = true;
          } else {
            quiet += 1;
          }

          if ((moved && quiet >= QUIET_FRAMES) || frames >= MAX_FRAMES) {
            resolve();
          } else {
            requestAnimationFrame(tick);
          }
        };

        requestAnimationFrame(tick);
      }),
  );
}

/**
 * Assign (or clear, with `None`) a color's group from the palette's Scale row or the
 * sidebar's color card — the two surfaces ColorGroupMenu renders on.
 *
 * The trigger is scrolled into view *before* the menu opens: the open menu is anchored to the
 * trigger, so a scroll underneath it re-positions it every frame and the click never lands.
 * The menu itself is portaled to the body, so its items can't be scoped to the container.
 */
export async function setColorGroup(
  page: Page,
  name: string,
  group: 'Brand' | 'Decorative' | 'Neutral' | 'None' | 'Semantic',
  surface: 'card' | 'scale' = 'scale',
) {
  const container = page.getByRole('group', {
    name: `${name} ${surface === 'card' ? 'settings' : 'scale'}`,
  });
  const trigger = container.getByRole('button', { name: 'Color group' });

  await trigger.scrollIntoViewIfNeeded();
  await waitForScrollEnd(page);
  await trigger.click();

  const item = page.getByRole('menuitemradio', { name: group, exact: true });

  await expect(item).toBeVisible();
  await item.click();
  await expect(page.getByRole('menu')).toBeHidden();
}

export function waitForScrollEnd(page: Page, containerSelector?: string) {
  return page.waitForFunction((selector: string | undefined) => {
    return new Promise(resolve => {
      const getPositions = () => [
        document.scrollingElement?.scrollTop ?? 0,
        selector ? (document.querySelector(selector)?.scrollTop ?? 0) : 0,
      ];

      let stableCount = 0;
      let last = [-1, -1];

      const check = () => {
        const pos = getPositions();

        if (pos[0] === last[0] && pos[1] === last[1]) {
          stableCount++;

          if (stableCount >= 3) {
            resolve(true);

            return;
          }
        } else {
          stableCount = 0;
        }

        last = pos;
        setTimeout(check, 100);
      };

      setTimeout(check, 400);
    });
  }, containerSelector);
}
