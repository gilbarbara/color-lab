import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  snapshotDir: './e2e/__snapshots__',
  snapshotPathTemplate: '{testDir}/__snapshots__/{testName}/{arg}{ext}',
  expect: {
    timeout: 10000, // 10s for assertions
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
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: process.env.SLO_MO ? Number(process.env.SLO_MO) : 0,
    },
  },
  webServer: {
    command: 'pnpm dev:e2e',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
