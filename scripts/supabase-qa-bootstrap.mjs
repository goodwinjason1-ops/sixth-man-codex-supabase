#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

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
  'pending',
];

const PAGE_SIZE = 1000;

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const smokeOnly = args.has('--smoke-only');
const help = args.has('--help') || args.has('-h');

if (help) {
  console.log(`
Usage:
  node scripts/supabase-qa-bootstrap.mjs [--dry-run] [--smoke-only]

Environment:
  SUPABASE_URL                Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY   Service role key. Never expose this in a browser.
  QA_PASSWORD                 Optional password for all QA users
`);
  process.exit(0);
}

const generatePassword = () => {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
  return Array.from({ length: 28 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const password = process.env.QA_PASSWORD || generatePassword();
const passwordSource = process.env.QA_PASSWORD
  ? 'QA_PASSWORD'
  : 'generated one-time password (not printed; set QA_PASSWORD if you need to sign in)';

const assertEnv = () => {
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
};

const loadFixtures = async () => {
  const fixturePath = resolve('tests/e2eFixtures.js');
  const source = await readFile(fixturePath, 'utf8');
  const fixtureUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  return import(fixtureUrl);
};

const createServiceClient = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

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

const getEmailConfirmedAt = (user) => user.email_confirmed_at || user.confirmed_at || null;

const ensureAuthUsers = async (supabase, roleUsers) => {
  const byEmail = new Map((await listAllAuthUsers(supabase)).map((user) => [user.email?.toLowerCase(), user]));
  const results = [];

  for (const role of REQUIRED_ROLES) {
    const fixture = roleUsers[role];
    if (!fixture) throw new Error(`tests/e2eFixtures.js is missing roleUsers.${role}`);

    const emailKey = fixture.email.toLowerCase();
    const existing = byEmail.get(emailKey);
    const attributes = {
      email: fixture.email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: fixture.displayName,
        role,
      },
      app_metadata: {
        provider: 'email',
        qa_role: role,
      },
    };

    if (existing) {
      const { data, error } = await supabase.auth.admin.updateUserById(existing.id, attributes);
      if (error) throw new Error(`Failed to update ${fixture.email}: ${error.message}`);

      results.push({
        role,
        email: fixture.email,
        id: data.user.id,
        action: 'updated',
        confirmed: Boolean(getEmailConfirmedAt(data.user)),
      });
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser(attributes);
    if (error) throw new Error(`Failed to create ${fixture.email}: ${error.message}`);

    results.push({
      role,
      email: fixture.email,
      id: data.user.id,
      action: 'created',
      confirmed: Boolean(getEmailConfirmedAt(data.user)),
    });
  }

  return results;
};

const replaceIds = (value, idMap) => {
  if (typeof value === 'string') return idMap.get(value) || value;
  if (Array.isArray(value)) return value.map((item) => replaceIds(item, idMap));
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, replaceIds(nestedValue, idMap)]),
  );
};

const buildDocumentRows = (seedDocuments, roleUsers, authUsers) => {
  const authByRole = new Map(authUsers.map((user) => [user.role, user]));
  const idMap = new Map();

  for (const [role, fixture] of Object.entries(roleUsers)) {
    const authUser = authByRole.get(role);
    if (authUser) idMap.set(fixture.uid, authUser.id);
  }

  const actorId = idMap.get(roleUsers.admin.uid) || null;

  return seedDocuments().map((row) => ({
    collection: row.collection,
    id: idMap.get(row.id) || row.id,
    data: replaceIds(row.data, idMap),
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: actorId,
    updated_by: actorId,
  }));
};

const upsertDocuments = async (supabase, rows) => {
  const { error } = await supabase
    .from('documents')
    .upsert(rows, { onConflict: 'collection,id' });

  if (error) throw new Error(`Failed to upsert public.documents rows: ${error.message}`);
};

