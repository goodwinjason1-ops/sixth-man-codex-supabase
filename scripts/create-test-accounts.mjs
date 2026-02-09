/**
 * Batch create test user accounts for all new roles.
 * Signs in as admin to write Firestore profiles with privileged roles.
 * Run with: node scripts/create-test-accounts.mjs
 */

import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAcd0udkUWEVqYFk7YDciRcOkKRFcD4Jf4',
  authDomain: 'emerald-lakers---sixth-man.firebaseapp.com',
  projectId: 'emerald-lakers---sixth-man',
  storageBucket: 'emerald-lakers---sixth-man.firebasestorage.app',
  messagingSenderId: '551311322582',
  appId: '1:551311322582:web:0248f43cdfca6bcb43c877',
};

const TEST_ACCOUNTS = [
  { email: 'president@test.com',     displayName: 'Test President',         role: 'president' },
  { email: 'vp@test.com',            displayName: 'Test Vice President',    role: 'vice_president' },
  { email: 'girlscoord@test.com',    displayName: 'Test Girls Coordinator', role: 'girls_coordinator' },
  { email: 'boyscoord@test.com',     displayName: 'Test Boys Coordinator',  role: 'boys_coordinator' },
  { email: 'youthhead@test.com',     displayName: 'Test Youth Head Coach',  role: 'youth_head_coach' },
  { email: 'assessor@test.com',      displayName: 'Test Tryout Assessor',   role: 'tryout_assessor' },
];

const PASSWORD = 'Test123!';
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'Admin123!';

async function main() {
  console.log('=== Creating Test Accounts for New Roles ===\n');

  // Main app: sign in as admin for Firestore writes
  const adminApp = initializeApp(firebaseConfig, 'AdminApp');
  const adminAuth = getAuth(adminApp);
  const db = getFirestore(adminApp);

  console.log('Signing in as admin...');
  await signInWithEmailAndPassword(adminAuth, ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log('Admin signed in.\n');

  const results = [];

  for (const account of TEST_ACCOUNTS) {
    // Secondary app: create Auth account without affecting admin session
    const tempApp = initializeApp(firebaseConfig, `temp-${account.role}`);
    const tempAuth = getAuth(tempApp);

    let uid;
    let authCreated = false;

    try {
      const result = await createUserWithEmailAndPassword(
        tempAuth,
        account.email,
        PASSWORD
      );
      uid = result.user.uid;
      authCreated = true;
      await signOut(tempAuth);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        // Auth account exists from previous run — sign in to get UID
        const existing = await signInWithEmailAndPassword(
          tempAuth,
          account.email,
          PASSWORD
        );
        uid = existing.user.uid;
        await signOut(tempAuth);
      } else {
        console.error(`  [FAIL] ${account.role.padEnd(20)} -> ${account.email}: ${err.message}`);
        results.push({ success: false, ...account });
        await deleteApp(tempApp);
        continue;
      }
    }

    await deleteApp(tempApp);

    // Write Firestore profile using admin's auth context
    try {
      const profile = {
        uid,
        email: account.email,
        displayName: account.displayName,
        role: account.role,
        createdAt: new Date().toISOString(),
        createdByAdmin: true,
        photoURL: null,
      };

      await setDoc(doc(db, 'users', uid), profile);
      const tag = authCreated ? 'CREATED' : 'FIXED';
      console.log(`  [${tag}] ${account.role.padEnd(20)} -> ${account.email} (uid: ${uid})`);
      results.push({ success: true, ...account });
    } catch (err) {
      console.error(`  [FAIL] ${account.role.padEnd(20)} -> Firestore write: ${err.message}`);
      results.push({ success: false, ...account });
    }
  }

  await signOut(adminAuth);
  await deleteApp(adminApp);

  const created = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n=== Summary ===`);
  console.log(`Successful: ${created}  |  Failed: ${failed}`);
  console.log(`\nAll test accounts use password: ${PASSWORD}`);
  console.log('Users should change their password after first login.\n');

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
