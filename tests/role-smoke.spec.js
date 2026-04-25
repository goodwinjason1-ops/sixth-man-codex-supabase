import { test, expect } from '@playwright/test';
import { installE2EMock } from './e2eFixtures.js';

const ERROR_TEXT = /Unable to load|Something went wrong|Failed to initialize|Failed to load user profile|Cannot read properties|is not a function/i;
const IGNORED_CONSOLE_ERROR = /favicon|manifest|404|Failed to load resource|unique "key" prop/i;

const roleSurfaces = {
  admin: [
    '/welcome',
    '/dashboard',
    '/admin',
    '/admin/users',
    '/admin/beta-feedback',
    '/admin/parent-invitations',
    '/coach/videos'
  ],
  president: [
    '/welcome',
    '/dashboard',
    '/admin',
    '/admin/users',
    '/coach/players'
  ],
  vice_president: [
    '/welcome',
    '/dashboard',
    '/admin',
    '/admin/users',
    '/coach/players'
  ],
  coach_coordinator: [
    '/welcome',
    '/dashboard',
    '/admin',
    '/coach/profile',
    '/coach/players'
  ],
  girls_coordinator: [
    '/welcome',
    '/dashboard',
    '/admin/team-selection',
    '/admin/tryouts',
    '/admin/game-scouts',
    '/admin/teams'
  ],
  boys_coordinator: [
    '/welcome',
    '/dashboard',
    '/admin/team-selection',
    '/admin/tryouts',
    '/admin/game-scouts',
    '/admin/teams'
  ],
  youth_head_coach: [
    '/welcome',
    '/dashboard',
    '/admin/youth-programs',
    '/youth-programs/program-1',
    '/admin/tryouts/session-1/results'
  ],
  youth_coach: [
    '/welcome',
    '/dashboard',
    '/admin/youth-programs',
    '/youth-programs/program-1',
    '/youth-programs/program-1/session-summary',
    '/youth-programs/program-1/session-history'
  ],
  coach: [
    '/welcome',
    '/dashboard',
    '/coach',
    '/coach/players',
    '/coach/videos',
    '/coach/training-plans',
    '/drills',
    '/tryout/session-1'
  ],
  team_manager: [
    '/welcome',
    '/dashboard',
    '/manager/team',
    '/manager/scoring',
    '/admin/scoring-roster',
    '/coach/videos',
    '/tryout/session-1'
  ],
  parent: [
    '/welcome',
    '/dashboard',
    '/parent/team',
    '/parent/schedule',
    '/players/player-1/development-plan',
    '/notifications'
  ],
  player: [
    '/welcome',
    '/dashboard',
    '/player',
    '/skills-passport/player-1',
    '/team',
    '/training'
  ],
  tryout_assessor: [
    '/assessor',
    '/tryout/session-1',
    '/help/assessors'
  ],
  pending: [
    '/welcome',
    '/help'
  ]
};

const unauthenticatedProtectedRoutes = [
  '/dashboard',
  '/admin',
  '/coach/players',
  '/parent/team',
  '/manager/team',
  '/tryout/session-1'
];

const unauthorizedCases = [
  { role: 'parent', route: '/admin' },
  { role: 'player', route: '/manager/team' },
  { role: 'coach', route: '/admin/users' },
  { role: 'tryout_assessor', route: '/admin/tryouts' },
  { role: 'pending', route: '/admin' },
  { role: 'parent', route: '/assessor', expectedPath: '/dashboard' }
];

const publicRoutes = [
  '/login',
  '/privacy-policy',
  '/signup/FAKE-CODE',
  '/not-a-real-route'
];

function attachConsoleGuards(page) {
  const errors = [];

  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error' && !IGNORED_CONSOLE_ERROR.test(text)) {
      errors.push(`console: ${text}`);
    }
  });

  return errors;
}

async function installRole(page, role = null) {
  await installE2EMock(page, role);
  await page.addInitScript(() => {
    window.sessionStorage.setItem('gameDayRedirectShown', 'true');
  });
}

