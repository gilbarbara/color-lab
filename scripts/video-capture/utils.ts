/* eslint-disable no-console */

/**
 * Shared plumbing for the video-capture scenarios.
 *
 * Two conventions, split on whether the helper already has the element:
 *   - **locator-first** (`smoothClick`, `dragSlider`, …) — the page comes from `locator.page()`.
 *   - **page-first** (`renameColor`, `assignGroup`) — the helper builds the locator itself.
 *     This mirrors `e2e/__setup__/utils.ts`, so the two suites read alike.
 *
 * Runs on Node's native type stripping (Node 22.18+/24), so everything here must stay erasable —
 * no enums, no parameter properties, no namespaces — and type imports must use `import type`.
 * Relative imports need the explicit `.ts` extension for the same reason.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

import {
  type Browser,
  type BrowserContext,
  chromium,
  type Locator,
  type Page,
} from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://lab.colormeup.co';
const HEADLESS = process.env.HEADLESS === '1';
const OUT = process.env.OUT ?? join(import.meta.dirname, '../../captures');
const SLOWMO = Number(process.env.SLOWMO ?? 0);
// Everything these scenarios touch is already on screen, so anything slower is a bug, not
// slowness. Playwright's 30s default turned a bad locator into what looked like a hang.
const TIMEOUT = Number(process.env.TIMEOUT ?? 15_000);

const DEFAULT_VIEWPORT = { width: 1440, height: 810 };

/**
 * Dynamic pacing — quick on mechanical nav, long holds on the visual payoffs. Tune freely; the
 * final rhythm is better controlled in the edit, this just makes the raw capture watchable.
 */
export const PACE = {
  nav: 250, // open/close a panel — mechanical
  action: 450, // a click whose result is small
  settle: 750, // let a state change land before moving on
  hold: 1000, // sit on a payoff (scale morph, grid reveal) so the eye can absorb it
  morph: 300, // between each slider step, so the scale visibly re-renders
  drag: 900, // duration of a press-drag sweep, so the scale re-renders across it
  type: 55, // per-character delay when typing a name
} as const;

export interface CaptureContext {
  browser: Browser;
  byRole: (
    role: Parameters<Page['getByRole']>[0],
    name: string | RegExp,
    options?: Parameters<Page['getByRole']>[1],
  ) => Locator;
  context: BrowserContext;
  page: Page;
}

export interface CaptureOptions {
  colorScheme?: 'dark' | 'light';
  /** Names the output file: `${name}.webm`. */
  name: string;
  skipVideo?: boolean;
  /** Path to open, appended to BASE_URL. */
  start: string;
  viewport?: { height: number; width: number };
}

/**
 * Synthetic cursor: Playwright's recorded video doesn't render the OS pointer, so draw one that
 * follows real mouse events (page.mouse.move/click) with a click ripple. Appended on `load`
 * (post-hydration) to a node outside the React root so it's never reconciled away.
 */
function installCursor() {
  window.addEventListener('load', () => {
    const cursor = document.createElement('div');

    Object.assign(cursor.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '20px',
      height: '20px',
      marginLeft: '-10px',
      marginTop: '-10px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.7)',
      border: '2px solid rgba(255,255,255,0.9)',
      boxShadow: '0 1px 5px rgba(0,0,0,0.45)',
      zIndex: '2147483647',
      pointerEvents: 'none',
      transform: 'translate(-100px,-100px)',
      transition: 'transform 0.05s linear',
      willChange: 'transform',
    });
    document.body.appendChild(cursor);

    document.addEventListener(
      'mousemove',
      event => {
        cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
      },
      true,
    );

    document.addEventListener(
      'mousedown',
      event => {
        const ripple = document.createElement('div');

        Object.assign(ripple.style, {
          position: 'fixed',
          left: `${event.clientX}px`,
          top: `${event.clientY}px`,
          width: '16px',
          height: '16px',
          marginLeft: '-8px',
          marginTop: '-8px',
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.9)',
          zIndex: '2147483647',
          pointerEvents: 'none',
        });
        document.body.appendChild(ripple);
        ripple
          .animate(
            [
              { transform: 'scale(1)', opacity: 1 },
              { transform: 'scale(3.2)', opacity: 0 },
            ],
            { duration: 450, easing: 'ease-out' },
          )
          .finished.then(() => ripple.remove())
          .catch(() => {});
      },
      true,
    );
  });
}

/** Closing the context finalizes the .webm; grab its path first, then rename it. */
async function saveVideo(name: string, videoPath: string) {
  const webm = join(OUT, `${name}.webm`);

  renameSync(videoPath, webm);
  console.log(`webm: ${webm}`);

  const mp4 = webm.replace(/\.webm$/, '.mp4');

  try {
    execFileSync(
      'ffmpeg',
      // prettier-ignore
      [
        '-y',
        '-i', webm,
        '-vf', 'fps=30',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        mp4,
      ],
      { stdio: 'ignore' },
    );
    console.log(`mp4:  ${mp4}`);
  } catch (error) {
    console.warn('mp4 failed (webm still saved)');
    console.error(error);
  }
}

