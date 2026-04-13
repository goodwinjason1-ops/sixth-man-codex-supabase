/**
 * Season Game Scouting Service
 * Handles all Firestore operations for scout evaluations during season games
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

const SCOUT_EVALUATIONS = 'scout_evaluations';

// Same 5 metrics as tryout system, with matching IDs for consistency
export const SCOUT_METRICS = [
  { id: 'skillsTechnique', name: 'Skills & Technique', description: 'Ball handling, passing, catching, shooting form' },
  { id: 'gameAwareness', name: 'Game Awareness', description: 'Court awareness, decision making, positioning' },
  { id: 'athleticism', name: 'Athleticism', description: 'Speed, agility, coordination, jumping ability' },
  { id: 'attitudeCoachability', name: 'Attitude & Coachability', description: 'Listens, applies feedback, positive attitude, effort' },
  { id: 'teamworkCommunication', name: 'Teamwork & Communication', description: 'Works with teammates, communicates on court' }
];

// Reuse tryout scoring levels and colors
export { TRYOUT_LEVEL_LABELS, TRYOUT_LEVEL_COLORS, TRYOUT_SCORING_CRITERIA } from './tryoutService';

// Map scout metric IDs to tryout metric IDs for combined scoring
export const SCOUT_TO_TRYOUT_METRIC_MAP = {
  skillsTechnique: 'ballSkills',
  gameAwareness: 'gameUnderstanding',
  athleticism: 'athleticism',
  attitudeCoachability: 'coachability',
  teamworkCommunication: 'effort'
};

// ============================================
// SCOUT EVALUATIONS
// ============================================

/**
 * Save (create or update) a scout evaluation
 */
export const saveScoutEvaluation = async (evalData) => {
  try {
    const existingQuery = query(
      collection(db, SCOUT_EVALUATIONS),
      where('gameId', '==', evalData.gameId),
      where('playerId', '==', evalData.playerId),
      where('scoutId', '==', evalData.scoutId)
    );
    const existingSnap = await getDocs(existingQuery);

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      await updateDoc(doc(db, SCOUT_EVALUATIONS, existingDoc.id), {
        ...evalData,
        updatedAt: serverTimestamp()
      });
      return { success: true, id: existingDoc.id, updated: true };
    } else {
      const docRef = await addDoc(collection(db, SCOUT_EVALUATIONS), {
        ...evalData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id, updated: false };
    }
  } catch (error) {
    console.error('Error saving scout evaluation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to scout's evaluations for a game (real-time)
 */
export const subscribeScoutEvaluations = (gameId, scoutId, callback) => {
  const q = query(
    collection(db, SCOUT_EVALUATIONS),
    where('gameId', '==', gameId),
    where('scoutId', '==', scoutId)
  );
  return onSnapshot(q, (snapshot) => {
    const evals = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(evals);
  });
};

/**
 * Get all scout evaluations for a game
 */
export const getGameScoutEvaluations = async (gameId) => {
  try {
    const q = query(
      collection(db, SCOUT_EVALUATIONS),
      where('gameId', '==', gameId)
    );
    const snapshot = await getDocs(q);
    return { success: true, data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get all scout evaluations (admin view), optionally filtered
 */
export const getAllScoutEvaluations = async (filters = {}) => {
  try {
    let q = collection(db, SCOUT_EVALUATIONS);
    const constraints = [];

    if (filters.scoutId) constraints.push(where('scoutId', '==', filters.scoutId));
    if (filters.playerId) constraints.push(where('playerId', '==', filters.playerId));
    if (filters.teamId) constraints.push(where('teamId', '==', filters.teamId));
    if (filters.status) constraints.push(where('status', '==', filters.status));

    q = constraints.length > 0 ? query(q, ...constraints) : query(q);
    const snapshot = await getDocs(q);
    return { success: true, data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to all scout evaluations (admin real-time)
 */
export const subscribeAllScoutEvaluations = (callback) => {
  return onSnapshot(collection(db, SCOUT_EVALUATIONS), (snapshot) => {
    const evals = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(evals);
  });
};

/**
 * Get scout evaluations for a specific player (for combined view)
 */
export const getPlayerScoutEvaluations = async (playerId) => {
  try {
    const q = query(
      collection(db, SCOUT_EVALUATIONS),
      where('playerId', '==', playerId),
      where('status', '==', 'submitted')
    );
    const snapshot = await getDocs(q);
    return { success: true, data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Batch submit all draft evaluations for a scout + game
 */
export const batchSubmitScoutDrafts = async (gameId, scoutId) => {
  try {
    const q = query(
      collection(db, SCOUT_EVALUATIONS),
      where('gameId', '==', gameId),
      where('scoutId', '==', scoutId),
      where('status', '==', 'draft')
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { success: true, count: 0 };

    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.update(d.ref, { status: 'submitted', updatedAt: serverTimestamp() });
    });
    await batch.commit();
    return { success: true, count: snapshot.size };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================
// GAME SCOUT ASSIGNMENT
// ============================================

/**
 * Assign scouts to a game (updates the game document with scouts array)
 */
export const assignScoutsToGame = async (gameId, scouts) => {
  try {
    const docRef = doc(db, 'games', gameId);
    await updateDoc(docRef, {
      scouts: scouts,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get games assigned to a scout (by email or userId)
 */
export const getScoutAssignedGames = async (scoutUserId, scoutEmail) => {
  try {
    const q = query(collection(db, 'games'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const normalizedEmail = (scoutEmail || '').toLowerCase().trim();
    const allGames = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const assigned = allGames.filter(game => {
      const scouts = game.scouts || [];
      return scouts.some(s => {
        const sEmail = (typeof s === 'string' ? s : (s.email || '')).toLowerCase().trim();
        const sUserId = typeof s === 'object' ? s.userId : null;
        return (normalizedEmail && sEmail === normalizedEmail) || (sUserId && sUserId === scoutUserId);
      });
    });
    return { success: true, data: assigned };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Fetch all users who could be scouts (for assignment UI)
 */
export const fetchPotentialScouts = async () => {
  try {
    const q = query(collection(db, 'users'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        displayName: data.displayName || data.name || '',
        email: data.email || '',
        role: data.role || ''
      };
    });
  } catch (error) {
    return [];
  }
};

// ============================================
// COMBINED SCORING (Tryout + Scouting)
// ============================================

/**
 * Calculate average scout scores for a player across all submitted evaluations
 */
export const calculatePlayerScoutAverage = (scoutEvals) => {
  if (!scoutEvals || scoutEvals.length === 0) return null;

  const metricIds = SCOUT_METRICS.map(m => m.id);
  const averages = {};

  metricIds.forEach(id => {
    const values = scoutEvals.map(e => e.ratings?.[id]).filter(v => typeof v === 'number' && v > 0);
    averages[id] = values.length > 0
      ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      : null;
  });

  const allValues = Object.values(averages).filter(v => v !== null);
  const overallAvg = allValues.length > 0
    ? +(allValues.reduce((a, b) => a + b, 0) / allValues.length).toFixed(1)
    : null;

  return { averages, overallAvg, evalCount: scoutEvals.length };
};

/**
 * Calculate combined score (tryout + scouting) with configurable weighting
 */
export const calculateCombinedScore = (tryoutAvg, scoutAvg, tryoutWeight = 0.6) => {
  const scoutWeight = 1 - tryoutWeight;

  if (tryoutAvg && scoutAvg) {
    return +(tryoutAvg * tryoutWeight + scoutAvg * scoutWeight).toFixed(1);
  }
  if (tryoutAvg) return tryoutAvg;
  if (scoutAvg) return scoutAvg;
  return null;
};
