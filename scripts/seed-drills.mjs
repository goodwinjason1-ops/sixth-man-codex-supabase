import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAcd0udkUWEVqYFk7YDciRcOkKRFcD4Jf4',
  authDomain: 'emerald-lakers---sixth-man.firebaseapp.com',
  projectId: 'emerald-lakers---sixth-man',
  storageBucket: 'emerald-lakers---sixth-man.firebasestorage.app',
  messagingSenderId: '551311322582',
  appId: '1:551311322582:web:0248f43cdfca6bcb43c877'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sign in as admin so Firestore rules allow writes
console.log('Signing in as admin...');
await signInWithEmailAndPassword(auth, 'admin@test.com', 'Admin123!');
console.log('Authenticated successfully.\n');

// Delete all existing drills first
console.log('Deleting existing drills...');
const existingDrills = await getDocs(collection(db, 'drills'));
let deleteCount = 0;
for (const docSnap of existingDrills.docs) {
  await deleteDoc(doc(db, 'drills', docSnap.id));
  deleteCount++;
}
console.log(`Deleted ${deleteCount} existing drills.\n`);

// Import seed data
const seedDrills = (await import('../src/data/seedDrills.js')).default;

console.log(`Seeding ${seedDrills.length} drills...`);

let count = 0;
for (const drill of seedDrills) {
  try {
    const docRef = await addDoc(collection(db, 'drills'), {
      ...drill,
      createdBy: auth.currentUser.uid,
      ratings: { average: 0, count: 0 },
      usageCount: 0,
      createdAt: serverTimestamp()
    });
    count++;
    console.log(`  ${count}. ${drill.name} [${drill.category}] (Level ${drill.difficulty}) (${docRef.id})`);
  } catch (err) {
    console.error(`  FAILED: ${drill.name} - ${err.message}`);
  }
}

console.log(`\nDone! Seeded ${count}/${seedDrills.length} drills.`);
process.exit(0);
