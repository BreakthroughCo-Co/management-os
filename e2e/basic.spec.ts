import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Breakthrough Management OS/);
});

test('can navigate to login', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('Sign in to your account')).toBeVisible();
});
