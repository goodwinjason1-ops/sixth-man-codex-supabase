import { test, expect } from '@playwright/test';

const LIVE_PASSWORD = process.env.LIVE_QA_PASSWORD;

const liveUsers = {
  admin: 'admin@test.com',
  president: 'president@test.com',
  vice_president: 'vice@test.com',
  coach_coordinator: 'coordinator@test.com',
  girls_coordinator: 'girls@test.com',
  boys_coordinator: 'boys@test.com',
  youth_head_coach: 'youthhead@test.com',
  coach: 'coach@test.com',
  youth_coach: 'youth@test.com',
  player: 'player@test.com',
  parent: 'parent@test.com',
  team_manager: 'manager@test.com',
  tryout_assessor: 'assessor@test.com',
  pending: 'pending@test.com'
};

const roleRoutes = {
  admin: ['/welcome', '/dashboard', '/admin', '/admin/profile', '/coach/videos'],
  president: ['/welcome', '/dashboard', '/admin', '/coach/videos'],
  vice_president: ['/welcome', '/dashboard', '/admin', '/coach/videos'],
  coach_coordinator: ['/welcome', '/dashboard', '/admin', '/coach/videos'],
  girls_coordinator: ['/welcome', '/dashboard', '/admin/tryouts', '/coach/videos'],
  boys_coordinator: ['/welcome', '/dashboard', '/admin/tryouts', '/coach/videos'],
  youth_head_coach: ['/welcome', '/dashboard', '/admin/youth-programs', '/coach/videos'],
  coach: ['/welcome', '/dashboard', '/coach', '/coach/videos'],
  youth_coach: ['/welcome', '/dashboard', '/admin/youth-programs', '/coach/videos'],
  player: ['/welcome', '/dashboard', '/player'],
  parent: ['/welcome', '/dashboard', '/parent/team'],
  team_manager: ['/welcome', '/dashboard', '/manager/team', '/coach/videos'],
  tryout_assessor: ['/assessor', '/tryout/session-1'],
  pending: ['/welcome']
};

const forbiddenText = /Unable to load|Something went wrong|Failed to load user profile|Cannot read properties|is not a function/i;

test.skip(!LIVE_PASSWORD, 'Set LIVE_QA_PASSWORD to run live Supabase smoke tests.');

async function login(page, email) {
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter password').fill(LIVE_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/welcome|dashboard|assessor/, { timeout: 30000 });
}

async function expectUsable(page, route) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => document.body && document.body.innerText.trim().length > 0, null, { timeout: 30000 });

  const bodyText = await page.locator('body').innerText();
  expect(bodyText.trim(), `${route} rendered blank`).not.toBe('');
  expect(bodyText, `${route} showed an error boundary`).not.toMatch(forbiddenText);
  expect(errors, `${route} emitted page errors`).toEqual([]);
}

test.describe('Live Supabase role smoke coverage', () => {
  for (const [role, email] of Object.entries(liveUsers)) {
    test(`${role} can sign in and use expected live routes`, async ({ page }) => {
      await login(page, email);

      for (const route of roleRoutes[role]) {
        await expectUsable(page, route);
      }
    });
  }

  test('coach can upload a video and queue live analysis', async ({ page }) => {
    await login(page, liveUsers.coach);
    await expectUsable(page, '/coach/videos');

    const title = `Live QA Game Video ${Date.now()}`;
    await page.locator('input[type="file"]').setInputFiles({
      name: 'live-qa-game-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('live supabase video smoke')
    });
    await page.getByPlaceholder('U12 Boys vs Hawks').fill(title);
    await page.getByText('I confirm this footage').click();
    await page.getByRole('button', { name: /Queue AI Analysis/i }).click();

    await expect(page.getByText('Video uploaded and AI analysis queued')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(title)).toBeVisible();
  });
});
