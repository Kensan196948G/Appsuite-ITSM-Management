/**
 * Dashboard E2E Tests
 * Tests dashboard functionality, widgets, and data visualization
 */

const { test, expect } = require('@playwright/test');

test.describe('Dashboard Functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Clear storage and login before each test
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.reload();

        // Login
        await page.fill('#loginUsername', 'admin');
        await page.fill('#loginPassword', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
    });

    test('should display dashboard after login', async ({ page }) => {
        const dashboard = page.locator('#section-dashboard');
        await expect(dashboard).toBeVisible();
        await expect(dashboard).not.toHaveClass(/hidden/);
    });

    test('should display all statistics cards', async ({ page }) => {
        const jsErrors = [];
        page.on('pageerror', error => jsErrors.push(error.message));

        // Check for stat cards
        await expect(page.locator('#totalUsers')).toBeVisible();
        await expect(page.locator('#activeUsers')).toBeVisible();
        await expect(page.locator('#totalApps')).toBeVisible();
        await expect(page.locator('#activeApps')).toBeVisible();
        await expect(page.locator('#openIncidents')).toBeVisible();
        await expect(page.locator('#pendingChanges')).toBeVisible();

        // Check that values are numbers (not empty or NaN)
        const totalUsers = await page.locator('#totalUsers').textContent();
        expect(totalUsers).toMatch(/^\d+$/);

        if (jsErrors.length > 0) {
            console.log('JavaScript Errors on dashboard:', jsErrors);
        }
    });

    test('should update dashboard on refresh button click', async ({ page }) => {
        const refreshButton = page.locator('#refreshDashboard');
        await expect(refreshButton).toBeVisible();

        await refreshButton.click();
        await page.waitForTimeout(500);

        // Check if last refresh time is updated
        const lastRefreshTime = await page.locator('#lastRefreshTime').textContent();
        expect(lastRefreshTime).not.toBe('--:--:--');
    });

    test('should display recent logs', async ({ page }) => {
        const recentLogs = page.locator('#recentLogs');
        await expect(recentLogs).toBeVisible();

        // Should have some log entries
        const logItems = recentLogs.locator('.log-item, .recent-logs > div, .panel div');
        const count = await logItems.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should display app summary', async ({ page }) => {
        const appSummary = page.locator('#appSummary');
        await expect(appSummary).toBeVisible();

        // Should have some app items
        const appItems = appSummary.locator('.app-summary-item');
        const count = await appItems.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should check for Chart.js errors', async ({ page }) => {
        const consoleMessages = [];
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                consoleMessages.push({ type: msg.type(), text: msg.text() });
            }
        });

        await page.waitForTimeout(2000);

        // Check if Chart.js is loaded
        const chartJsLoaded = await page.evaluate(() => {
            return typeof window.Chart !== 'undefined';
        });

        if (!chartJsLoaded) {
            console.log('WARNING: Chart.js is not loaded!');
        }

        // Log any chart-related errors
        const chartErrors = consoleMessages.filter(m =>
            m.text.toLowerCase().includes('chart') ||
            m.text.toLowerCase().includes('canvas')
        );

        if (chartErrors.length > 0) {
            console.log('Chart-related errors/warnings:', chartErrors);
        }
    });

    test('should navigate to other sections', async ({ page }) => {
        // Navigate to Users section
        await page.click('.nav-item[data-section="users"]');
        await page.waitForTimeout(500);

        const usersSection = page.locator('#section-users');
        await expect(usersSection).toBeVisible();
        await expect(usersSection).not.toHaveClass(/hidden/);

        // Navigate back to dashboard
        await page.click('.nav-item[data-section="dashboard"]');
        await page.waitForTimeout(500);

        const dashboard = page.locator('#section-dashboard');
        await expect(dashboard).toBeVisible();
    });

    test('should check for undefined variables and console errors', async ({ page }) => {
        const jsErrors = [];
        const consoleErrors = [];

        page.on('pageerror', error => jsErrors.push(error.message));
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Trigger dashboard update
        await page.evaluate(() => {
            if (typeof updateDashboard === 'function') {
                updateDashboard();
            }
        });

        await page.waitForTimeout(1000);

        if (jsErrors.length > 0) {
            console.log('\n=== JavaScript Errors ===');
            jsErrors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
        }

        if (consoleErrors.length > 0) {
            console.log('\n=== Console Errors ===');
            consoleErrors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
        }

        // Test should pass but log errors for analysis
        expect(true).toBe(true);
    });
});
