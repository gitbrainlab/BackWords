import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'on',
    // Navigate to the app base path
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/journey.spec.ts'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      testMatch: ['**/journey.spec.ts'],
    },
    {
      // Live smoke tests — hit backwords.art directly, no local server needed.
      // Run with: npm run test:live
      name: 'live-smoke',
      use: {
        ...devices['Desktop Chrome'],
        // baseURL unused — tests construct full URLs from SITE constant
      },
      testMatch: ['**/live-smoke.spec.ts'],
      // No webServer: live tests target the deployed site.
    },
    {
      // Live matrix tests — expanded quality coverage: unfeatured words, phrase mode,
      // paragraph mode, all three AI models, and deep UI drill-downs.
      // Intentionally slow/expensive — run deliberately, not in CI smoke tier.
      // Run with: npm run test:matrix
      name: 'live-matrix',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: ['**/live-matrix.spec.ts'],
    },
  ],
  outputDir: 'test-results',
  webServer: {
    command: process.env.CI ? 'npm run preview -- --port 4173' : 'npm run dev',
    url: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // Only start local server for the mock e2e tests, not for live-smoke.
    // Playwright skips webServer when none of the active projects need it
    // (live-smoke uses testMatch isolation above).
  },
})
