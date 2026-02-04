/**
 * Login E2E Tests
 * Tests authentication flow, error handling, and session management
 */

const { test, expect } = require('@playwright/test');

test.describe('Login Functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Clear storage before each test
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.reload();
    });

    test('should display login modal on initial load', async ({ page }) => {
        await page.goto('/');

        // Check if login modal is visible
        const loginModal = page.locator('#loginModal');
        await expect(loginModal).toHaveClass(/active/);

        // Check for required form elements
        await expect(page.locator('#loginUsername')).toBeVisible();
        await expect(page.locator('#loginPassword')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should successfully login with admin credentials', async ({ page, context }) => {
        await page.goto('/');

        // Collect console messages
        const consoleMessages = [];
        page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));

        // Collect JS errors
        const jsErrors = [];
        page.on('pageerror', error => jsErrors.push(error.message));

        // Fill in login form
        await page.fill('#loginUsername', 'admin');
        await page.fill('#loginPassword', 'admin123');

        // Submit form
        await page.click('button[type="submit"]');

        // Wait for login to complete
        await page.waitForTimeout(1000);

        // Check if login modal is hidden
        const loginModal = page.locator('#loginModal');
        await expect(loginModal).not.toHaveClass(/active/);

        // Check if user is displayed in header
        const currentUser = page.locator('#currentUser');
        await expect(currentUser).toContainText('admin');

        // Check if dashboard is visible
        const dashboard = page.locator('#section-dashboard');
        await expect(dashboard).not.toHaveClass(/hidden/);

        // Verify session storage
        const session = await page.evaluate(() => {
            return sessionStorage.getItem('appsuite_session');
        });
        expect(session).toBeTruthy();

        // Log any JavaScript errors
        if (jsErrors.length > 0) {
            console.log('JavaScript Errors during login:', jsErrors);
        }

        // Log console errors
        const errors = consoleMessages.filter(m => m.type === 'error');
        if (errors.length > 0) {
            console.log('Console Errors during login:', errors);
        }
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.goto('/');

        await page.fill('#loginUsername', 'wronguser');
        await page.fill('#loginPassword', 'wrongpass');
        await page.click('button[type="submit"]');

        // Wait for error message
        await page.waitForTimeout(500);

        const errorElement = page.locator('#loginError');
        await expect(errorElement).toContainText(/ユーザー名またはパスワードが正しくありません/);

        // Login modal should still be visible
        const loginModal = page.locator('#loginModal');
        await expect(loginModal).toHaveClass(/active/);
    });

    test('should show error with empty credentials', async ({ page }) => {
        await page.goto('/');

        // Try to submit without filling anything
        await page.click('button[type="submit"]');

        // HTML5 validation should prevent submission
        const usernameValidity = await page.locator('#loginUsername').evaluate(el => el.validity.valid);
        expect(usernameValidity).toBe(false);
    });

    test('should toggle password visibility', async ({ page }) => {
        await page.goto('/');

        const passwordInput = page.locator('#loginPassword');
        const toggleButton = page.locator('.password-toggle');

        // Initially password type
        await expect(passwordInput).toHaveAttribute('type', 'password');

        // Click toggle button
        await toggleButton.click();

        // Should become text type
        await expect(passwordInput).toHaveAttribute('type', 'text');

        // Click again to hide
        await toggleButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should handle account lockout after multiple failed attempts', async ({ page }) => {
        await page.goto('/');

        // Try to login 5 times with wrong password
        for (let i = 0; i < 5; i++) {
            await page.fill('#loginUsername', 'admin');
            await page.fill('#loginPassword', 'wrongpassword');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(300);
        }

        // 6th attempt should show lockout message
        await page.fill('#loginUsername', 'admin');
        await page.fill('#loginPassword', 'wrongpassword');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(300);

        const errorElement = page.locator('#loginError');
        await expect(errorElement).toContainText(/アカウントがロックされています/);
    });

    test('should persist session after page reload', async ({ page }) => {
        await page.goto('/');

        // Login
        await page.fill('#loginUsername', 'admin');
        await page.fill('#loginPassword', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);

        // Reload page
        await page.reload();

        // Should still be logged in
        const loginModal = page.locator('#loginModal');
        await expect(loginModal).not.toHaveClass(/active/);

        const currentUser = page.locator('#currentUser');
        await expect(currentUser).toContainText('admin');
    });

    test('should successfully logout', async ({ page }) => {
        await page.goto('/');

        // Login first
        await page.fill('#loginUsername', 'admin');
        await page.fill('#loginPassword', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);

        // Click logout button
        await page.click('.logout-btn');
        await page.waitForTimeout(500);

        // Should show login modal again
        const loginModal = page.locator('#loginModal');
        await expect(loginModal).toHaveClass(/active/);

        // Session should be cleared
        const session = await page.evaluate(() => {
            return sessionStorage.getItem('appsuite_session');
        });
        expect(session).toBeFalsy();
    });
});
