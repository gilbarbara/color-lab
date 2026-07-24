/* eslint-disable no-restricted-globals */
import { type Browser, type Page } from '@playwright/test';

interface CreatePageOptions {
  /** Collect the history entries the app commits, for the back/forward walk. */
  historyStack?: boolean;
  /**
   * Reduced motion is the harness default: it flattens the CSS transitions and framer tweens
   * the specs would otherwise have to outwait, so timing assertions are about app state rather
   * than animation clocks. basic.spec.ts opts out to keep the animated path covered.
   */
  reducedMotion?: 'no-preference' | 'reduce';
  /** Runs after the init scripts, before the first navigation — for route mocks. */
  setup?: (page: Page) => Promise<void>;
  url: string;
}

export async function createPage(browser: Browser, options: CreatePageOptions): Promise<Page> {
  const { historyStack, reducedMotion = 'reduce', setup, url } = options;
  const page = await browser.newPage();

  // Before the first navigation: the @media block in index.css has to match at first paint.
  await page.emulateMedia({ reducedMotion });

  // Claim P3 support regardless of the host display, so the gamut-dependent UI is
  // deterministic. Every other query — including prefers-reduced-motion, which emulateMedia
  // sets below JS in the renderer, and prefers-color-scheme, which drives next-themes'
  // `system` default — falls through to the real implementation.
  await page.addInitScript(() => {
    const original = window.matchMedia;

    window.matchMedia = (q: string) => {
      if (q === '(color-gamut: p3)') {
        return { ...original.call(window, q), matches: true } as MediaQueryList;
      }

      return original.call(window, q);
    };
  });

  if (historyStack) {
    // Record the history back-stack the app commits (pushState appends, replaceState
    // rewrites) so the back/forward walk can replay the exact sequence. Survives Next's
    // own history patch.
    await page.addInitScript(() => {
      const w = window as unknown as { __historyStack: string[] };

      w.__historyStack = [location.pathname + location.search];

      (['pushState', 'replaceState'] as const).forEach(name => {
        const original = history[name].bind(history);

        history[name] = (data: unknown, unused: string, target?: string | URL | null) => {
          original(data, unused, target);
          const full = location.pathname + location.search;

          if (name === 'pushState') {
            w.__historyStack.push(full);
          } else {
            w.__historyStack[w.__historyStack.length - 1] = full;
          }
        };
      });
    });
  }

  await setup?.(page);

  await page.goto(url);

  return page;
}