/**
 * Scroll an element into view, but only when it isn't already fully on screen.
 *
 * `scrollIntoViewIfNeeded` walks *every* scrollable ancestor, so calling it unconditionally jogs
 * the sidebar's own scroll container even when the target is plainly visible — a visible jump on
 * video, most obvious on the per-color chroma slider. Measuring first keeps the scroll for the
 * cases that need it and leaves the frame alone otherwise.
 *
 * Failure is tolerated but never silent: three chained `.catch(() => {})` calls used to burn a
 * full timeout each with no output. The probe uses a short timeout of its own so a missing element
 * fails fast at `boundingBox()`/`click()` with a useful message instead of stacking timeouts here.
 */
async function scrollIntoView(locator: Locator, label: string) {
  const isOnScreen = await locator
    .evaluate(
      node => {
        const { bottom, left, right, top } = node.getBoundingClientRect();

        return top >= 0 && left >= 0 && bottom <= window.innerHeight && right <= window.innerWidth;
      },
      undefined,
      { timeout: 1000 },
    )
    .catch(() => null);

  // `null` means we couldn't measure it at all — leave the real error to the caller's next step.
  if (isOnScreen !== false) {
    return;
  }

  await locator.scrollIntoViewIfNeeded().catch((error: Error) => {
    console.warn(`  ! ${label}: scrollIntoView failed — ${error.message.split('\n')[0]}`);
  });
}

/**
 * Tag a color with a color group. The menu is mounted in two places: on the palette scale row
 * (always), and on the sidebar card (only while that color is active, since it lives inside the
 * Collapse). `group` must match the menu item's label exactly — `Brand`, not `brand`.
 */
export async function assignGroup(
  page: Page,
  colorName: string,
  group: string,
  source: 'card' | 'scale' = 'scale',
) {
  const row = page.getByRole('group', {
    name: `${colorName} ${source === 'card' ? 'settings' : 'scale'}`,
  });
  const trigger = row.getByRole('button', { name: `Color group for ${colorName}` });

  if (source === 'scale') {
    // The menu is anchored to its trigger, so it has to be settled in view before opening.
    await scrollIntoCenter(trigger);
  }

  await smoothClick(trigger);
  await sleep(PACE.action);
  await smoothClick(page.getByRole('menuitemradio', { name: group, exact: true }));
  await sleep(PACE.settle);
}

/**
 * Press-drag a slider thumb by a pixel delta, sweeping in visible steps so the scale morphs live
 * instead of snapping. A real pointer gesture is also the only correct way to drive these: it sets
 * `data-interacting`, which pauses `useUrlSync` until release, so the drag flushes exactly one
 * history entry. Overshoot the delta to pin a slider at its min/max — both implementations clamp.
 */
export async function dragSlider(
  thumb: Locator,
  deltaX: number,
  { steps = 26 }: { steps?: number } = {},
) {
  await scrollIntoView(thumb, 'dragSlider');
  const box = await thumb.boundingBox();

  if (!box) {
    // Returning quietly here yields footage that looks fine and is missing the whole beat.
    throw new Error(`dragSlider: no bounding box for ${thumb}`);
  }

  const page = thumb.page();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y, { steps: 16 });
  await page.mouse.down();
  await page.mouse.move(x + deltaX, y, { steps });
  await sleep(PACE.drag);
  await page.mouse.up();
}

/**
 * Rename a color in the sidebar. The card swallows the first click on an inactive ColorItem to
 * activate itself (onClickCapture in ColorItem), so the input needs a second click to take focus.
 */
export async function renameColor(page: Page, index: number, name: string) {
  const input = page.locator(`input[name="color-name-${index}"]`);

  await smoothClick(input);
  await sleep(PACE.action);
  await input.click();
  await input.press('ControlOrMeta+a');
  await input.pressSequentially(name, { delay: PACE.type });
  await input.press('Enter');
  await sleep(PACE.settle);
}

/**
 * Own everything around a scenario: browser, context, cursor, the seeded navigation, and the
 * video finalize. A scenario passes its beats and nothing else.
 *
 * Animations stay ON here, unlike the e2e suite (`e2e/__setup__/page.ts` runs under
 * `reducedMotion: 'reduce'`) — the morphs are the point of the footage.
 */
