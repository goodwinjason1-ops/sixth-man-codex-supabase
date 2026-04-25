import { test, expect } from '@playwright/test';
import { login, logout } from './helpers.js';

test.describe('Parent Invitation System', () => {
  test('admin can create a parent invitation', async ({ page }) => {
    await login(page, 'admin@test.com', 'Admin123!');

    // Navigate directly to the invitation workflow.
    await page.goto('/admin/parent-invitations');
    await page.waitForURL(/parent-invitations/, { timeout: 5000 });

    // Search for a player to invite parent for
    const searchBox = page.getByPlaceholder(/search.*player/i);
    await searchBox.waitFor({ state: 'visible', timeout: 5000 });
    await searchBox.fill('Ethan');
    await page.waitForTimeout(1500);

    // Click on the first search result containing "Ethan"
    await page.getByText(/Ethan/).first().click();

    // The InviteParentModal should now be open
    await expect(page.getByText('Invite Parent')).toBeVisible({ timeout: 5000 });

    // Fill parent details in the modal
    const uniqueEmail = `testparent${Date.now()}@test.com`;
    await page.locator('input[type="email"]').last().fill(uniqueEmail);

    // Click "Generate Invitation Code"
    await page.getByRole('button', { name: /generate invitation code/i }).click();

    // Wait for the generation to complete — look for the success state in the modal
    // The modal shows the code after generation. Look for "Copy" or "Link" text
    // which only appears after the code is generated successfully
    await expect(
      page.getByRole('button', { name: 'Copy Signup Link', exact: true })
    ).toBeVisible({ timeout: 30000 });
  });

  test('invalid invitation code shows error page', async ({ page }) => {
    await page.goto('/signup/FAKE-CODE');

    // Should show "Invalid Invitation" heading (not hang forever)
    // Use getByRole to target the heading specifically (avoid matching the paragraph)
    await expect(
      page.getByRole('heading', { name: 'Invalid Invitation' })
    ).toBeVisible({ timeout: 20000 });
  });

  test('invitation signup page loads for valid code', async ({ page }) => {
    // Step 1: Create invitation as admin
    await login(page, 'admin@test.com', 'Admin123!');

    await page.goto('/admin/parent-invitations');
    await page.waitForURL(/parent-invitations/, { timeout: 5000 });

    // Search and select player
    const searchBox = page.getByPlaceholder(/search.*player/i);
    await searchBox.waitFor({ state: 'visible', timeout: 5000 });
    await searchBox.fill('Ethan');
    await page.waitForTimeout(1500);

    await page.getByText(/Ethan/).first().click();

    await expect(page.getByText('Invite Parent')).toBeVisible({ timeout: 5000 });

    const uniqueEmail = `parent_signup_${Date.now()}@test.com`;
    await page.locator('input[type="email"]').last().fill(uniqueEmail);

    await page.getByRole('button', { name: /generate invitation code/i }).click();

    // Step 2: Wait for code to be generated, then extract it from the modal
    // Look for the signup link text which contains the code
    await expect(
      page.getByRole('button', { name: 'Copy Signup Link', exact: true })
    ).toBeVisible({ timeout: 30000 });
    const pageText = await page.locator('body').innerText();
    const inviteCode = [...pageText.matchAll(/[A-Z0-9]{4}-[A-Z0-9]{4}/g)]
      .map(match => match[0])
      .find(code => code !== 'TEST-CODE');
    expect(inviteCode).toBeTruthy();

    // Step 3: Logout admin
    await logout(page);

    // Step 4: Visit signup page — should NOT hang, should show form or error
    await page.goto(`/signup/${inviteCode}`);

    // Should show either the signup form OR "Already Logged In" OR "Invalid"
    // (NOT stay on a loading spinner forever)
    await expect(
      page.getByRole('button', { name: /create parent account/i })
    ).toBeVisible({ timeout: 20000 });
  });

  test('parent invitation code entry on login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1000);

    // Click the specific button (not the p tag at the bottom)
    await page.getByRole('button', { name: /parent invitation code/i }).click();

    // Should show the code input
    const codeInput = page.getByPlaceholder('XXXX-XXXX');
    await expect(codeInput).toBeVisible({ timeout: 3000 });

    // Enter a code
    await codeInput.fill('TEST-CODE');

    // Click the exact "Continue" button (not "Continue with Google/Apple")
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Should navigate to /signup/TEST-CODE
    await expect(page).toHaveURL(/signup\/TEST-CODE/i, { timeout: 5000 });
  });
});
