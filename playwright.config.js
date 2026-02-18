// Playwright Configuration for AppSuite ITSM Management System
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 30000,
    expect: {
        timeout: 5000,
    },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 1,
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list'],
        ['json', { outputFile: 'test-results/results.json' }],
    ],
    use: {
        baseURL: 'http://localhost:8888',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 10000,
        navigationTimeout: 10000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npx http-server WebUI-Production -p 8888 --silent',
        port: 8888,
        timeout: 120000,
        reuseExistingServer: !process.env.CI,
    },
});
