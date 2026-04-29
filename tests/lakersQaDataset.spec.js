import { test, expect } from '@playwright/test';
import { roleUsers } from './e2eFixtures.js';
import {
  QA_DATASET_ID,
  buildDeleteBatches,
  buildLakersQaDataset,
  summarizeRows
} from '../scripts/lib/lakersQaDataset.mjs';

const generatedAt = '2026-04-29T10:00:00.000Z';

test.describe('Lakers QA dataset', () => {
  test('builds a realistic tagged dataset for full end-user QA', () => {
    const rows = buildLakersQaDataset({ roleUsers, generatedAt });
    const collections = new Set(rows.map((row) => row.collection));

    expect(rows.length).toBeGreaterThan(55);
    expect(collections.size).toBeGreaterThan(14);
    [
      'users',
      'teams',
      'players',
      'games',
      'schedule',
      'training_plans',
      'training_records',
      'match_assessments',
      'development_plans',
      'tryout_sessions',
      'tryout_evaluations',
      'scout_evaluations',
      'playing_time',
      'shot_events',
      'selection_decisions'
    ].forEach((collection) => expect(collections.has(collection)).toBe(true));

    expect(rows.every((row) => row.data?.qa?.datasetId === QA_DATASET_ID)).toBe(true);
    expect(rows.every((row) => row.data?.qa?.isTestData === true)).toBe(true);
    expect(rows.every((row) => row.created_by === 'qa-dataset')).toBe(true);
    expect(rows.every((row) => row.updated_by === 'qa-dataset')).toBe(true);
  });

  test('uses supplied live auth ids in user documents and linked role fields', () => {
    const authUsers = [
      { role: 'admin', id: 'live-admin-id', email: 'admin@test.com' },
      { role: 'coach', id: 'live-coach-id', email: 'coach@test.com' },
      { role: 'parent', id: 'live-parent-id', email: 'parent@test.com' },
      { role: 'team_manager', id: 'live-manager-id', email: 'manager@test.com' }
    ];

    const rows = buildLakersQaDataset({ roleUsers, authUsers, generatedAt });
    const byKey = new Map(rows.map((row) => [`${row.collection}/${row.id}`, row]));

    expect(byKey.get('users/live-admin-id')?.data.email).toBe('admin@test.com');
    expect(byKey.get('users/live-coach-id')?.data.role).toBe('coach');
    expect(byKey.get('teams/lakers-qa-u12-boys-green')?.data.coachId).toBe('live-coach-id');
    expect(byKey.get('teams/lakers-qa-u12-boys-green')?.data.managerId).toBe('live-manager-id');
    expect(byKey.get('players/lakers-qa-player-001')?.data.linkedParentIds).toContain('live-parent-id');
  });

  test('summarizes rows and builds exact delete batches by collection', () => {
    const rows = buildLakersQaDataset({ roleUsers, generatedAt });
    const summary = summarizeRows(rows);
    const batches = buildDeleteBatches(rows);

    expect(summary.totalRows).toBe(rows.length);
    expect(summary.collections.players).toBeGreaterThan(8);
    expect(batches.every((batch) => batch.collection && batch.ids.length > 0)).toBe(true);
    expect(batches.flatMap((batch) => batch.ids).length).toBe(rows.length);
  });
});
