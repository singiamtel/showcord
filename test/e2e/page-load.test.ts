import { test, expect } from '@playwright/test';

test('page loads without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');

    // App shell should render — the root grid is always present regardless of connection state
    await expect(page.locator('#root')).toBeAttached();

    // Give the app a moment to initialise and surface any synchronous errors
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(msg =>
        msg.includes('ReferenceError') ||
        msg.includes('TypeError') ||
        msg.includes('SyntaxError')
    );

    expect(criticalErrors, `JS errors on load:\n${criticalErrors.join('\n')}`).toHaveLength(0);
});

test('page renders visible UI', async ({ page }) => {
    await page.goto('/');

    // The app renders a full-screen grid; at least one child element should be visible
    await expect(page.locator('#root > div')).toBeVisible({ timeout: 5000 });
});
