/**
 * Launch-demo capture: drives the generator through the full feature tour and records a video.
 *
 * This is the *capture* front-end of the pipeline — it produces clean, repeatable footage at a
 * natural pace. Do the final pacing/zoom/captions in Remotion over this footage; don't try to
 * make this script frame-perfect.
 *
 * Run (headed, on your Mac, against the local dev server — best rendering):
 *   pnpm dev                       # in another terminal
 *   node scripts/video-capture/desktop-full.ts
 *
 * Options (env, all read in utils.ts):
 *   BASE_URL   default https://lab.colormeup.co   (use https://color-lab.localhost to hit dev)
 *   HEADLESS   default false                      (set 1 for headless smoke runs)
 *   OUT        default <repo root>/captures
 *   SLOWMO     default 0                          (ms added by Playwright between actions)
 *   TIMEOUT    default 15_000                     (ms, per Playwright action)
 */
import {
  assignGroup,
  dragSlider,
  PACE,
  renameColor,
  runCapture,
  scrollIntoCenter,
  scrollPanelToItem,
  sleep,
  smoothClick,
  stepSlider,
  // Node's ESM resolver requires the real extension — these run via native type stripping.
  // eslint-disable-next-line import-x/extensions
} from './utils.ts';

await runCapture(
  {
    name: 'desktop-full',
    start: process.env.START ?? '/p/Primary-54_0.272_263.1',
  },
  async ({ byRole, page }) => {
    await renameColor(page, 0, 'Brand');
    await assignGroup(page, 'Brand', 'Brand', 'card');

    // two more colors. Add Color is harmony, not random: it rotates the last color's hue by the
    // spacing angle, so the palette stays coherent on screen.
    await smoothClick(byRole('button', 'Add Color'));
    await sleep(PACE.settle);
    await renameColor(page, 1, 'Accent');

    await smoothClick(byRole('button', 'Add Color'));
    await sleep(PACE.settle);

    // the third color is active on add, so its channel sliders are mounted: drag Chroma past 0
    // (the slider clamps) and its whole scale desaturates into a usable neutral.
    await dragSlider(
      page
        .getByTestId('ColorItem')
        .nth(2)
        .getByTestId('ChromaSlider')
        .getByTestId('GradientSliderThumb'),
      -400,
    );

    // Nudge Gray's own chroma curve to 0.1. Nothing visibly changes yet — its base chroma is 0, so
    // any parabola amount still resolves to 0 — but it pins Gray to the *parabola* curve form. The
    // presets applied further down set a global *range* curve, which colorizr treats as absolute
    // (`relativeChroma * maxChroma`, ignoring the base entirely) and would otherwise tint this
    // scale despite the zero base. Gray keeps its override; Brand and Accent take the preset.
    const grayItem = page.getByTestId('ColorItem').nth(2);

    await smoothClick(grayItem.getByRole('button', { name: 'Change color options' }));
    await sleep(PACE.settle);

    // Expanding the card pushes its options below the sidebar's fold without moving the window,
    // so bring the card up before touching them (same reason e2e/scale.spec.ts scrolls the panel).
    await scrollPanelToItem(grayItem);

    // page step: the slider moves by 0.01, so arrows would need ten presses of dead air to reach 0.1
    await stepSlider(grayItem.locator('input[name="chromaAmount"]'), 0.1, { step: 'page' });
    await sleep(PACE.hold);
    await smoothClick(grayItem.getByRole('button', { name: 'Change color options' }));
    await sleep(PACE.nav);

    await renameColor(page, 2, 'Gray');

    // Advanced Options → drag the Lightness Range max thumb down, compressing the light end of
    // the scale → close. Hand-tuning first is deliberate: the preset label below is *derived* from
    // the curve options (getActivePreset), so any slider touched after it would clear the label.
    await smoothClick(byRole('button', 'Advanced Options'));
    await sleep(PACE.settle);
    await dragSlider(
      page
        .getByTestId('ScaleColorOptions')
        .locator('[data-slot="thumb"]:has(input[name="lightness"])')
        .nth(1),
      -50,
    );
    await sleep(PACE.hold);
    await smoothClick(byRole('button', 'Advanced Options'));
    await sleep(PACE.nav);

    // presets, twice: one click re-ramps every curve at once. Showing a second reads as a menu of design systems rather than a single button.
    await smoothClick(byRole('button', 'Apply a preset'));
    await smoothClick(byRole('menuitemradio', 'Tailwind', { exact: true }));
    await sleep(PACE.hold);

    await smoothClick(byRole('button', 'Tailwind')); // trigger takes the active preset's name
    await smoothClick(byRole('menuitemradio', 'Material', { exact: true }));
    await sleep(PACE.hold);

    // Palette Options → lock 500 → steps 10 (skip dark scale) → close.
    // Steps and lock aren't preset keys, so the Material label survives this.
    await smoothClick(byRole('button', 'Palette Options'));
    await sleep(PACE.settle);

    await smoothClick(byRole('button', /^select lock/i));
    await smoothClick(byRole('option', '500', { exact: true }));
    await sleep(PACE.settle);

    await stepSlider(page.locator('input[name="steps"]'), 10); // 11 → 10
    await sleep(PACE.settle);

    await smoothClick(byRole('button', 'Palette Options'));
    await sleep(PACE.nav);

    // tag the other two from their scale rows
    await assignGroup(page, 'Accent', 'Decorative');
    await assignGroup(page, 'Gray', 'Neutral');

    // the filter toolbar only exists once a group is in use. Chips are additive.
    const groupToolbar = page.getByRole('group', { name: 'Filter by color group' });

    await scrollIntoCenter(groupToolbar);
    await smoothClick(groupToolbar.getByRole('button', { name: 'Filter by Brand', exact: true }));
    await sleep(PACE.hold);
    await smoothClick(
      groupToolbar.getByRole('button', { name: 'Filter by Decorative', exact: true }),
    );
    await sleep(PACE.hold);
    await smoothClick(groupToolbar.getByRole('button', { name: 'Clear group filters' }));
    await sleep(PACE.settle);

    // Grid view: the whole palette at once. The popover closes on pick, so reopen it to go back.
    await smoothClick(byRole('button', 'Display Options'));
    await sleep(PACE.settle);
    await smoothClick(byRole('radio', 'Grid', { exact: true }));
    await sleep(PACE.hold);
    await smoothClick(byRole('button', 'Display Options'));
    await smoothClick(byRole('radio', 'List', { exact: true }));
    await sleep(PACE.settle);

    // Brand's Charts → Lightness → Hue → close
    await smoothClick(byRole('button', 'View charts').first());
    await sleep(PACE.hold);
    await smoothClick(byRole('tab', 'Lightness'));
    await sleep(PACE.hold);
    await smoothClick(byRole('tab', 'Hue'));
    await sleep(PACE.hold);
    await smoothClick(byRole('button', 'View charts').first());
    await sleep(PACE.nav);

    // Brand's Color Info (skip the step-700 drill-down) → close
    await smoothClick(byRole('button', 'View color info').first());
    await page.getByRole('columnheader', { name: 'APCA LC' }).waitFor();
    await sleep(PACE.hold);
    await smoothClick(byRole('button', 'Close'));
    await sleep(PACE.nav);

    // Accent's Contrast Grid → WCAG 2 → All → close
    await smoothClick(byRole('button', 'View Contrast Grid').nth(1));
    await page.getByTestId('ContrastGrid-Sidebar').waitFor();
    await sleep(PACE.hold);

    const sidebar = page.getByTestId('ContrastGrid-Sidebar');

    // Both pickers are ToggleGroups (role=radiogroup), not button rows.
    await smoothClick(sidebar.getByRole('radio', { name: 'WCAG 2', exact: true }));
    await sleep(PACE.settle);
    await smoothClick(sidebar.getByRole('radio', { name: 'All', exact: true }));
    await sleep(PACE.hold);

    await smoothClick(byRole('button', 'Close'));
    await sleep(PACE.nav);

    // Accent's View Live Preview — opens + scrolls to the preview. Driven from the scale row,
    // not the sidebar card: the sidebar copy lives inside the active-color Collapse, and the active
    // color here is Gray (last renamed), not Accent.
    await smoothClick(
      page
        .getByRole('group', { name: 'Accent scale' })
        .getByRole('button', { name: 'View Live Preview' }),
    );
    await sleep(PACE.hold);

    // swap the preview's primary color to Brand
    await smoothClick(
      page.getByRole('radiogroup', { name: 'Preview color' }).getByRole('radio', { name: 'Brand' }),
      { sleepMs: 200 },
    );
    await sleep(PACE.hold);

    // scroll back up
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(PACE.settle);

    // Export All → Copy All → hold on the toast
    await smoothClick(byRole('button', 'Export All'));
    await sleep(PACE.hold);
    await smoothClick(byRole('button', /^copy all/i));
    await sleep(PACE.hold);
  },
);
