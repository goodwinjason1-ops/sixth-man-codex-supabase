import { test, expect } from '@playwright/test';
import { installE2EMock } from './e2eFixtures.js';

test('disabled Google OAuth provider stays on login with a recovery message', async ({ page }) => {
  await installE2EMock(page);
  await page.addInitScript(() => {
    window.__SIXTH_MAN_E2E_OAUTH_URL__ = 'https://supabase.test/auth/v1/authorize?provider=google';
  });
  await page.route('https://supabase.test/auth/v1/authorize**', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*'
      },
      body: JSON.stringify({
        code: 400,
        error_code: 'validation_failed',
        msg: 'Unsupported provider: provider is not enabled'
      })
    });
  });

  await page.goto('/login');
  await page.getByRole('button', { name: /continue with google/i }).click();

  await expect(page.getByText(/Google sign-in is not enabled yet/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
