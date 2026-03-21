import { defineConfig, devices } from '@playwright/test';
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
        },
        {
            name: 'mobile-safari',
            use: { ...devices['iPhone 14'] },
        },
    ],
    outputDir: 'test-results',
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
