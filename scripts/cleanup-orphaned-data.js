/**
 * Cleanup Orphaned Firestore Data
 *
 * Removes orphaned user documents, clears the mvp_votes collection,
 * and prunes notifications that target only non-existent users.
 *
 * Usage:
 *   node scripts/cleanup-orphaned-data.js              # dry-run (default, no changes)
 *   node scripts/cleanup-orphaned-data.js --dry-run    # explicit dry-run
 *   node scripts/cleanup-orphaned-data.js --execute    # actually delete data
 *
 * Prerequisites:
 *   npm install firebase-admin    (if not already installed)
 *
 * Authentication (one of):
 *   - Place serviceAccountKey.json in project root
 *   - Set GOOGLE_APPLICATION_CREDENTIALS env var
 *   - Use gcloud application-default credentials
 */

const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ORPHANED_USERS = [
  { name: 'Frank Lewis',   uid: 'TnMt2cRw1fZEye9i2MWhfTtlQf53' },
  { name: 'test mc test',  uid: '9e2Kg5TzjSQm6a8M7s6D2Wtmw7g1' },
  { name: 'Test',          uid: 'D3Mzi8UbwRXvIPLZ2K1zDYqFmD43' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--execute')) return { dryRun: false };
  // Default is dry-run for safety
  return { dryRun: true };
}

function printBanner(dryRun) {
  console.log('');
  console.log('='.repeat(60));
  console.log('  Cleanup Orphaned Firestore Data');
  console.log('='.repeat(60));
  if (dryRun) {
    console.log('');
    console.log('  *** DRY RUN — no data will be deleted ***');
    console.log('  Run with --execute to perform actual deletions.');
  } else {
    console.log('');
    console.log('  *** LIVE RUN — data WILL be permanently deleted ***');
  }
  console.log('='.repeat(60));
  console.log('');
}

// ---------------------------------------------------------------------------
// Firebase Admin initialization
// ---------------------------------------------------------------------------

function initializeFirebase() {
  let admin;
  try {
    admin = require('firebase-admin');
  } catch (err) {
    console.error('ERROR: firebase-admin is not installed.');
    console.error('Run: npm install firebase-admin');
    process.exit(1);
  }

  const projectRoot = path.resolve(__dirname, '..');
  const serviceAccountPath = path.join(projectRoot, 'serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    console.log('Using service account key:', serviceAccountPath);
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Try reading project ID from .env file
    const envPath = path.join(projectRoot, '.env');
    let projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
    if (!projectId && fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/VITE_FIREBASE_PROJECT_ID=(.+)/);
      if (match) projectId = match[1].trim();
    }

    console.log('No serviceAccountKey.json found — using application default credentials.');
    if (projectId) {
      console.log('Project ID:', projectId);
    }
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: projectId || undefined,
    });
  }

  return admin.firestore();
}

// ---------------------------------------------------------------------------
// Step 1: Delete orphaned user documents
// ---------------------------------------------------------------------------

async function cleanupOrphanedUsers(db, dryRun) {
  console.log('\n--- Step 1: Delete orphaned user documents ---\n');

  const deleted = [];
  const notFound = [];

  for (const user of ORPHANED_USERS) {
    const docRef = db.collection('users').doc(user.uid);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      console.log(`  [SKIP] "${user.name}" (${user.uid}) — document does not exist`);
      notFound.push(user);
      continue;
    }

    const data = snapshot.data();
    const displayName = data.displayName || data.name || '(no name)';

    if (dryRun) {
      console.log(`  [DRY-RUN] Would delete "${displayName}" (${user.uid})`);
    } else {
      await docRef.delete();
      console.log(`  [DELETED] "${displayName}" (${user.uid})`);
    }
    deleted.push(user);
  }

  return { deleted: deleted.length, notFound: notFound.length };
}

// ---------------------------------------------------------------------------
// Step 2: Delete all documents in mvp_votes collection
// ---------------------------------------------------------------------------

async function cleanupMvpVotes(db, dryRun) {
  console.log('\n--- Step 2: Delete all mvp_votes documents ---\n');

  const snapshot = await db.collection('mvp_votes').get();
  const count = snapshot.size;

  if (count === 0) {
    console.log('  [SKIP] Collection is already empty.');
    return { deleted: 0 };
  }

  console.log(`  Found ${count} document(s) in mvp_votes.`);

  if (dryRun) {
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const preview = data.voterId || data.playerId || doc.id;
      console.log(`  [DRY-RUN] Would delete mvp_votes/${doc.id} (preview: ${preview})`);
    });
  } else {
    // Delete in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = docs.slice(i, i + batchSize);
      chunk.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    console.log(`  [DELETED] ${count} document(s) from mvp_votes.`);
  }

  return { deleted: count };
}

