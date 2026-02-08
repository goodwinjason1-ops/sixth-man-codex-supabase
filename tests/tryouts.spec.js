import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Tryout System', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@test.com', 'Admin123!');
  });

  test('admin can navigate to tryout evaluations', async ({ page }) => {
    // Tryout Evaluations tile is on the welcome page for admin
    await page.getByText('Tryout Evaluations').click();
    await expect(page).toHaveURL(/tryouts/, { timeout: 5000 });
  });

  test('tryout page loads without errors', async ({ page }) => {
    await page.getByText('Tryout Evaluations').click();
    await page.waitForURL(/tryouts/, { timeout: 5000 });

    // Should see the tryout sessions page (create button or sessions list)
    await expect(
      page.getByText(/tryout|session|create/i).first()
    ).toBeVisible({ timeout: 5000 });

    // Should NOT show an error boundary message
    await expect(page.getByText('Unable to load')).not.toBeVisible({ timeout: 2000 });
  });

  test('admin can access youth programs', async ({ page }) => {
    await page.getByText('Youth Programs').click();
    await expect(page).toHaveURL(/youth-programs/, { timeout: 5000 });

    // Should load without error
    await expect(page.getByText('Unable to load')).not.toBeVisible({ timeout: 2000 });
  });
});
