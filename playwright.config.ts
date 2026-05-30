import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.CI ? 'http://localhost:3000' : 'https://color-lab.localhost';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  // Each spec is a single long flow (~30s); give it headroom so slower CI runs
  // don't time out mid-flow. actionTimeout/expect keep individual failures fast.
  timeout: 60000,
  snapshotDir: './e2e/__snapshots__',
  snapshotPathTemplate: '{testDir}/__snapshots__/{testName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.025,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  use: {
    baseURL,
    // Fail fast on wrong locators instead of hanging until the per-test timeout.
    actionTimeout: 10000,
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: process.env.SLO_MO ? Number(process.env.SLO_MO) : 0,
    },
  },
  webServer: {
    command: process.env.CI ? 'pnpm start' : 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: !process.env.CI,
  },
});
