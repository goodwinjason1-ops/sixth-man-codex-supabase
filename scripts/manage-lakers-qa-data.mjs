#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  QA_DATASET_ID,
  buildDeleteBatches,
  buildLakersQaDataset,
  summarizeRows
} from './lib/lakersQaDataset.mjs';

const PAGE_SIZE = 1000;
const CHUNK_SIZE = 100;

const REQUIRED_ROLES = [
  'admin',
  'president',
  'vice_president',
  'coach_coordinator',
  'girls_coordinator',
  'boys_coordinator',
  'youth_head_coach',
  'coach',
  'youth_coach',
  'player',
  'parent',
  'team_manager',
  'tryout_assessor',
  'pending'
];

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const seed = args.has('--seed');
const cleanup = args.has('--cleanup');
const reset = args.has('--reset');
const smoke = args.has('--smoke');
const help = args.has('--help') || args.has('-h');
const includeLegacyE2E = args.has('--include-legacy-e2e');
const includeSampleFlags = args.has('--include-sample-flags');
const includeLiveVideoQa = args.has('--include-live-video-qa');

if (help || (!seed && !cleanup && !reset && !smoke && !dryRun)) {
  console.log(`
Manage the resettable Emerald Lakers QA dataset in Supabase.

Usage:
  node scripts/manage-lakers-qa-data.mjs --dry-run
  node scripts/manage-lakers-qa-data.mjs --reset
  node scripts/manage-lakers-qa-data.mjs --cleanup
  node scripts/manage-lakers-qa-data.mjs --seed
  node scripts/manage-lakers-qa-data.mjs --smoke

Optional cleanup flags:
  --include-legacy-e2e     Also remove old untagged rows from tests/e2eFixtures.js by exact collection/id.
  --include-sample-flags   Also remove rows where data.isSampleData or data.isTestUser is true.
  --include-live-video-qa  Also remove live video smoke-test uploads titled "Live QA Game Video...".

Environment for remote actions:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  QA_PASSWORD              Optional. Required only to create/update QA auth users.

Notes:
  Cleanup without optional flags removes only rows tagged with data.qa.datasetId="${QA_DATASET_ID}".
  Auth users are kept by default so QA sign-in remains available.
`);
  process.exit(0);
}

const assertEnv = () => {
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
};

const createServiceClient = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const loadFixtures = async () => {
  const fixturePath = resolve('tests/e2eFixtures.js');
  const source = await readFile(fixturePath, 'utf8');
  const fixtureUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  return import(fixtureUrl);
};

const chunk = (values, size = CHUNK_SIZE) => {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};

const printSummary = (label, summary) => {
  console.log(label);
  console.log(`  Total rows: ${summary.totalRows}`);
  Object.entries(summary.collections).forEach(([collection, count]) => {
    console.log(`  ${collection}: ${count}`);
  });
};

const listAllAuthUsers = async (supabase) => {
  const users = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw error;

    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }

  return users;
};

const roleForAuthUser = (authUser, roleUsers) => {
  if (authUser?.role) return authUser.role;
  if (authUser?.app_metadata?.qa_role) return authUser.app_metadata.qa_role;
  if (authUser?.user_metadata?.role) return authUser.user_metadata.role;

  const email = authUser?.email?.toLowerCase();
  return Object.values(roleUsers).find((profile) => profile.email.toLowerCase() === email)?.role || null;
};

const matchingAuthUsers = (authUsers, roleUsers) => {
  const wantedEmails = new Set(Object.values(roleUsers).map((user) => user.email.toLowerCase()));
  return authUsers
    .filter((user) => wantedEmails.has(user.email?.toLowerCase()))
    .map((user) => ({
      id: user.id,
      email: user.email,
      role: roleForAuthUser(user, roleUsers),
      confirmed: Boolean(user.email_confirmed_at || user.confirmed_at)
    }));
};