// ---------------------------------------------------------------------------
// Step 3: Prune notifications targeting only phantom user IDs
// ---------------------------------------------------------------------------

async function cleanupPhantomNotifications(db, dryRun) {
  console.log('\n--- Step 3: Prune notifications targeting phantom users ---\n');

  // Build a set of all valid user IDs
  console.log('  Loading all user IDs from users collection...');
  const usersSnapshot = await db.collection('users').get();
  const validUserIds = new Set();
  usersSnapshot.docs.forEach((doc) => validUserIds.add(doc.id));
  console.log(`  Found ${validUserIds.size} valid user(s).\n`);

  // Scan all notifications
  const notifSnapshot = await db.collection('notifications').get();
  console.log(`  Scanning ${notifSnapshot.size} notification(s)...\n`);

  let deletedCount = 0;
  let skippedCount = 0;
  let noTargetCount = 0;

  for (const doc of notifSnapshot.docs) {
    const data = doc.data();
    const targetAudience = data.targetAudience;

    // Only process notifications that have a targetAudience.userIds array
    if (
      !targetAudience ||
      !Array.isArray(targetAudience.userIds) ||
      targetAudience.userIds.length === 0
    ) {
      noTargetCount++;
      continue;
    }

    const userIds = targetAudience.userIds;
    const validIds = userIds.filter((id) => validUserIds.has(id));
    const phantomIds = userIds.filter((id) => !validUserIds.has(id));

    if (phantomIds.length === 0) {
      // All IDs are valid — keep this notification
      skippedCount++;
      continue;
    }

    if (validIds.length > 0) {
      // Mixed: some valid, some phantom — keep it but report
      console.log(`  [KEEP]    notifications/${doc.id} — ${validIds.length} valid, ${phantomIds.length} phantom ID(s)`);
      skippedCount++;
      continue;
    }

    // ALL userIds are phantom — this notification should be deleted
    const title = data.title || data.message || '(untitled)';
    if (dryRun) {
      console.log(`  [DRY-RUN] Would delete notifications/${doc.id} — "${title}" (${phantomIds.length} phantom ID(s): ${phantomIds.join(', ')})`);
    } else {
      await doc.ref.delete();
      console.log(`  [DELETED] notifications/${doc.id} — "${title}" (${phantomIds.length} phantom ID(s))`);
    }
    deletedCount++;
  }

  console.log(`\n  Notifications without userIds targeting: ${noTargetCount}`);
  console.log(`  Notifications with valid targets (kept): ${skippedCount}`);
  console.log(`  Notifications targeting ONLY phantoms:    ${deletedCount}`);

  return { deleted: deletedCount, skipped: skippedCount, noTarget: noTargetCount };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { dryRun } = parseArgs();
  printBanner(dryRun);

  const db = initializeFirebase();

  const userResult = await cleanupOrphanedUsers(db, dryRun);
  const mvpResult = await cleanupMvpVotes(db, dryRun);
  const notifResult = await cleanupPhantomNotifications(db, dryRun);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('  SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  console.log(`  Orphaned users ${dryRun ? 'to delete' : 'deleted'}:          ${userResult.deleted}`);
  console.log(`  Orphaned users not found:                 ${userResult.notFound}`);
  console.log(`  MVP votes ${dryRun ? 'to delete' : 'deleted'}:               ${mvpResult.deleted}`);
  console.log(`  Phantom notifications ${dryRun ? 'to delete' : 'deleted'}:    ${notifResult.deleted}`);
  console.log(`  Notifications kept (valid targets):       ${notifResult.skipped}`);
  console.log(`  Notifications without userIds targeting:  ${notifResult.noTarget}`);
  console.log('');

  if (dryRun) {
    console.log('  This was a DRY RUN. No data was modified.');
    console.log('  Run with --execute to perform actual deletions.');
  } else {
    console.log('  Cleanup complete. All orphaned data has been removed.');
  }

  console.log('');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nFatal error:', err.message || err);
  process.exit(1);
});
