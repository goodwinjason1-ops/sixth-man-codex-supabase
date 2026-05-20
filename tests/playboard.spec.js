import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

const SEEDED_PLAYBOARD_ID = 'playboard-e2e-horns-zone';
const SEEDED_PLAYBOARD_NAME = 'Horns Set vs Zone';

const seedSavedPlayboard = async (page, overrides = {}) => {
  await page.evaluate(({ id, name, overrides: boardOverrides }) => {
    const now = '2026-04-25T00:00:00.000Z';
    const board = {
      id,
      name,
      teamId: 'team-1',
      teamName: 'U12 Boys Green',
      coachId: 'coach-user',
      court: {
        id: 'full-court',
        label: 'Full Court',
        orientation: 'portrait',
      },
      players: [],
      objects: [],
      actions: [],
      frames: [{ id: 'frame-1', name: 'Opening action' }],
      createdAt: now,
      updatedAt: now,
      ...boardOverrides,
    };

    const documents = JSON.parse(window.localStorage.getItem('sixthMan.e2eDocuments') || '[]');
    const nextDocuments = documents.filter(doc => !(doc.collection === 'playboards' && doc.id === id));
    nextDocuments.push({
      collection: 'playboards',
      id,
      data: board,
      created_at: now,
      updated_at: now,
      created_by: 'coach-user',
      updated_by: 'coach-user',
    });
    window.localStorage.setItem('sixthMan.e2eDocuments', JSON.stringify(nextDocuments));

    const tableRows = JSON.parse(window.localStorage.getItem('sixthMan.e2eTable.playboards') || '[]');
    const nextTableRows = tableRows.filter(row => row.id !== id);
    nextTableRows.push({
      ...board,
      created_at: now,
      updated_at: now,
    });
    window.localStorage.setItem('sixthMan.e2eTable.playboards', JSON.stringify(nextTableRows));
  }, { id: SEEDED_PLAYBOARD_ID, name: SEEDED_PLAYBOARD_NAME, overrides });
};

const getStoredPlayboards = async (page) => page.evaluate(() => {
  const documents = JSON.parse(window.localStorage.getItem('sixthMan.e2eDocuments') || '[]')
    .filter(doc => doc.collection === 'playboards')
    .map(doc => ({ id: doc.id, ...doc.data }));
  const tableRows = JSON.parse(window.localStorage.getItem('sixthMan.e2eTable.playboards') || '[]');

  return [...documents, ...tableRows];
});

test.describe('Coach Playboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'coach@test.com', 'Coach123!');
    await page.evaluate(() => window.sessionStorage.setItem('gameDayRedirectShown', 'true'));
  });

  test('coach can open the playboard shell', async ({ page }) => {
    await page.goto('/coach/playboard');

    await expect(page).toHaveURL(/\/coach\/playboard/);
    await expect(page.getByRole('heading', { name: 'Playboard', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /new board/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save board/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /load board/i })).toBeVisible();
    await expect(page.getByText(/court area/i)).toBeVisible();
    await expect(page.getByLabel(/team/i)).toBeVisible();
  });

  test('New Board opens draft mode at the new playboard route', async ({ page }) => {
    await page.goto('/coach/playboard');

    await page.getByRole('button', { name: /new board/i }).click();

    await expect(page).toHaveURL(/\/coach\/playboard\/new$/);
    await expect(page.getByText('New board', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Untitled Playboard', exact: true })).toBeVisible();
  });

  test('Save Board creates a named board and shows saved status', async ({ page }) => {
    await page.goto('/coach/playboard/new');
    await page.getByLabel(/team/i).selectOption('team-1');

    await page.getByRole('button', { name: /save board/i }).click();

    await expect(page.locator('body')).toContainText(/saved/i);
    await expect(page.locator('body')).not.toContainText(/placeholder|persistence will be wired/i);
    await expect(page.getByRole('heading', { level: 2 }).first()).not.toHaveText(/untitled|placeholder/i);

    const storedPlayboards = await getStoredPlayboards(page);
    expect(storedPlayboards.some(board =>
      board.name && !/untitled|placeholder/i.test(board.name)
    )).toBe(true);
  });

  test('Load Board opens a saved board selection control', async ({ page }) => {
    await seedSavedPlayboard(page);
    await page.goto('/coach/playboard');

    await page.getByRole('button', { name: /load board/i }).click();

    const savedBoardControl = page.getByRole('dialog', { name: /load board|saved boards/i })
      .or(page.getByRole('listbox', { name: /saved boards/i }))
      .or(page.getByRole('combobox', { name: /saved board|load board/i }))
      .first();
    await expect(savedBoardControl).toBeVisible();
    await expect(page.getByText(SEEDED_PLAYBOARD_NAME)).toBeVisible();
    await expect(page.getByText(/saved board selection will appear here/i)).not.toBeVisible();
  });

  test('existing board route renders seeded board state in edit mode', async ({ page }) => {
    await seedSavedPlayboard(page);

    await page.goto(`/coach/playboard/${SEEDED_PLAYBOARD_ID}`);

    await expect(page).toHaveURL(new RegExp(`/coach/playboard/${SEEDED_PLAYBOARD_ID}$`));
    await expect(page.getByText(new RegExp(`Editing board ${SEEDED_PLAYBOARD_ID}`, 'i'))).toBeVisible();
    await expect(page.getByRole('heading', { name: SEEDED_PLAYBOARD_NAME, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Untitled Playboard', exact: true })).not.toBeVisible();
  });
});
