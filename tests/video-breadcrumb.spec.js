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

test('coach video upload starts worker and renders AI results', async ({ page }) => {
  await installE2EMock(page, 'coach');
  await page.goto('/coach/videos');

  await page.locator('input[type="file"]').setInputFiles({
    name: 'e2e-game-video.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('e2e video bytes')
  });
  await page.getByLabel('Title').fill('E2E Worker Game Video');
  await page.getByLabel(/I confirm this footage/i).check();
  await page.getByRole('button', { name: 'Queue AI Analysis' }).click();

  await expect(page.getByText(/Video uploaded and 3 AI jobs processed/i)).toBeVisible();
  await expect(page.getByText('E2E Worker Game Video')).toBeVisible();
  await expect(page.getByText('AI Results')).toBeVisible();
  await expect(page.getByText(/1 event.*1 stat rollup/i)).toBeVisible();
  await expect(page.getByText(/basketball action/i)).toBeVisible();
});