const ensureAuthUsers = async (supabase, roleUsers) => {
  const allUsers = await listAllAuthUsers(supabase);
  const byEmail = new Map(allUsers.map((user) => [user.email?.toLowerCase(), user]));
  const results = [];
  const missing = [];
  const password = process.env.QA_PASSWORD;

  for (const role of REQUIRED_ROLES) {
    const fixture = roleUsers[role];
    if (!fixture) throw new Error(`tests/e2eFixtures.js is missing roleUsers.${role}`);

    const existing = byEmail.get(fixture.email.toLowerCase());
    const attributes = {
      email: fixture.email,
      email_confirm: true,
      user_metadata: {
        display_name: fixture.displayName,
        role
      },
      app_metadata: {
        provider: 'email',
        qa_role: role
      }
    };

    if (password) attributes.password = password;

    if (existing) {
      if (password) {
        const { data, error } = await supabase.auth.admin.updateUserById(existing.id, attributes);
        if (error) throw new Error(`Failed to update ${fixture.email}: ${error.message}`);
        results.push({
          role,
          email: fixture.email,
          id: data.user.id,
          action: 'updated',
          confirmed: Boolean(data.user.email_confirmed_at || data.user.confirmed_at)
        });
      } else {
        results.push({
          role,
          email: fixture.email,
          id: existing.id,
          action: 'existing',
          confirmed: Boolean(existing.email_confirmed_at || existing.confirmed_at)
        });
      }
      continue;
    }

    if (!password) {
      missing.push(fixture.email);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      ...attributes,
      password
    });
    if (error) throw new Error(`Failed to create ${fixture.email}: ${error.message}`);

    results.push({
      role,
      email: fixture.email,
      id: data.user.id,
      action: 'created',
      confirmed: Boolean(data.user.email_confirmed_at || data.user.confirmed_at)
    });
  }

  if (missing.length > 0) {
    throw new Error(`QA auth users are missing and QA_PASSWORD was not provided: ${missing.join(', ')}`);
  }

  return results;
};

const buildLegacyFixtureRows = (seedDocuments, roleUsers, authUsers) => {
  const authByRole = new Map(authUsers.map((user) => [user.role, user]));
  const idMap = new Map();

  Object.entries(roleUsers).forEach(([role, fixture]) => {
    const authUser = authByRole.get(role);
    if (authUser?.id) idMap.set(fixture.uid, authUser.id);
  });

  return seedDocuments().map((row) => ({
    collection: row.collection,
    id: idMap.get(row.id) || row.id
  }));
};

