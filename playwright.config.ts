import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
  // Each spec is a single long flow (~30s); give it headroom so slower CI runs
  // don't time out mid-flow. actionTimeout/expect keep individual failures fast.
  timeout: 60000,
  snapshotDir: './e2e/__snapshots__',
  snapshotPathTemplate: '{testDir}/__snapshots__/{testName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.025,
      // Blank the build version in the Footer so version bumps don't churn snapshots.
      stylePath: './e2e/__setup__/screenshot.css',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  use: {
    // Fail fast on wrong locators instead of hanging until the per-test timeout.
    actionTimeout: 10000,
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: process.env.SLO_MO ? Number(process.env.SLO_MO) : 0,
    },
  },
  webServer: {
    command: 'pnpm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
