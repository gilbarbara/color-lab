/* eslint-disable no-undef,no-console */
/**
 * Launch-demo capture (MOBILE): drives the generator on an iPhone-sized touch device and
 * records a video. Mobile-specific vs the desktop script:
 *   - iPhone 12 Pro device (390×844, touch/isMobile)
 *   - editing controls live in a bottom bar you toggle open/closed
 *   - interactions are taps (no cursor) → a tap-ripple indicator instead of a mouse cursor
 *
 * Capture clean footage at a natural pace; do zoom/captions/final pacing in Remotion.
 *
 * Run (headed, local dev — best rendering):
 *   pnpm dev
 *   node scripts/capture-demo-mobile.mjs
 *
 * Options (env): BASE_URL, HEADLESS, OUT, SLOWMO, START — same as the desktop script.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

import { chromium, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://lab.colormeup.co';
const HEADLESS = process.env.HEADLESS === '1';
const OUT = process.env.OUT ?? join(process.cwd(), 'captures');
const SLOWMO = Number(process.env.SLOWMO ?? 0);
const START = process.env.START ?? '/p/Primary-54_0.272_263.1';

const VIEWPORT = { width: 390, height: 844 };

const PACE = {
  nav: 250,
  action: 450,
  settle: 750,
  hold: 1300,
  morph: 300,
  intro: 1000,
  toast: 1000,
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: HEADLESS, slowMo: SLOWMO });
const context = await browser.newContext({
  ...devices['iPhone 12 Pro'], // touch + isMobile + mobile UA + DPR
  viewport: VIEWPORT, // override the device default height to match e2e (844)
  colorScheme: 'dark',
  ignoreHTTPSErrors: true,
  permissions: ['clipboard-read', 'clipboard-write'],
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

// Tap ripple: there's no cursor on touch, so draw an expanding ring at each tap point so the
// interaction reads on video. Appended on `load` to a node outside the React root.
await context.addInitScript(() => {
  window.addEventListener('load', () => {
    document.addEventListener(
      'pointerdown',
      event => {
        const ripple = document.createElement('div');

        Object.assign(ripple.style, {
          position: 'fixed',
          left: `${event.clientX}px`,
          top: `${event.clientY}px`,
          width: '44px',
          height: '44px',
          marginLeft: '-22px',
          marginTop: '-22px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.22)',
          border: '2px solid rgba(255,255,255,0.95)',
          zIndex: '2147483647',
          pointerEvents: 'none',
        });
        document.body.appendChild(ripple);
        ripple
          .animate(
            [
              { transform: 'scale(0.4)', opacity: 0.9 },
              { transform: 'scale(1)', opacity: 0 },
            ],
            { duration: 500, easing: 'ease-out' },
          )
          .finished.then(() => ripple.remove())
          .catch(() => {});
      },
      true,
    );
  });
});

const page = await context.newPage();

const byRole = (role, name, extra = {}) => page.getByRole(role, { name, ...extra });

/** Tap an element (touch), scrolling it into view first. */
async function tap(locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await locator.tap();
}

/** Pin the bottom-bar panel scroll to the top — adding/selecting colors auto-scrolls it. */
const pinBarTop = () =>
  page
    .getByTestId('GeneratorPanel')
    .evaluate(
      el =>
        new Promise(resolve => {
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

            if (quiet >= 12 || frames >= 180) resolve();
            else requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
        }),
    )
    .catch(() => {});

/** Step a HeroUI slider to a target with the keyboard (fill() breaks react-aria's onChangeEnd). */
async function stepSlider(name, target) {
  const input = page.locator(`input[name="${name}"]`);

  await input.scrollIntoViewIfNeeded().catch(() => {});
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

const toggleBar = () => tap(byRole('button', /toggle bottom bar/i));

try {
  // 1 — open the seeded palette, let it breathe
  await page.goto(`${BASE_URL}${START}`, { waitUntil: 'load' });
  await byRole('button', 'Export All').waitFor();
  await sleep(PACE.action);

  // 2 — open the bottom bar (mobile editing controls live here)
  await toggleBar();
  await sleep(PACE.nav);

  // 3 — Advanced Options → Lightness Curve to 1.0 → close
  await tap(byRole('button', 'Advanced Options'));
  await page.getByTestId('ScaleColorOptions').waitFor();
  await pinBarTop();
  await sleep(PACE.nav);
  await stepSlider('lightnessCurve', 1.0); // 1.3 → 1.0, scale morphs each press
  await sleep(PACE.settle);
  await tap(byRole('button', 'Advanced Options'));
  await sleep(PACE.nav);

  // 4 — add a second color
  await tap(byRole('button', 'Add Color'));
  await sleep(PACE.hold);

  // 5 — second color's View Live Preview (lives in the open bottom bar). On mobile this button
  // also closes the bar and scrolls to the preview, so no explicit toggle/scroll-up is needed.
  await tap(
    page.getByTestId('ColorItem').nth(1).getByRole('button', { name: 'View Live Preview' }),
  );
  await sleep(PACE.hold);

  // 6 — change the preview color to Primary
  await tap(byRole('button', 'Use Primary as primary'));
  await sleep(PACE.hold);

  // 7 — scroll back up to the palette
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(PACE.settle);

  // 8 — Palette Options → lock 500 → steps 10 → close  (bar already closed by step 5)
  await tap(byRole('button', 'Palette Options'));
  await sleep(PACE.nav);
  await tap(byRole('button', /^select lock/i));
  await tap(byRole('option', '500', { exact: true }));
  await sleep(PACE.settle);
  await stepSlider('steps', 10); // 11 → 10
  await sleep(PACE.settle);
  await tap(byRole('button', 'Palette Options'));
  await sleep(PACE.settle);

  // 9 — Color Info (Primary) → close
  await tap(byRole('button', 'View color info').first());
  await page.getByRole('columnheader', { name: 'APCA LC' }).waitFor();
  await sleep(PACE.hold);
  await tap(byRole('button', 'Close'));
  await sleep(PACE.settle);

  // 10 — Secondary's Contrast Grid → WCAG 2 → All → close
  await tap(byRole('button', 'View Contrast Grid').nth(1));
  await page.getByTestId('ContrastGrid-Sidebar').waitFor();
  await sleep(PACE.hold);

  const sidebar = page.getByTestId('ContrastGrid-Sidebar');

  await tap(sidebar.getByRole('button', { name: 'WCAG 2', exact: true }));
  await sleep(PACE.settle);
  await tap(sidebar.getByRole('button', { name: 'All', exact: true }));
  await sleep(PACE.hold);
  await tap(byRole('button', 'Close'));
  await sleep(PACE.settle);

  // 11 — scroll back up to the palette
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(PACE.settle);

  // 12 — Export All → Copy All → hold on the toast
  await tap(byRole('button', 'Export All'));
  await sleep(PACE.hold);
  await tap(byRole('button', /^copy all/i));
  await sleep(PACE.toast);

  console.log('✓ flow complete');
} catch (error) {
  console.error('✗ flow failed:', error.message);
  process.exitCode = 1;
} finally {
  const videoPath = await page.video()?.path();

  await context.close();
  await browser.close();

  if (videoPath) {
    const webm = join(OUT, 'demo-mobile.webm');

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
