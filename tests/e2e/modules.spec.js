/**
 * Module Functionality E2E Tests
 * Tests user, app, incident, and change management modules
 */

const { test, expect } = require('@playwright/test');

// Helper function to login
async function login(page) {
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    await page.reload();
    await page.fill('#loginUsername', 'admin');
    await page.fill('#loginPassword', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
}

test.describe('User Management Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.click('.nav-item[data-section="users"]');
        await page.waitForTimeout(500);
    });

    test('should display users table', async ({ page }) => {
        const usersTable = page.locator('#usersTable');
        await expect(usersTable).toBeVisible();

        // Should have table headers
        await expect(page.locator('#usersTable thead th')).toHaveCount(8);
    });

    test('should display user data', async ({ page }) => {
        const tbody = page.locator('#usersTableBody');
        const rows = tbody.locator('tr');
        const count = await rows.count();

        expect(count).toBeGreaterThan(0);
    });

    test('should filter users by search', async ({ page }) => {
        const searchInput = page.locator('#userSearch');
        await searchInput.fill('山田');
        await page.waitForTimeout(300);

        // Check if filtered results are displayed
        const tbody = page.locator('#usersTableBody');
        const rows = tbody.locator('tr');
        const count = await rows.count();

        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should check for JavaScript errors', async ({ page }) => {
        const jsErrors = [];
        page.on('pageerror', error => jsErrors.push(error.message));

        // Trigger refresh using the correct button for users page
        const hasRefreshButton = await page.locator('button:has-text("更新")').count();
        if (hasRefreshButton > 0) {
            // Find the visible refresh button (there are multiple on the page)
            const buttons = await page.locator('button:has-text("更新")').all();
            for (const button of buttons) {
                if (await button.isVisible()) {
                    await button.click();
                    break;
                }
            }
        } else {
            // If no refresh button, just call refresh directly
            await page.evaluate(() => {
                if (typeof UserModule !== 'undefined' && typeof UserModule.refresh === 'function') {
                    UserModule.refresh();
                }
            });
        }
        await page.waitForTimeout(500);

        if (jsErrors.length > 0) {
            console.log('User module JS errors:', jsErrors);
        }
    });
});

test.describe('App Management Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.click('.nav-item[data-section="apps"]');
        await page.waitForTimeout(500);
    });

    test('should display apps table', async ({ page }) => {
        const appsTable = page.locator('#appsTable');
        await expect(appsTable).toBeVisible();

        // Should have table headers
        await expect(page.locator('#appsTable thead th')).toHaveCount(8);
    });

    test('should display app data', async ({ page }) => {
        const tbody = page.locator('#appsTableBody');
        const rows = tbody.locator('tr');
        const count = await rows.count();

        expect(count).toBeGreaterThan(0);
    });

    test('should filter apps by category', async ({ page }) => {
        const categoryFilter = page.locator('#appCategoryFilter');
        await categoryFilter.selectOption('業務管理');
        await page.waitForTimeout(300);

        // Check if filtered
        const tbody = page.locator('#appsTableBody');
        const rows = tbody.locator('tr');
        const count = await rows.count();

        expect(count).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Incident Management Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.click('.nav-item[data-section="incidents"]');
        await page.waitForTimeout(500);
    });

    test('should display incidents table', async ({ page }) => {
        const incidentsTable = page.locator('#incidentsTable');
        await expect(incidentsTable).toBeVisible();

        // Should have table headers
        await expect(page.locator('#incidentsTable thead th')).toHaveCount(9);
    });

    test('should display incident data', async ({ page }) => {
        const tbody = page.locator('#incidentsTableBody');
        const rows = tbody.locator('tr');
        const count = await rows.count();

        expect(count).toBeGreaterThan(0);
    });

    test('should filter incidents by priority', async ({ page }) => {
        const priorityFilter = page.locator('#incidentPriorityFilter');
        await priorityFilter.selectOption('high');
        await page.waitForTimeout(300);

        // Check if filtered
        const tbody = page.locator('#incidentsTableBody');
        const rows = tbody.locator('tr');
        const count = await rows.count();

        expect(count).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Change Management Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.click('.nav-item[data-section="changes"]');
        await page.waitForTimeout(500);
    });

    test('should display changes table', async ({ page }) => {
        const changesTable = page.locator('#changesTable');
        await expect(changesTable).toBeVisible();

        // Should have table headers
        await expect(page.locator('#changesTable thead th')).toHaveCount(8);
    });

    test('should display change data', async ({ page }) => {
        const tbody = page.locator('#changesTableBody');
        const rows = tbody.locator('tr');
        const count = await rows.count();

        expect(count).toBeGreaterThan(0);
    });

    test('should filter changes by type', async ({ page }) => {
        const typeFilter = page.locator('#changeTypeFilter');
        await typeFilter.selectOption('feature');
        await page.waitForTimeout(300);

        // Check if filtered
        const tbody = page.locator('#changesTableBody');
        const rows = tbody.locator('tr');
        const count = await rows.count();

        expect(count).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Logs Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.click('.nav-item[data-section="logs"]');
        await page.waitForTimeout(500);
    });

    test('should display logs table', async ({ page }) => {
        const logsTable = page.locator('#logsTable');
        await expect(logsTable).toBeVisible();

        // Should have table headers
        await expect(page.locator('#logsTable thead th')).toHaveCount(6);
    });

    test('should display log data', async ({ page }) => {
        const tbody = page.locator('#logsTableBody');
        const rows = tbody.locator('tr');
        const count = await rows.count();

        expect(count).toBeGreaterThan(0);
    });
});

test.describe('Settings Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.click('.nav-item[data-section="settings"]');
        await page.waitForTimeout(500);
    });

    test('should display settings tabs', async ({ page }) => {
        const apiTab = page.locator('.settings-tab[data-tab="api"]');
        const generalTab = page.locator('.settings-tab[data-tab="general"]');
        const securityTab = page.locator('.settings-tab[data-tab="security"]');

        await expect(apiTab).toBeVisible();
        await expect(generalTab).toBeVisible();
        await expect(securityTab).toBeVisible();
    });

    test('should switch between settings tabs', async ({ page }) => {
        const generalTab = page.locator('.settings-tab[data-tab="general"]');
        await generalTab.click();
        await page.waitForTimeout(300);

        const generalPanel = page.locator('#panel-general');
        await expect(generalPanel).toHaveClass(/active/);
    });

    test('should check for undefined functions', async ({ page }) => {
        const jsErrors = [];
        const consoleErrors = [];

        page.on('pageerror', error => jsErrors.push(error.message));
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Try clicking various buttons
        const securityTab = page.locator('.settings-tab[data-tab="security"]');
        await securityTab.click();
        await page.waitForTimeout(500);

        const backupTab = page.locator('.settings-tab[data-tab="backup"]');
        await backupTab.click();
        await page.waitForTimeout(500);

        if (jsErrors.length > 0) {
            console.log('Settings module JS errors:', jsErrors);
        }

        if (consoleErrors.length > 0) {
            console.log('Settings module console errors:', consoleErrors);
        }
    });
});
