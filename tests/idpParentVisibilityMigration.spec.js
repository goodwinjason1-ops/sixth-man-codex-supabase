import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.join(
  process.cwd(),
  'supabase',
  'migrations',
  '202604260002_idp_parent_visibility_security.sql'
);

const readMigration = () => fs.readFileSync(migrationPath, 'utf8');

test.describe('IDP parent visibility migration', () => {
  test('requires explicit sharing and linked parent id for parent reads', () => {
    const sql = readMigration();

    expect(sql).toContain("if collection_name = 'development_plans' then");
    expect(sql).toContain("role_name = 'parent'");
    expect(sql).toContain("coalesce(document_data->>'parentVisible', 'false') = 'true'");
    expect(sql).toContain("public.jsonb_array_contains_text(document_data->'parentIds', uid)");
  });

  test('keeps the migration narrowly scoped', () => {
    const sql = readMigration().toLowerCase();

    expect(sql).not.toMatch(/\bgrant\b/);
    expect(sql).not.toMatch(/\brevoke\b/);
    expect(sql).not.toMatch(/\bcreate\s+policy\b/);
    expect(sql).not.toMatch(/\bdrop\s+policy\b/);
    expect(sql).toContain('documents_development_plans_security_audit');
  });
});
