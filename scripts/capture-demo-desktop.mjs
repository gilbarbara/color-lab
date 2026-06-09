/* eslint-disable no-undef,no-console */
/**
 * Launch-demo capture: drives the generator through a scripted flow and records a video.
 *
 * This is the *capture* front-end of the pipeline — it produces clean, repeatable footage at a
 * natural pace. Do the final pacing/zoom/captions in Remotion over this footage; don't try to
 * make this script frame-perfect.
 *
 * Run (headed, on your Mac, against the local dev server — best rendering):
 *   pnpm dev                       # in another terminal
 *   node scripts/capture-demo-desktop.mjs
 *
 * Options (env):
 *   BASE_URL   default https://lab.colormeup.co   (use https://color-lab.localhost to hit dev)
 *   HEADLESS   default false                      (set 1 for headless/CI smoke runs)
 *   OUT        default ./captures
 *   SLOWMO     default 0                          (ms added by Playwright between actions)
 *   START      default /p/Primary-54_0.272_263.1
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://lab.colormeup.co';
const HEADLESS = process.env.HEADLESS === '1';
const OUT = process.env.OUT ?? join(process.cwd(), 'captures');
const SLOWMO = Number(process.env.SLOWMO ?? 0);
const START = process.env.START ?? '/p/Primary-54_0.272_263.1';

const VIEWPORT = { width: 1440, height: 810 };

// Dynamic pacing — quick on mechanical nav, long holds on the visual payoffs. Tune freely;
// the final rhythm is better controlled in the edit, this just makes the raw capture watchable.
const PACE = {
  nav: 250, // open/close a panel — mechanical
  action: 450, // a click whose result is small
  settle: 750, // let a state change land before moving on
  hold: 1300, // sit on a payoff (scale morph, grid reveal) so the eye can absorb it
  morph: 300, // between each slider step, so the scale visibly re-renders
  intro: 1000,
  toast: 1000,
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: HEADLESS, slowMo: SLOWMO });
const context = await browser.newContext({
  viewport: VIEWPORT,
  colorScheme: 'dark',
  ignoreHTTPSErrors: true, // self-signed color-lab.localhost
  permissions: ['clipboard-read', 'clipboard-write'], // so Copy All fires its toast
  recordVideo: { dir: OUT, size: VIEWPORT },
});

// Spoof P3 so wide-gamut colors don't clip in headless Chrome (matches the e2e setup).
await context.addInitScript(() => {
  const original = window.matchMedia;

  window.matchMedia = q =>
    q === '(color-gamut: p3)'
      ? { ...original.call(window, q), matches: true }
      : original.call(window, q);
});

// Synthetic cursor: Playwright's recorded video doesn't render the OS pointer, so draw one
// that follows real mouse events (page.mouse.move/click) with a click ripple. Appended on
// `load` (post-hydration) to a node outside the React root so it's never reconciled away.
await context.addInitScript(() => {
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
      background: 'rgba(10,10,10,0.35)',
      border: '2px solid rgba(255,255,255,0.95)',
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
});

const page = await context.newPage();

/** Move the cursor to an element's center in visible steps, then click — readable on video. */
async function smoothClick(locator, { sleepMs = 120, steps = 22 } = {}) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  const box = await locator.boundingBox();

  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
    await sleep(sleepMs);
  }

  await locator.click();
}

/** Park the cursor near an element without clicking (for context before a keyboard interaction). */
async function smoothMove(locator, { steps = 22 } = {}) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  const box = await locator.boundingBox();

  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
  }
}

/**
 * Step a HeroUI slider to a target value with the keyboard, one arrow press at a time so the
 * scale visibly re-renders between steps. Keyboard (not fill()) fires react-aria's onChangeEnd,
 * which the URL sync depends on.
 */
async function stepSlider(name, target) {
  const input = page.locator(`input[name="${name}"]`);

  await input.scrollIntoViewIfNeeded().catch(() => {});
  // Park the cursor on the slider so the change reads as intentional.
  const thumb = page.locator(`[data-slot="thumb"]:near(input[name="${name}"])`).first();

  await smoothMove(thumb).catch(() => {});
  await input.focus();

  const read = async () => parseFloat(await input.inputValue());
  let value = await read();
  let guard = 0;

  while (Math.abs(value - target) > 1e-6 && guard < 50) {
    await page.keyboard.press(value > target ? 'ArrowDown' : 'ArrowUp');
    await sleep(PACE.morph);
    value = await read();
    guard += 1;
  }
}

