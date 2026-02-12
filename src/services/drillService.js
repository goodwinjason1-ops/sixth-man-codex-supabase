import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, orderBy, where, limit, serverTimestamp, increment
} from 'firebase/firestore';
import { db } from './firebase';

const DRILLS_COLLECTION = 'drills';

/**
 * Fetch all drills with optional filters
 */
export async function fetchDrills(filters = {}) {
  const constraints = [];

  if (filters.category) {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters.difficulty) {
    constraints.push(where('difficulty', '==', filters.difficulty));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  if (filters.limit) {
    constraints.push(limit(filters.limit));
  }

  const q = query(collection(db, DRILLS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Fetch a single drill by ID
 */
export async function fetchDrill(drillId) {
  const docRef = doc(db, DRILLS_COLLECTION, drillId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

/**
 * Create a new drill
 */
export async function createDrill(drillData) {
  const docRef = await addDoc(collection(db, DRILLS_COLLECTION), {
    ...drillData,
    ratings: { average: 0, count: 0 },
    usageCount: 0,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

/**
 * Update an existing drill
 */
export async function updateDrill(drillId, updates) {
  const docRef = doc(db, DRILLS_COLLECTION, drillId);
  await updateDoc(docRef, updates);
}

/**
 * Delete a drill
 */
export async function deleteDrill(drillId) {
  const docRef = doc(db, DRILLS_COLLECTION, drillId);
  await deleteDoc(docRef);
}

/**
 * Rate a drill — recalculates running average
 */
export async function rateDrill(drillId, rating) {
  const drill = await fetchDrill(drillId);
  if (!drill) throw new Error('Drill not found');

  const currentAvg = drill.ratings?.average || 0;
  const currentCount = drill.ratings?.count || 0;
  const newCount = currentCount + 1;
  const newAvg = ((currentAvg * currentCount) + rating) / newCount;

  await updateDoc(doc(db, DRILLS_COLLECTION, drillId), {
    'ratings.average': Math.round(newAvg * 10) / 10,
    'ratings.count': newCount
  });
}

/**
 * Increment usage count
 */
export async function incrementDrillUsage(drillId) {
  await updateDoc(doc(db, DRILLS_COLLECTION, drillId), {
    usageCount: increment(1)
  });
}

/**
 * Seed drills in batch
 */
export async function seedDrills(drills) {
  const results = [];
  for (const drill of drills) {
    const id = await createDrill(drill);
    results.push(id);
  }
  return results;
}
