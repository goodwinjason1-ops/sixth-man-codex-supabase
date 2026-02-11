import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { MATCH_METRICS, MATCH_AGE_GROUPS } from '../data/matchBenchmarks';

/**
 * Get custom metrics for an age group from Firestore.
 * Returns null if no custom doc exists.
 */
export async function getMetricsForAgeGroup(ageGroupId) {
  try {
    const docRef = doc(db, 'assessment_metrics', ageGroupId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (err) {
    console.error('[metrics] getMetricsForAgeGroup error:', err);
    return null;
  }
}

/**
 * Get metrics with fallback to the default MATCH_METRICS constant.
 */
export async function getMetricsWithFallback(ageGroupId) {
  const custom = await getMetricsForAgeGroup(ageGroupId);
  if (custom && custom.metrics && custom.metrics.length > 0) {
    return custom.metrics;
  }
  // Return the default 6 metrics
  return MATCH_METRICS.map((m, i) => ({
    id: m.id,
    name: m.name,
    icon: m.icon,
    description: m.description,
    order: i
  }));
}

/**
 * Save custom metrics for an age group.
 */
export async function updateMetricsForAgeGroup(ageGroupId, metrics, userId) {
  try {
    const ageGroup = MATCH_AGE_GROUPS.find(ag => ag.id === ageGroupId);
    await setDoc(doc(db, 'assessment_metrics', ageGroupId), {
      ageGroupId,
      ageGroupName: ageGroup?.name || ageGroupId,
      metrics,
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    }, { merge: true });
    return { success: true };
  } catch (err) {
    console.error('[metrics] updateMetricsForAgeGroup error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Seed all age groups with the default MATCH_METRICS.
 */
export async function seedDefaultMetrics() {
  const results = [];
  for (const ag of MATCH_AGE_GROUPS) {
    const metrics = MATCH_METRICS.map((m, i) => ({
      id: m.id,
      name: m.name,
      icon: m.icon,
      description: m.description,
      order: i
    }));
    const result = await updateMetricsForAgeGroup(ag.id, metrics, 'system');
    results.push({ ageGroupId: ag.id, ...result });
  }
  return results;
}

/**
 * Subscribe to real-time metrics for an age group.
 */
export function subscribeToMetrics(ageGroupId, callback) {
  const docRef = doc(db, 'assessment_metrics', ageGroupId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      // Return defaults
      callback({
        ageGroupId,
        metrics: MATCH_METRICS.map((m, i) => ({
          id: m.id,
          name: m.name,
          icon: m.icon,
          description: m.description,
          order: i
        }))
      });
    }
  }, (err) => {
    console.error('[metrics] subscribeToMetrics error:', err);
    callback(null);
  });
}