const smokeCheck = async (supabase, expectedAuthUsers, expectedDocuments) => {
  const emails = new Set(expectedAuthUsers.map((user) => user.email.toLowerCase()));
  const authUsers = await listAllAuthUsers(supabase);
  const matchingAuthUsers = authUsers.filter((user) => emails.has(user.email?.toLowerCase()));
  const confirmedUsers = matchingAuthUsers.filter((user) => Boolean(getEmailConfirmedAt(user)));

  const userDocumentIds = expectedAuthUsers.map((user) => user.id);
  const { data: userDocs, error: userDocsError } = await supabase
    .from('documents')
    .select('id')
    .eq('collection', 'users')
    .in('id', userDocumentIds);
  if (userDocsError) throw new Error(`Failed to verify user documents: ${userDocsError.message}`);

  const collectionCounts = new Map();
  for (const row of expectedDocuments) {
    collectionCounts.set(row.collection, (collectionCounts.get(row.collection) || 0) + 1);
  }

  let verifiedDocumentRows = 0;
  for (const [collection, expectedCount] of collectionCounts.entries()) {
    const ids = expectedDocuments
      .filter((row) => row.collection === collection)
      .map((row) => row.id);

    const { count, error } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('collection', collection)
      .in('id', ids);

    if (error) throw new Error(`Failed to verify ${collection} documents: ${error.message}`);
    if (count !== expectedCount) {
      throw new Error(`Smoke check mismatch for ${collection}: expected ${expectedCount}, found ${count}`);
    }

    verifiedDocumentRows += count;
  }

  return {
    authUsers: matchingAuthUsers.length,
    confirmedUsers: confirmedUsers.length,
    userDocuments: userDocs?.length || 0,
    documentRows: verifiedDocumentRows,
    collections: collectionCounts.size,
  };
};

const main = async () => {
  const { roleUsers, seedDocuments } = await loadFixtures();
  const fixtureRoles = Object.keys(roleUsers);
  const fixtureDocuments = seedDocuments();

  for (const role of REQUIRED_ROLES) {
    if (!fixtureRoles.includes(role)) throw new Error(`Missing required QA role fixture: ${role}`);
  }

  console.log('Supabase QA bootstrap');
  console.log(`Roles: ${REQUIRED_ROLES.length}`);
  console.log(`Fixture document rows: ${fixtureDocuments.length}`);
  console.log(`Password source: ${passwordSource}`);

  if (dryRun && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.log('Dry run only: Supabase credentials were not provided, so no remote lookup was attempted.');
    return;
  }

  assertEnv();
  const supabase = createServiceClient();

  if (dryRun) {
    const authUsers = await listAllAuthUsers(supabase);
    const emails = new Set(Object.values(roleUsers).map((user) => user.email.toLowerCase()));
    const existingCount = authUsers.filter((user) => emails.has(user.email?.toLowerCase())).length;
    console.log(`Dry run only: would ensure ${REQUIRED_ROLES.length} auth users and upsert ${fixtureDocuments.length} document rows.`);
    console.log(`Existing matching auth users: ${existingCount}`);
    return;
  }

  const authResults = smokeOnly
    ? (await listAllAuthUsers(supabase))
      .filter((user) => Object.values(roleUsers).some((fixture) => fixture.email.toLowerCase() === user.email?.toLowerCase()))
      .map((user) => {
        const role = Object.values(roleUsers).find((fixture) => fixture.email.toLowerCase() === user.email?.toLowerCase())?.role;
        return { role, email: user.email, id: user.id, action: 'existing', confirmed: Boolean(getEmailConfirmedAt(user)) };
      })
    : await ensureAuthUsers(supabase, roleUsers);

  if (authResults.length !== REQUIRED_ROLES.length) {
    throw new Error(`Expected ${REQUIRED_ROLES.length} QA auth users, found ${authResults.length}`);
  }

  const documentRows = buildDocumentRows(seedDocuments, roleUsers, authResults);
  if (!smokeOnly) await upsertDocuments(supabase, documentRows);

  const smoke = await smokeCheck(supabase, authResults, documentRows);
  const created = authResults.filter((result) => result.action === 'created').length;
  const updated = authResults.filter((result) => result.action === 'updated').length;

  console.log(`Auth users created: ${created}`);
  console.log(`Auth users updated: ${updated}`);
  console.log(`Auth users confirmed: ${smoke.confirmedUsers}/${REQUIRED_ROLES.length}`);
  console.log(`User documents verified: ${smoke.userDocuments}/${REQUIRED_ROLES.length}`);
  console.log(`Document rows verified: ${smoke.documentRows}/${documentRows.length}`);
  console.log(`Collections verified: ${smoke.collections}`);
  console.log(`Test emails: ${Object.values(roleUsers).map((user) => user.email).join(', ')}`);
  console.log('Done.');
};

main().catch((error) => {
  console.error(`Supabase QA bootstrap failed: ${error.message}`);
  process.exit(1);
});
