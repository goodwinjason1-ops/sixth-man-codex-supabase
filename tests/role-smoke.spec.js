import { test, expect } from '@playwright/test';
import { installE2EMock } from './e2eFixtures.js';

const sharedRoutes = [
  '/welcome',
  '/dashboard',
  '/team',
  '/training',
  '/stats',
  '/messages',
  '/notifications',
  '/notifications/settings',
  '/help',
  '/help/admin',
  '/help/leadership',
  '/help/coordinators',
  '/help/coaches',
  '/help/youth-coaches',
  '/help/assessors',
  '/help/parents',
  '/help/players'
];

const leadershipRoutes = [
  ...sharedRoutes,
  '/admin',
  '/admin/profile',
  '/admin/users',
  '/admin/teams',
  '/admin/activity',
  '/admin/assessments-hub',
  '/admin/analytics-hub',
  '/admin/coach-compliance',
  '/admin/rosters',
  '/admin/schedule',
  '/admin/notifications',
  '/admin/parent-invitations',
  '/admin/team-selection',
  '/admin/tryouts',
  '/admin/tryouts/session-1/results',
  '/coach/profile',
  '/coach/schedule',
  '/coach/players',
  '/drills'
];

const routeMatrix = {
  admin: [
    ...sharedRoutes,
    '/admin',
    '/admin/profile',
    '/admin/users',
    '/admin/users/create',
    '/admin/teams',
    '/admin/activity',
    '/admin/beta-feedback',
    '/admin/assessment-metrics',
    '/admin/match-assessments',
    '/admin/training-records',
    '/admin/assessments-hub',
    '/admin/analytics-hub',
    '/admin/coach-compliance',
    '/admin/rotation-analytics',
    '/admin/benchmarks',
    '/admin/rosters',
    '/admin/schedule',
    '/admin/playerhq',
    '/admin/analytics',
    '/admin/age-groups',
    '/admin/age-groups/U12',
    '/admin/coaching',
    '/admin/curriculum',
    '/admin/rep-prospects',
    '/admin/data-explorer',
    '/admin/reports',
    '/admin/system',
    '/admin/training-plans',
    '/admin/game-results',
    '/admin/notifications',
    '/admin/scoring-roster',
    '/admin/sample-data',
    '/admin/parent-invitations',
    '/admin/data-cleanup',
    '/admin/youth-programs',
    '/admin/team-selection',
    '/admin/tryouts',
    '/admin/tryouts/session-1/results',
    '/admin/game-scouts',
    '/drills',
    '/drills/new',
    '/drills/drill-1',
    '/drills/drill-1/edit',
    '/coach/profile',
    '/coach/schedule',
    '/coach/my-schedule',
    '/coach/record-training',
    '/coach/training-session/game-1',
    '/coach/players',
    '/players/player-1/development-plan',
    '/players/player-1/development-plan/new',
    '/development-plans/idp-1/review',
    '/coach/training-plans',
    '/coach/training-plans/new',
    '/coach/training-plans/plan-1',
    '/coach/training-history',
    '/coach/training-history/session-1',
    '/coach-assessment',
    '/coach/match-assessment',
    '/coach/match-history',
    '/coach/rotation-tracker',
    '/coach/rotation-analytics',
    '/tryout/session-1',
    '/scout-dashboard',
    '/scout/game-1',
    '/parent/team',
    '/parent/schedule',
    '/manager/team',
    '/manager/scoring',
    '/assessor'
  ],
  president: leadershipRoutes,
  vice_president: leadershipRoutes,
  coach_coordinator: leadershipRoutes,
  girls_coordinator: [
    ...sharedRoutes,
    '/admin/team-selection',
    '/admin/tryouts',
    '/admin/tryouts/session-1/results',
    '/admin/game-scouts',
    '/admin/teams'
  ],
  boys_coordinator: [
    ...sharedRoutes,
    '/admin/team-selection',
    '/admin/tryouts',
    '/admin/tryouts/session-1/results',
    '/admin/game-scouts',
    '/admin/teams'
  ],
  coach: [
    ...sharedRoutes,
    '/coach',
    '/coach/profile',
    '/coach/schedule',
    '/coach/my-schedule',
    '/coach/record-training',
    '/coach/training-session/game-1',
    '/coach/players',
    '/players/player-1/development-plan',
    '/players/player-1/development-plan/new',
    '/development-plans/idp-1/review',
    '/coach/training-plans',
    '/coach/training-plans/new',
    '/coach/training-plans/plan-1',
    '/coach/training-history',
    '/coach/training-history/session-1',
    '/coach-assessment',
    '/coach/match-assessment',
    '/coach/match-history',
    '/coach/rotation-tracker',
    '/coach/rotation-analytics',
    '/drills',
    '/drills/drill-1',
    '/tryout/session-1',
    '/scout-dashboard',
    '/scout/game-1'
  ],
  youth_coach: [
    ...sharedRoutes,
    '/admin/youth-programs',
    '/youth-programs/program-1',
    '/youth-programs/program-1/session-summary',
    '/youth-programs/program-1/session-history'
  ],
  youth_head_coach: [
    ...sharedRoutes,
    '/admin/youth-programs',
    '/youth-programs/program-1',
    '/youth-programs/program-1/session-summary',
    '/youth-programs/program-1/session-history',
    '/admin/tryouts/session-1/results'
  ],
  team_manager: [
    ...sharedRoutes,
    '/manager/team',
    '/manager/scoring',
    '/admin/scoring-roster',
    '/tryout/session-1'
  ],
  parent: [
    ...sharedRoutes,
    '/parent/team',
    '/parent/schedule',
    '/parent/scoring-swap/swap-1',
    '/players/player-1/development-plan'
  ],
  player: [
    ...sharedRoutes,
    '/player',
    '/skills-passport/player-1',
    '/players/player-1/development-plan'
  ],
  tryout_assessor: [
    ...sharedRoutes,
    '/assessor',
    '/tryout/session-1'
  ],
  pending: [
    '/welcome',
    '/dashboard',
    '/notifications',
    '/help'
  ]
};

