import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Coach Portal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'coach@test.com', 'Coach123!');
  });

  test('coach can login successfully', async ({ page }) => {
    // Coach may be on /welcome or auto-redirected to match-day assessment
    // (if there's a game scheduled today, coach gets redirected)
    await expect(page).toHaveURL(/welcome|dashboard|coach|match/);

    // Verify we're authenticated by checking for logout button
    await page.goto('/welcome');
    // The page may redirect to match-day assessment; that's OK
    await page.waitForTimeout(3000);

    // Check we're still authenticated (not bounced to /login)
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  test('coach does NOT see admin tiles on welcome page', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForTimeout(2000);

    // Admin-only items should not be visible to coaches
    await expect(page.getByText('Admin Dashboard')).not.toBeVisible();
    await expect(page.getByText('Parent Invitations')).not.toBeVisible();
    await expect(page.getByText('Data Cleanup')).not.toBeVisible();
  });

  test('coach can navigate to dashboard', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForTimeout(1000);

    await page.getByText('Coach Dashboard').click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // The dashboard page should load (could show Match Day or regular view)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('coach can navigate to my players', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForTimeout(1000);

    await page.getByText('My Players').click();
    await page.waitForTimeout(3000);

    // Should see some player/team data
    await expect(page.locator('body')).toContainText(/U10|U12|U14|U16|player|roster/i, { timeout: 5000 });
  });

  test('coach can logout', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForTimeout(1000);

    const logoutBtn = page.getByRole('button', { name: /logout/i });
    await logoutBtn.click();
    await expect(page).toHaveURL(/login/);
  });
});