async function expectUsableScreen(page, route, options = {}) {
  const {
    consoleErrors = [],
    allowLogin = false,
    expectedPath,
    requireRedirectFrom
  } = options;

  consoleErrors.length = 0;
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText?.trim() || '';
      return text.length > 20 && !/^Loading\.{0,3}$/.test(text);
    },
    null,
      { timeout: 20000 }
  );
  await page.waitForTimeout(200);

  const bodyText = (await page.locator('body').innerText()).trim();
  expect(bodyText.length, `${route} rendered a blank or near-blank screen`).toBeGreaterThan(20);
  expect(bodyText, `${route} displayed an application error`).not.toMatch(ERROR_TEXT);

  if (!allowLogin) {
    await expect(page, `${route} sent an authenticated user to login`).not.toHaveURL(/\/login(?:[?#]|$)/, {
      timeout: 500
    });
  }

  const pathname = new URL(page.url()).pathname;
  if (expectedPath) {
    expect(pathname, `${route} should land on ${expectedPath}`).toBe(expectedPath);
  }
  if (requireRedirectFrom) {
    expect(pathname, `${route} should redirect away from unauthorized route`).not.toBe(requireRedirectFrom);
  }

  const controls = await page.locator('a[href], button, input, textarea, select').count();
  expect(controls, `${route} should expose navigation or a recovery action`).toBeGreaterThan(0);
  expect(consoleErrors, `${route} emitted browser errors`).toEqual([]);
}

async function collectRouteFailures(page, routes, options = {}) {
  const failures = [];
  const consoleErrors = attachConsoleGuards(page);

  for (const route of routes) {
    try {
      await expectUsableScreen(page, route, { ...options, consoleErrors });
    } catch (error) {
      const bodyText = await page.locator('body').innerText().catch(() => '');
      failures.push(`${route} -> ${page.url()}: ${error.message}\n${bodyText.slice(0, 240)}`);
    }
  }

  return failures;
}

test.describe('Role perspective smoke coverage', () => {
  for (const [role, routes] of Object.entries(roleSurfaces)) {
    test(`${role} can reach expected surfaces without blank screens`, async ({ page }) => {
      await installRole(page, role);
      const failures = await collectRouteFailures(page, routes);
      expect(failures).toEqual([]);
    });
  }

  test('unauthenticated users are sent to login from protected routes', async ({ page }) => {
    await installRole(page);
    const failures = [];
    const consoleErrors = attachConsoleGuards(page);

    for (const route of unauthenticatedProtectedRoutes) {
      try {
        await expectUsableScreen(page, route, {
          consoleErrors,
          allowLogin: true,
          expectedPath: '/login'
        });
      } catch (error) {
        failures.push(`${route} -> ${page.url()}: ${error.message}`);
      }
    }

    expect(failures).toEqual([]);
  });

  for (const testCase of unauthorizedCases) {
    test(`${testCase.role} is redirected away from ${testCase.route}`, async ({ page }) => {
      await installRole(page, testCase.role);
      const consoleErrors = attachConsoleGuards(page);

      await expectUsableScreen(page, testCase.route, {
        consoleErrors,
        expectedPath: testCase.expectedPath,
        requireRedirectFrom: testCase.route
      });
    });
  }

  test('public and fallback routes never strand users on a blank page', async ({ page }) => {
    await installRole(page);
    const failures = await collectRouteFailures(page, publicRoutes, { allowLogin: true });
    expect(failures).toEqual([]);
  });

  test('feedback form accepts a screenshot and stores feedback without crashing', async ({ page }) => {
    await installRole(page, 'admin');
    const consoleErrors = attachConsoleGuards(page);

    await expectUsableScreen(page, '/dashboard', { consoleErrors });
    await page.getByTitle('Share Feedback').click();
    await expect(page.getByRole('heading', { name: 'Share Feedback' })).toBeVisible();

    await page.getByRole('button', { name: /Bug Report/i }).click();
    await page.locator('textarea').fill('E2E screenshot upload smoke test.');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'feedback-smoke.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
        'base64'
      )
    });
    await expect(page.getByAltText('Screenshot preview')).toBeVisible();

    await page.getByRole('button', { name: /Submit Feedback/i }).click();
    await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible({ timeout: 10000 });
    expect(consoleErrors, 'feedback flow emitted browser errors').toEqual([]);
  });

  test('video upload queues analysis jobs', async ({ page }) => {
    await installRole(page, 'coach');
    const consoleErrors = attachConsoleGuards(page);

    await expectUsableScreen(page, '/coach/videos', { consoleErrors });
    await page.locator('input[type="file"]').setInputFiles({
      name: 'game-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('e2e video smoke')
    });
    await page.getByPlaceholder('U12 Boys vs Hawks').fill('E2E Game Video');
    await page.getByText('I confirm this footage').click();
    await page.getByRole('button', { name: /Queue AI Analysis/i }).click();

    await expect(page.getByText('Video uploaded and AI analysis queued')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('E2E Game Video')).toBeVisible();
    expect(consoleErrors, 'video flow emitted browser errors').toEqual([]);
  });
});
