import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Admin Portal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@test.com', 'Admin123!');
  });

  test('admin can login and see welcome page', async ({ page }) => {
    await expect(page).toHaveURL(/welcome/);

    // Wait for tiles to render (Firebase data may still be loading)
    await page.waitForTimeout(2000);

    // Admin-specific tiles
    await expect(page.getByText('Admin Dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Tryout Evaluations')).toBeVisible();
    await expect(page.getByText('Youth Programs')).toBeVisible();
    await expect(page.getByText('Club Analytics')).toBeVisible();
  });

  test('admin can navigate to admin dashboard', async ({ page }) => {
    await page.getByText('Admin Dashboard').click();
    await expect(page).toHaveURL(/admin|dashboard/);

    // Should see management tiles
    await expect(page.getByText('Roster Management')).toBeVisible();
    await expect(page.getByText('Schedule Management')).toBeVisible();
    await expect(page.getByText('Parent Invitations')).toBeVisible();
    await expect(page.getByText('Data Cleanup')).toBeVisible();
  });

  test('admin can navigate to parent invitations', async ({ page }) => {
    await page.getByText('Admin Dashboard').click();
    await page.waitForURL(/admin|dashboard/, { timeout: 10000 });

    await page.getByText('Parent Invitations').click();
    await expect(page).toHaveURL(/parent-invitations/);

    // Should see the invitation management interface
    await expect(page.getByText(/invite.*parent/i)).toBeVisible({ timeout: 5000 });
  });

  test('admin can navigate to data cleanup', async ({ page }) => {
    await page.getByText('Admin Dashboard').click();
    await page.waitForURL(/admin|dashboard/, { timeout: 10000 });

    await page.getByText('Data Cleanup').click();
    await expect(page).toHaveURL(/data-cleanup/);

    await expect(page.getByRole('button', { name: /scan/i })).toBeVisible();
    await expect(page.getByText('Safe Mode (Dry Run)')).toBeVisible();
  });

  test('admin can navigate to roster management', async ({ page }) => {
    await page.getByText('Admin Dashboard').click();
    await page.waitForURL(/admin|dashboard/, { timeout: 10000 });

    await page.getByText('Roster Management').click();
    await expect(page).toHaveURL(/rosters/);
  });

  test('admin can navigate to schedule management', async ({ page }) => {
    await page.getByText('Admin Dashboard').click();
    await page.waitForURL(/admin|dashboard/, { timeout: 10000 });

    await page.getByText('Schedule Management').click();
    await expect(page).toHaveURL(/schedule/);
  });

  test('admin can logout', async ({ page }) => {
    const logoutBtn = page.getByRole('button', { name: /logout/i });
    await logoutBtn.click();
    await expect(page).toHaveURL(/login/);

    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
  });
});
