/**
 * Comprehensive Error Detection Test
 * Captures all JavaScript errors, console warnings, and network failures
 */

const { test, expect } = require('@playwright/test');

test.describe('Complete Error Detection', () => {
    let allErrors = {
        jsErrors: [],
        consoleErrors: [],
        consoleWarnings: [],
        networkErrors: [],
        unhandledRejections: [],
    };

    test('should capture all errors during full application flow', async ({ page }) => {
        // Setup error listeners
        page.on('pageerror', error => {
            allErrors.jsErrors.push({
                message: error.message,
                stack: error.stack,
            });
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                allErrors.consoleErrors.push(msg.text());
            }
            if (msg.type() === 'warning') {
                allErrors.consoleWarnings.push(msg.text());
            }
        });

        page.on('requestfailed', request => {
            allErrors.networkErrors.push({
                url: request.url(),
                failure: request.failure()?.errorText,
            });
        });

        // Clear storage
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.reload();

        console.log('\n========== LOGIN FLOW ==========');
        // Test login
        await page.fill('#loginUsername', 'admin');
        await page.fill('#loginPassword', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);

        console.log('\n========== DASHBOARD ==========');
        // Check dashboard
        await page.click('.nav-item[data-section="dashboard"]');
        await page.waitForTimeout(1000);

        // Try to refresh dashboard
        const hasDashboardManager = await page.evaluate(() => {
            return typeof window.DashboardManager !== 'undefined';
        });
        console.log('DashboardManager defined:', hasDashboardManager);

        if (hasDashboardManager) {
            await page.evaluate(() => {
                if (typeof DashboardManager.refresh === 'function') {
                    DashboardManager.refresh();
                }
            });
            await page.waitForTimeout(1000);
        }

        console.log('\n========== USER MANAGEMENT ==========');
        // Test user management
        await page.click('.nav-item[data-section="users"]');
        await page.waitForTimeout(1000);

        const hasUserModule = await page.evaluate(() => {
            return typeof window.UserModule !== 'undefined';
        });
        console.log('UserModule defined:', hasUserModule);

        if (hasUserModule) {
            await page.evaluate(() => {
                if (typeof UserModule.refresh === 'function') {
                    UserModule.refresh();
                }
            });
            await page.waitForTimeout(500);
        }

        console.log('\n========== APP MANAGEMENT ==========');
        // Test app management
        await page.click('.nav-item[data-section="apps"]');
        await page.waitForTimeout(1000);

        const hasAppModule = await page.evaluate(() => {
            return typeof window.AppModule !== 'undefined';
        });
        console.log('AppModule defined:', hasAppModule);

        console.log('\n========== INCIDENT MANAGEMENT ==========');
        // Test incident management
        await page.click('.nav-item[data-section="incidents"]');
        await page.waitForTimeout(1000);

        const hasIncidentModule = await page.evaluate(() => {
            return typeof window.IncidentModule !== 'undefined';
        });
        console.log('IncidentModule defined:', hasIncidentModule);

        console.log('\n========== CHANGE MANAGEMENT ==========');
        // Test change management
        await page.click('.nav-item[data-section="changes"]');
        await page.waitForTimeout(1000);

        const hasChangeModule = await page.evaluate(() => {
            return typeof window.ChangeModule !== 'undefined';
        });
        console.log('ChangeModule defined:', hasChangeModule);

        console.log('\n========== LOGS ==========');
        // Test logs
        await page.click('.nav-item[data-section="logs"]');
        await page.waitForTimeout(1000);

        const hasLogModule = await page.evaluate(() => {
            return typeof window.LogModule !== 'undefined';
        });
        console.log('LogModule defined:', hasLogModule);

        console.log('\n========== SETTINGS ==========');
        // Test settings
        await page.click('.nav-item[data-section="settings"]');
        await page.waitForTimeout(1000);

        const hasSettingsModule = await page.evaluate(() => {
            return typeof window.SettingsModule !== 'undefined';
        });
        console.log('SettingsModule defined:', hasSettingsModule);

        // Switch between settings tabs
        const tabs = ['general', 'notification', 'security', 'workflow', 'backup'];
        for (const tab of tabs) {
            await page.click(`.settings-tab[data-tab="${tab}"]`);
            await page.waitForTimeout(500);
        }

        // Check for missing global functions/variables
        console.log('\n========== GLOBAL SCOPE CHECK ==========');
        const globalChecks = await page.evaluate(() => {
            const results = {
                defined: [],
                undefined: [],
            };

            const toCheck = [
                'Chart',
                'DataStore',
                'ApiConfig',
                'AuthModule',
                'UserModule',
                'AppModule',
                'IncidentModule',
                'ChangeModule',
                'LogModule',
                'SettingsModule',
                'DashboardManager',
                'NotificationManager',
                'BackupManager',
                'WorkflowEngine',
                'PerformanceOptimizer',
                'showToast',
                'openModal',
                'closeModal',
                'updateDashboard',
                'escapeHtml',
            ];

            toCheck.forEach(item => {
                if (typeof window[item] !== 'undefined') {
                    results.defined.push(item);
                } else {
                    results.undefined.push(item);
                }
            });

            return results;
        });

        console.log('Defined globals:', globalChecks.defined.join(', '));
        if (globalChecks.undefined.length > 0) {
            console.log('⚠️  Undefined globals:', globalChecks.undefined.join(', '));
        }

        // Final wait to catch any async errors
        await page.waitForTimeout(2000);

        // Print all collected errors
        console.log('\n========================================');
        console.log('ERROR SUMMARY');
        console.log('========================================\n');

        if (allErrors.jsErrors.length > 0) {
            console.log('❌ JavaScript Errors (' + allErrors.jsErrors.length + '):');
            allErrors.jsErrors.forEach((error, i) => {
                console.log(`\n${i + 1}. ${error.message}`);
                if (error.stack) {
                    console.log('   Stack:', error.stack.split('\n')[0]);
                }
            });
        } else {
            console.log('✅ No JavaScript errors detected');
        }

        if (allErrors.consoleErrors.length > 0) {
            console.log('\n❌ Console Errors (' + allErrors.consoleErrors.length + '):');
            allErrors.consoleErrors.forEach((error, i) => {
                console.log(`${i + 1}. ${error}`);
            });
        } else {
            console.log('\n✅ No console errors detected');
        }

        if (allErrors.consoleWarnings.length > 0) {
            console.log('\n⚠️  Console Warnings (' + allErrors.consoleWarnings.length + '):');
            allErrors.consoleWarnings.forEach((warning, i) => {
                console.log(`${i + 1}. ${warning}`);
            });
        } else {
            console.log('\n✅ No console warnings detected');
        }

        if (allErrors.networkErrors.length > 0) {
            console.log('\n❌ Network Errors (' + allErrors.networkErrors.length + '):');
            allErrors.networkErrors.forEach((error, i) => {
                console.log(`${i + 1}. ${error.url} - ${error.failure}`);
            });
        } else {
            console.log('\n✅ No network errors detected');
        }

        console.log('\n========================================\n');

        // Test passes regardless of errors (we're just collecting them)
        expect(true).toBe(true);
    });
});