export async function runCapture(
  options: CaptureOptions,
  flow: (context_: CaptureContext) => Promise<void>,
) {
  const {
    colorScheme = 'dark',
    name,
    skipVideo = false,
    start,
    viewport = DEFAULT_VIEWPORT,
  } = options;

  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: HEADLESS, slowMo: SLOWMO });
  const context = await browser.newContext({
    viewport,
    colorScheme,
    ignoreHTTPSErrors: true, // self-signed color-lab.localhost
    permissions: ['clipboard-read', 'clipboard-write'], // so Copy All fires its toast
    recordVideo: !skipVideo ? { dir: OUT, size: viewport } : undefined,
  });

  await context.addInitScript(installCursor);

  const page = await context.newPage();

  page.setDefaultTimeout(TIMEOUT);

  const byRole: CaptureContext['byRole'] = (role, name_, roleOptions = {}) =>
    page.getByRole(role, { name: name_, ...roleOptions });

  try {
    // `load`, not `networkidle` — Sentry/analytics keep the connection busy and stall
    // networkidle for ~10s.
    await page.goto(`${BASE_URL}${start}`, { waitUntil: 'load' });
    await byRole('button', 'Export All').waitFor(); // app rendered

    await flow({ browser, byRole, context, page });

    console.log('✓ flow complete');

    if (!skipVideo) {
      const videoPath = await page.video()?.path();

      await context.close();

      if (videoPath) {
        await saveVideo(name, videoPath);
      }
    }
  } catch (error) {
    console.error('✗ flow failed:', (error as Error).message);
    process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
}

/** Center an element in the viewport — `scrollIntoViewIfNeeded` can leave it under the sticky header. */
export async function scrollIntoCenter(locator: Locator) {
  await locator.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  await sleep(PACE.settle);
}

/**
 * Bring a sidebar card to the top of the sidebar's own scroll container.
 *
 * The sidebar scrolls independently of the window (`GeneratorPanel`), so expanding a card's
 * options pushes the new controls below the fold without the window ever moving. Left alone, the
 * next `scrollIntoView` has to move the panel itself mid-interaction, which reads as a jump.
 * Same fix `e2e/scale.spec.ts` applies via `scrollPanelTo` — smooth here, instant there, since
 * that suite is comparing screenshots and this one is shooting video.
 *
 * Call it *after* the Collapse has finished expanding, or `offsetTop` is read mid-animation.
 */
export async function scrollPanelToItem(item: Locator) {
  const top = await item.evaluate(node => (node as HTMLElement).offsetTop);

  await item
    .page()
    .getByTestId('GeneratorPanel')
    .evaluate((node, scrollTop) => {
      node.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }, top - 16);
}

export function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/** Move the cursor to an element's center in visible steps, then click — readable on video. */
export async function smoothClick(
  locator: Locator,
  { sleepMs = 120, steps = 22 }: { sleepMs?: number; steps?: number } = {},
) {
  await scrollIntoView(locator, 'smoothClick');
  const box = await locator.boundingBox();

  if (box) {
    await locator.page().mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
    await sleep(sleepMs);
  }

  await locator.click();
}

/** Park the cursor near an element without clicking (for context before a keyboard interaction). */
export async function smoothMove(locator: Locator, { steps = 22 }: { steps?: number } = {}) {
  await scrollIntoView(locator, 'smoothMove');
  const box = await locator.boundingBox();

  if (box) {
    await locator.page().mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
  }
}

/**
 * Step a HeroUI slider to a target value with the keyboard, one press at a time so the scale
 * visibly re-renders between steps. Keyboard (not fill()) fires react-aria's onChangeEnd, which
 * the URL sync depends on.
 *
 * `step: 'page'` uses PageUp/PageDown, which react-aria sizes at 10% of the range — one press
 * where arrows would need ten. Use it when the slider's own step is fine-grained (chroma curve
 * steps by 0.01, so reaching 0.1 costs ten arrow presses of dead air) and skip it when the arrow
 * step already matches the move.
 *
 * Takes the input Locator rather than a name so it also works scoped to a per-color panel.
 */
export async function stepSlider(
  input: Locator,
  target: number,
  { step = 'arrow' }: { step?: 'arrow' | 'page' } = {},
) {
  const page = input.page();
  const [up, down] = step === 'page' ? ['PageUp', 'PageDown'] : ['ArrowUp', 'ArrowDown'];
  // HeroUI nests the real input inside its own `[data-slot="thumb"]`, so walk up from the input
  // rather than searching the page. A page-wide `:near()` + `.first()` lookup silently grabbed the
  // *collapsed* Advanced Options panel's matching slider — it stays mounted when closed, parked at
  // the top of the sidebar — and flung the cursor up there mid-interaction.
  const thumb = input.locator('xpath=ancestor::div[@data-slot="thumb"][1]');

  await scrollIntoView(input, 'stepSlider');
  // Park the cursor on the slider so the change reads as intentional.
  await smoothMove(thumb);
  await input.focus();

  const read = async () => parseFloat(await input.inputValue());
  let value = await read();
  let guard = 0;

  while (Math.abs(value - target) > 1e-6 && guard < 50) {
    const before = value;

    await page.keyboard.press(value > target ? down : up);
    await sleep(PACE.morph);
    value = await read();
    guard += 1;

    // A coarse step can straddle the target, and a slider at its clamp stops moving. Either way,
    // stop — otherwise the loop oscillates or idles until the guard trips.
    if (value === before || Math.sign(value - target) !== Math.sign(before - target)) {
      break;
    }
  }
}
