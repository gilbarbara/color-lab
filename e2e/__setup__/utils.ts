import { type Page } from '@playwright/test';

type ParamValue = string | number;

/** Read a single query param from a URL string (null when absent). */
export function getParam(url: string, key: string) {
  return new URL(url).searchParams.get(key);
}

/** The path contains a color segment for `name`, optionally with an exact value (L%_C_H). */
export function hasColor(name: string, value?: string) {
  const needle = value ? `${name}-${value}` : `${name}-`;

  return (url: URL) => url.pathname.includes(needle);
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

/** None of the given query params are present. */
export function lacksParams(...keys: string[]) {
  return (url: URL) => keys.every(key => !url.searchParams.has(key));
}

export async function scrollBottomBarToTop(page: Page): Promise<void> {
  // Adding or selecting a color triggers an async scroll-to-color (a rAF gated
  // by collapse animations, and a 500ms timeout when the bar opens). Under load
  // that scroll can fire after a one-shot reset and offset the screenshot. Pin
  // the panel to the top, re-zeroing on any late movement, until it holds for a
  // sustained window so the capture is deterministic.
  await page.getByTestId('GeneratorPanel').evaluate(
    el =>
      new Promise<void>(resolve => {
        const QUIET_FRAMES = 12; // ~200ms of no movement
        const MAX_FRAMES = 180; // ~3s safety cap
        let quiet = 0;
        let frames = 0;

        const tick = () => {
          frames += 1;

          if (el.scrollTop !== 0) {
            el.scrollTop = 0;
            quiet = 0;
          } else {
            quiet += 1;
          }

          if (quiet >= QUIET_FRAMES || frames >= MAX_FRAMES) {
            resolve();
          } else {
            requestAnimationFrame(tick);
          }
        };

        requestAnimationFrame(tick);
      }),
  );
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
