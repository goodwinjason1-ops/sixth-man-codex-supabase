/**
 * Create coach_coordinator test account.
 * Run with: node scripts/create-coach-coordinator.mjs
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

async function main() {
  console.log('=== Creating Coach Coordinator Test Account ===\n');

  // Sign in as admin for Firestore writes
  const adminApp = initializeApp(firebaseConfig, 'AdminApp');
  const adminAuth = getAuth(adminApp);
  const db = getFirestore(adminApp);

  await signInWithEmailAndPassword(adminAuth, 'admin@test.com', 'Admin123!');
  console.log('Admin signed in.\n');

  // Create auth account via secondary app
  const tempApp = initializeApp(firebaseConfig, 'TempApp');
  const tempAuth = getAuth(tempApp);

  let uid;
  try {
    const result = await createUserWithEmailAndPassword(tempAuth, 'coachcoord@test.com', 'Test123!');
    uid = result.user.uid;
    await signOut(tempAuth);
    console.log('  Auth account created.');
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const existing = await signInWithEmailAndPassword(tempAuth, 'coachcoord@test.com', 'Test123!');
      uid = existing.user.uid;
      await signOut(tempAuth);
      console.log('  Auth account already exists, using existing.');
    } else {
      throw err;
    }
  }

  await deleteApp(tempApp);

  // Write Firestore profile using admin auth
  const profile = {
    uid,
    email: 'coachcoord@test.com',
    displayName: 'Coach Coordinator',
    role: 'coach_coordinator',
    createdAt: new Date().toISOString(),
    createdByAdmin: true,
    photoURL: null,
  };

  await setDoc(doc(db, 'users', uid), profile);
  console.log(`  Firestore profile created (uid: ${uid})`);

  await signOut(adminAuth);
  await deleteApp(adminApp);

  console.log('\n=== Done ===');
  console.log('Email:    coachcoord@test.com');
  console.log('Password: Test123!');
  console.log('Role:     coach_coordinator (Leadership)\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