const selectTaggedRows = async (supabase) => {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('documents')
      .select('collection,id')
      .eq('data->qa->>datasetId', QA_DATASET_ID)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to find tagged QA rows: ${error.message}`);

    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
};

const selectFlaggedRows = async (supabase) => {
  const filters = [
    ['data->>isSampleData', 'true'],
    ['data->>isTestUser', 'true'],
    ['data->>isTestData', 'true']
  ];
  const rows = new Map();

  for (const [column, value] of filters) {
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from('documents')
        .select('collection,id')
        .eq(column, value)
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw new Error(`Failed to find rows flagged by ${column}: ${error.message}`);

      (data || []).forEach((row) => rows.set(`${row.collection}/${row.id}`, row));
      if (!data || data.length < PAGE_SIZE) break;
    }
  }

  return Array.from(rows.values());
};

const countExistingRows = async (supabase, rows) => {
  let count = 0;
  const batches = buildDeleteBatches(rows);

  for (const batch of batches) {
    for (const ids of chunk(batch.ids)) {
      const { count: batchCount, error } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('collection', batch.collection)
        .in('id', ids);
      if (error) throw new Error(`Failed to count ${batch.collection}: ${error.message}`);
      count += batchCount || 0;
    }
  }

  return count;
};

const deleteRows = async (supabase, rows, label) => {
  const existing = await countExistingRows(supabase, rows);
  const batches = buildDeleteBatches(rows);

  for (const batch of batches) {
    for (const ids of chunk(batch.ids)) {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('collection', batch.collection)
        .in('id', ids);
      if (error) throw new Error(`Failed to delete ${label} rows from ${batch.collection}: ${error.message}`);
    }
  }

  return existing;
};

const upsertRows = async (supabase, rows) => {
  for (const rowsChunk of chunk(rows, 250)) {
    const { error } = await supabase
      .from('documents')
      .upsert(rowsChunk, { onConflict: 'collection,id' });
    if (error) throw new Error(`Failed to upsert QA rows: ${error.message}`);
  }
};

const smokeCheck = async (supabase, expectedRows) => {
  const batches = buildDeleteBatches(expectedRows);
  let verified = 0;

  for (const batch of batches) {
    for (const ids of chunk(batch.ids)) {
      const { count, error } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('collection', batch.collection)
        .in('id', ids)
        .eq('data->qa->>datasetId', QA_DATASET_ID);
      if (error) throw new Error(`Failed to verify ${batch.collection}: ${error.message}`);
      verified += count || 0;
    }
  }

  if (verified !== expectedRows.length) {
    throw new Error(`QA data smoke check failed: expected ${expectedRows.length} tagged rows, found ${verified}`);
  }

  return verified;
};

const selectLiveQaVideoSessions = async (supabase) => {
  const { data, error } = await supabase
    .from('video_recording_sessions')
    .select('id,title')
    .ilike('title', 'Live QA Game Video%');
  if (error) throw new Error(`Failed to find live QA video sessions: ${error.message}`);
  return data || [];
};

const cleanupLiveQaVideos = async (supabase) => {
  const sessions = await selectLiveQaVideoSessions(supabase);
  const sessionIds = sessions.map((session) => session.id);
  if (sessionIds.length === 0) return { sessions: 0, recordings: 0, jobs: 0, storageObjects: 0 };

  const { data: recordings, error: recordingsError } = await supabase
    .from('video_recordings')
    .select('id,session_id,bucket_id,object_path')
    .in('session_id', sessionIds);
  if (recordingsError) throw new Error(`Failed to find live QA video recordings: ${recordingsError.message}`);

  const { data: jobs, error: jobsSelectError } = await supabase
    .from('video_analysis_jobs')
    .select('id')
    .in('session_id', sessionIds);
  if (jobsSelectError) throw new Error(`Failed to find live QA video jobs: ${jobsSelectError.message}`);

  const { error: jobsDeleteError } = await supabase
    .from('video_analysis_jobs')
    .delete()
    .in('session_id', sessionIds);
  if (jobsDeleteError) throw new Error(`Failed to delete live QA video jobs: ${jobsDeleteError.message}`);

  const recordingIds = (recordings || []).map((recording) => recording.id);
  if (recordingIds.length > 0) {
    const { error: recordingsDeleteError } = await supabase
      .from('video_recordings')
      .delete()
      .in('id', recordingIds);
    if (recordingsDeleteError) throw new Error(`Failed to delete live QA video recordings: ${recordingsDeleteError.message}`);
  }

  const recordingsByBucket = new Map();
  (recordings || []).forEach((recording) => {
    if (!recording.bucket_id || !recording.object_path) return;
    if (!recordingsByBucket.has(recording.bucket_id)) recordingsByBucket.set(recording.bucket_id, []);
    recordingsByBucket.get(recording.bucket_id).push(recording.object_path);
  });

  let storageObjects = 0;
  for (const [bucketId, objectPaths] of recordingsByBucket.entries()) {
    const { error } = await supabase.storage.from(bucketId).remove(objectPaths);
    if (error) throw new Error(`Failed to remove live QA video storage objects from ${bucketId}: ${error.message}`);
    storageObjects += objectPaths.length;
  }

  const { error: sessionsDeleteError } = await supabase
    .from('video_recording_sessions')
    .delete()
    .in('id', sessionIds);
  if (sessionsDeleteError) throw new Error(`Failed to delete live QA video sessions: ${sessionsDeleteError.message}`);

  return {
    sessions: sessions.length,
    recordings: recordings?.length || 0,
    jobs: jobs?.length || 0,
    storageObjects
  };
};

const main = async () => {
  const { roleUsers, seedDocuments } = await loadFixtures();
  const generatedAt = new Date().toISOString();
  const localRows = buildLakersQaDataset({ roleUsers, generatedAt });
  const localSummary = summarizeRows(localRows);

  printSummary('Lakers QA dataset to seed:', localSummary);

  if (dryRun && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.log('Dry run only: Supabase credentials were not provided, so no remote rows were counted or changed.');
    console.log('No data was changed.');
    return;
  }

  assertEnv();
  const supabase = createServiceClient();
  const existingAuthUsers = matchingAuthUsers(await listAllAuthUsers(supabase), roleUsers);
  const authUsers = !dryRun && (seed || reset)
    ? await ensureAuthUsers(supabase, roleUsers)
    : existingAuthUsers;
  const rows = buildLakersQaDataset({ roleUsers, authUsers, generatedAt });

  if (dryRun) {
    const taggedRows = await selectTaggedRows(supabase);
    const taggedCount = taggedRows.length;
    const existingTargetCount = await countExistingRows(supabase, rows);
    console.log(`Remote tagged QA rows currently present: ${taggedCount}`);
    console.log(`Remote target rows currently present: ${existingTargetCount}/${rows.length}`);

    if (includeLegacyE2E) {
      const legacyRows = buildLegacyFixtureRows(seedDocuments, roleUsers, authUsers);
      const legacyCount = await countExistingRows(supabase, legacyRows);
      console.log(`Old untagged E2E fixture rows that would be removed: ${legacyCount}/${legacyRows.length}`);
    }

    if (includeSampleFlags) {
      const flaggedRows = await selectFlaggedRows(supabase);
      console.log(`Rows flagged isSampleData/isTestUser/isTestData that would be removed: ${flaggedRows.length}`);
    }

    if (includeLiveVideoQa) {
      const videoSessions = await selectLiveQaVideoSessions(supabase);
      console.log(`Live video QA upload sessions that would be removed: ${videoSessions.length}`);
    }

    console.log('Dry run only: no data was changed.');
    return;
  }

  if (cleanup || reset) {
    const taggedRows = await selectTaggedRows(supabase);
    let deleted = taggedRows.length ? await deleteRows(supabase, taggedRows, 'tagged QA dataset') : 0;
    console.log(`Deleted tagged QA rows: ${deleted}`);

    if (includeLegacyE2E) {
      const legacyRows = buildLegacyFixtureRows(seedDocuments, roleUsers, authUsers);
      const legacyDeleted = await deleteRows(supabase, legacyRows, 'legacy E2E fixture');
      deleted += legacyDeleted;
      console.log(`Deleted legacy E2E fixture rows by exact id: ${legacyDeleted}`);
    }

    if (includeSampleFlags) {
      const flaggedRows = await selectFlaggedRows(supabase);
      const flaggedDeleted = flaggedRows.length ? await deleteRows(supabase, flaggedRows, 'flagged sample/test') : 0;
      deleted += flaggedDeleted;
      console.log(`Deleted flagged sample/test rows: ${flaggedDeleted}`);
    }

    if (includeLiveVideoQa) {
      const videoDeleted = await cleanupLiveQaVideos(supabase);
      console.log(`Deleted live video QA sessions: ${videoDeleted.sessions}`);
      console.log(`Deleted live video QA recordings: ${videoDeleted.recordings}`);
      console.log(`Deleted live video QA jobs: ${videoDeleted.jobs}`);
      console.log(`Deleted live video QA storage objects: ${videoDeleted.storageObjects}`);
    }

    if (cleanup && !reset) {
      console.log(`Cleanup complete. Total delete attempts: ${deleted}`);
    }
  }

  if (seed || reset) {
    await upsertRows(supabase, rows);
    console.log(`Seeded tagged Lakers QA rows: ${rows.length}`);
  }

  if (smoke || seed || reset) {
    const verified = await smokeCheck(supabase, rows);
    console.log(`Smoke check passed: ${verified}/${rows.length} tagged rows verified.`);
    console.log(`QA auth users available: ${authUsers.length}/${REQUIRED_ROLES.length}`);
  }

  console.log('Done.');
};

main().catch((error) => {
  console.error(`Lakers QA data manager failed: ${error.message}`);
  process.exit(1);
});