const byRole = (role, name, extra = {}) => page.getByRole(role, { name, ...extra });

try {
  // 1 — open the seeded palette and let it breathe (load, not networkidle — Sentry/analytics
  // keep the connection busy and stall networkidle for ~10s).
  await page.goto(`${BASE_URL}${START}`, { waitUntil: 'load' });
  await byRole('button', 'Export All').waitFor(); // app rendered
  // await sleep(PACE.intro);

  // 2 — Advanced Options → 4 — Lightness Curve to 1.0 (skip Lightness Range) → 5 — close
  await smoothClick(byRole('button', 'Advanced Options'));
  await sleep(PACE.settle);
  await stepSlider('lightnessCurve', 1.0); // 1.3 → 1.0, scale morphs each press
  await sleep(PACE.settle);
  await smoothClick(byRole('button', 'Advanced Options'));
  await sleep(PACE.nav);

  // 6 — Palette Options → 7 — lock 500 → 8 — steps 10 (skip dark scale) → 11 — close
  await smoothClick(byRole('button', 'Palette Options'));
  await sleep(PACE.settle);

  await smoothClick(byRole('button', /^select lock/i));
  await smoothClick(byRole('option', '500', { exact: true }));
  await sleep(PACE.settle);

  await stepSlider('steps', 10); // 11 → 10
  await sleep(PACE.settle);

  await smoothClick(byRole('button', 'Palette Options'));
  await sleep(PACE.nav);

  // 12 — add a second color
  await smoothClick(byRole('button', 'Add Color'));
  await sleep(PACE.settle);

  // 13 — second color's (sidebar ColorItem) View Live Preview — opens + scrolls to the preview.
  // Scope to ColorItem so we don't hit the scale's per-color preview button.
  await smoothClick(
    page.getByTestId('ColorItem').nth(1).getByRole('button', { name: 'View Live Preview' }),
  );
  await sleep(PACE.hold);

  // 14 — change the preview color to Primary
  await smoothClick(byRole('button', 'Use Primary as primary'), { sleepMs: 200 });
  await sleep(PACE.settle);

  // 15 — scroll back up
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(PACE.settle);

  // 16 — Primary color's Color Info (skip the step-700 drill-down) → 18 — close
  await smoothClick(byRole('button', 'View color info').first());
  await page.getByRole('columnheader', { name: 'APCA LC' }).waitFor();
  await sleep(PACE.hold);
  await smoothClick(byRole('button', 'Close'));
  await sleep(PACE.nav);

  // 19 — Secondary's Contrast Grid → 20 — WCAG 2 → 21 — All → 22 — close
  await smoothClick(byRole('button', 'View Contrast Grid').nth(1));
  await page.getByTestId('ContrastGrid-Sidebar').waitFor();
  await sleep(PACE.hold);

  const sidebar = page.getByTestId('ContrastGrid-Sidebar');

  await smoothClick(sidebar.getByRole('button', { name: 'WCAG 2', exact: true }));
  await sleep(PACE.settle);
  await smoothClick(sidebar.getByRole('button', { name: 'All', exact: true }));
  await sleep(PACE.hold);

  await smoothClick(byRole('button', 'Close'));
  await sleep(PACE.nav);

  // 23 — Export All → 24 — Copy All → 25 — hold on the toast
  await smoothClick(byRole('button', 'Export All'));
  await sleep(PACE.hold);
  await smoothClick(byRole('button', /^copy all/i));
  await sleep(PACE.toast);

  console.log('✓ flow complete');
} catch (error) {
  console.error('✗ flow failed:', error.message);
  process.exitCode = 1;
} finally {
  // Closing the context finalizes the .webm; grab its path first, then rename it.
  const videoPath = await page.video()?.path();

  await context.close();
  await browser.close();

  if (videoPath) {
    const webm = join(OUT, 'demo-desktop.webm');

    renameSync(videoPath, webm);
    console.log(`webm: ${webm}`);

    // Convert to a shareable mp4.
    const mp4 = webm.replace(/\.webm$/, '.mp4');

    try {
      execFileSync(
        'ffmpeg',
        [
          '-y',
          '-i',
          webm,
          '-vf',
          'fps=30,scale=1000:-2',
          '-c:v',
          'libx264',
          '-pix_fmt',
          'yuv420p',
          '-movflags',
          '+faststart',
          mp4,
        ],
        { stdio: 'ignore' },
      );
      console.log(`mp4:   ${mp4}`);
    } catch (error) {
      console.warn('mp4 failed (webm still saved)');
      console.error(error);
    }
  }
}
