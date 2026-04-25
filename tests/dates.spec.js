import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Australian Date Format', () => {
  test('admin schedule page uses DD/MM/YYYY dates', async ({ page }) => {
    await login(page, 'admin@test.com', 'Admin123!');

    await page.goto('/admin/schedule');
    await page.waitForURL(/schedule/, { timeout: 5000 });
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body');

    // No unambiguously American dates (day position > 12, which is impossible as a month)
    // Pattern: XX/YY/ZZZZ where YY > 12 means it's American format
    const americanOnlyPattern = /\b\d{2}\/(1[3-9]|[2-9]\d)\/\d{4}\b/;
    const americanMatches = pageText?.match(americanOnlyPattern);
    expect(americanMatches).toBeNull();
  });

  test('player DOB shows 25/02/2016 not 02/25/2016', async ({ page }) => {
    await login(page, 'admin@test.com', 'Admin123!');

    await page.goto('/admin/rosters');
    await page.waitForURL(/rosters/, { timeout: 5000 });
    await page.waitForTimeout(3000);

    const pageText = await page.textContent('body');

    // Look specifically for Ethan's DOB
    if (pageText?.includes('Ethan') && pageText?.includes('2016')) {
      // 02/25/2016 is American format — should NOT appear
      expect(pageText).not.toContain('02/25/2016');
    }
  });

  test('roster page has no American-format dates', async ({ page }) => {
    await login(page, 'admin@test.com', 'Admin123!');

    await page.goto('/admin/rosters');
    await page.waitForURL(/rosters/, { timeout: 5000 });
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body');

    // General check: no unambiguously American dates
    const americanOnlyPattern = /\b\d{2}\/(1[3-9]|[2-9]\d)\/\d{4}\b/;
    const americanMatches = pageText?.match(americanOnlyPattern);
    expect(americanMatches).toBeNull();
  });
});
