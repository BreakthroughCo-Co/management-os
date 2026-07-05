import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('allows login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Simulate filling out the form
    await page.fill('input[type="email"]', 'admin@breakthrough.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit login
    await page.click('button:has-text("Sign In")');
    
    // Check if redirected to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});
