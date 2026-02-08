/**
 * Shared helpers for Playwright tests.
 * Keeps login logic in one place so individual spec files stay lean.
 */

/**
 * Log in via the email/password form on the LoginPage.
 * Waits until the app redirects to /welcome or /dashboard.
 */
export async function login(page, email, password) {
  await page.goto('/');
  // Wait for the login form to be ready
  await page.getByPlaceholder('you@example.com').waitFor({ state: 'visible', timeout: 10000 });
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/welcome|dashboard/, { timeout: 15000 });
}

/**
 * Log out via the Logout button on WelcomePage.
 */
export async function logout(page) {
  // Navigate to welcome first in case we're on a sub-page
  await page.goto('/welcome');
  await page.waitForTimeout(1000);
  // The logout button may be icon-only on mobile; click by role
  const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
  if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForURL(/login/, { timeout: 10000 });
  }
}
