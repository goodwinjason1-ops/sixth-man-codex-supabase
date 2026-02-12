/**
 * Seed coach accreditation documents for test accounts.
 * Run with: node scripts/seed-coach-accreditations.mjs
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAcd0udkUWEVqYFk7YDciRcOkKRFcD4Jf4',
  authDomain: 'emerald-lakers---sixth-man.firebaseapp.com',
  projectId: 'emerald-lakers---sixth-man',
  storageBucket: 'emerald-lakers---sixth-man.firebasestorage.app',
  messagingSenderId: '551311322582',
  appId: '1:551311322582:web:0248f43cdfca6bcb43c877',
};

const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'Admin123!';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function findUserByEmail(email) {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { uid: d.id, ...d.data() };
}

const SEED_DATA = [
  {
    email: 'admin@test.com',
    coachName: 'Admin User',
    coaching: {
      level: 'Development Coach',
      certificateNumber: 'BA-DEV-2024-001',
      issueDate: '2024-06-15',
      expiryDate: '2027-06-15',
    },
    firstAid: {
      level: 'Level 2',
      certificateNumber: 'FA-L2-2024-042',
      issueDate: '2024-09-01',
      expiryDate: '2027-09-01',
    },
    wwcc: {
      checkNumber: 'WWC0012345A',
      issueDate: '2023-01-10',
      expiryDate: '2028-01-10',
      state: 'VIC',
    },
    status: 'compliant',
  },
  {
    email: 'coachcoord@test.com',
    coachName: 'Coach Coordinator',
    coaching: {
      level: 'State Level',
      certificateNumber: 'BA-SL-2023-088',
      issueDate: '2023-03-20',
      expiryDate: '2027-03-20',
    },
    firstAid: {
      level: 'Level 1',
      certificateNumber: 'FA-L1-2023-177',
      issueDate: '2023-12-01',
      expiryDate: '2026-12-01',
    },
    wwcc: {
      checkNumber: 'WWC0098765B',
      issueDate: '2022-06-15',
      expiryDate: '2027-06-15',
      state: 'VIC',
    },
    status: 'compliant',
  },
  {
    email: 'youthhead@test.com',
    coachName: 'Youth Head Coach',
    coaching: {
      level: 'Community Coach',
      certificateNumber: 'BA-CC-2024-210',
      issueDate: '2024-01-10',
      expiryDate: '2027-01-10',
    },
    firstAid: {
      level: 'CPR Only',
      certificateNumber: 'CPR-2025-033',
      issueDate: '2025-04-15',
      expiryDate: '2026-04-15',
    },
    wwcc: {
      checkNumber: 'WWC0054321C',
      issueDate: '2023-08-01',
      expiryDate: '2028-08-01',
      state: 'VIC',
    },
    status: 'expiring',
  },
  {
    email: 'youthcoach@test.com',
    coachName: 'Test Youth Coach',
    coaching: {
      level: 'Community Coach',
      certificateNumber: 'BA-CC-2023-155',
      issueDate: '2023-07-01',
      expiryDate: '2027-07-01',
    },
    firstAid: {
      level: 'Level 1',
      certificateNumber: 'FA-L1-2024-099',
      issueDate: '2024-05-20',
      expiryDate: '2027-05-20',
    },
    wwcc: {
      checkNumber: 'WWC0077777D',
      issueDate: '2020-11-01',
      expiryDate: '2025-11-01',
      state: 'VIC',
    },
    status: 'expired',
  },
];

async function main() {
  console.log('Signing in as admin...');
  await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log('Signed in.\n');

  for (const seed of SEED_DATA) {
    const user = await findUserByEmail(seed.email);
    if (!user) {
      console.log(`  SKIP: ${seed.email} — user not found`);
      continue;
    }

    const docRef = doc(db, 'coach_accreditations', `accred_${user.uid}`);
    await setDoc(docRef, {
      coachId: user.uid,
      coachName: seed.coachName,
      coaching: seed.coaching,
      firstAid: seed.firstAid,
      wwcc: seed.wwcc,
      status: seed.status,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    });
    console.log(`  OK: ${seed.email} (${user.uid})`);
  }

  console.log('\nDone. Seeded', SEED_DATA.length, 'accreditation records.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
