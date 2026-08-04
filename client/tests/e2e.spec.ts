import { test, expect } from '@playwright/test';

test.describe('FinSight AI E2E Test Suite', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('FinSight AI');
  });

  test('should allow user login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alex.morgan@finsight.ai');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });
});