const publicRoutes = [
  '/login',
  '/privacy-policy',
  '/signup/FAKE-CODE',
  '/not-a-real-route'
];

const ROUTES_PER_TEST = 8;

const chunkRoutes = (routes) => {
  const chunks = [];
  for (let i = 0; i < routes.length; i += ROUTES_PER_TEST) {
    chunks.push(routes.slice(i, i + ROUTES_PER_TEST));
  }
  return chunks;
};

async function expectUsableScreen(page, route, consoleErrors) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(
    () => document.body && document.body.innerText.trim().length > 20,
    null,
    { timeout: 8000 }
  );
  await page.waitForTimeout(150);

  await expect(page.locator('body')).not.toBeEmpty();
  await expect(page.locator('body')).not.toContainText(/Unable to load|Something went wrong/i);
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 500 });

  const bodyText = (await page.locator('body').innerText()).trim();
  expect(bodyText.length, `${route} rendered a blank or near-blank screen`).toBeGreaterThan(20);

  const navigable = await page.locator('a[href], button').count();
  expect(navigable, `${route} should expose navigation or an action to recover`).toBeGreaterThan(0);

  expect(consoleErrors, `${route} emitted browser errors`).toEqual([]);
}

test.describe.skip('Role perspective route smoke tests', () => {
  for (const [role, routes] of Object.entries(routeMatrix)) {
    chunkRoutes(routes).forEach((routeChunk, index) => {
      test(`${role} can load route group ${index + 1} without a blank screen`, async ({ page }) => {
        await installE2EMock(page, role);
        const consoleErrors = [];

        page.on('pageerror', (error) => {
          consoleErrors.push(error.message);
        });
        page.on('console', (message) => {
          const text = message.text();
          if (
            message.type() === 'error' &&
            !/favicon|manifest|404|Failed to load resource/i.test(text)
          ) {
            consoleErrors.push(text);
          }
        });

        for (const route of routeChunk) {
          consoleErrors.length = 0;
          await expectUsableScreen(page, route, consoleErrors);
        }
      });
    });
  }

  test('public and fallback routes never strand users on a blank page', async ({ page }) => {
    await installE2EMock(page);
    const consoleErrors = [];

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });
    page.on('console', (message) => {
      const text = message.text();
      if (
        message.type() === 'error' &&
        !/favicon|manifest|404|Failed to load resource/i.test(text)
      ) {
        consoleErrors.push(text);
      }
    });

    for (const route of publicRoutes) {
      consoleErrors.length = 0;
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForFunction(
        () => document.body && document.body.innerText.trim().length > 20,
        null,
        { timeout: 8000 }
      );
      await page.waitForTimeout(150);
      await expect(page.locator('body')).not.toBeEmpty();
      await expect(page.locator('body')).not.toContainText(/Something went wrong/i);
      const bodyText = (await page.locator('body').innerText()).trim();
      expect(bodyText.length, `${route} rendered a blank or near-blank screen`).toBeGreaterThan(20);
      expect(consoleErrors, `${route} emitted browser errors`).toEqual([]);
    }
  });
});
