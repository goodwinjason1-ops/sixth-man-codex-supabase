import { test, expect } from '@playwright/test';
import { installE2EMock } from './e2eFixtures.js';

test('coach video analysis breadcrumb includes dashboard between home and current page', async ({ page }) => {
  await installE2EMock(page, 'coach');
  await page.goto('/coach/videos');

  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });

  await expect(breadcrumb.getByRole('button', { name: 'Home' })).toBeVisible();
  await expect(breadcrumb.getByRole('button', { name: 'Dashboard' })).toBeVisible();
  await expect(breadcrumb.getByText('Video Analysis')).toBeVisible();
});
