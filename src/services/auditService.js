import {
  collection, addDoc, query, orderBy, limit, where,
  onSnapshot, getDocs, startAfter, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Log an activity to the audit_logs collection.
 * Fire-and-forget — silently catches errors so it never blocks the caller.
 */
export async function logActivity(actorInfo, action, description, metadata = {}) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      userId: actorInfo.uid || null,
      userName: actorInfo.displayName || actorInfo.email || 'Unknown',
      userRole: actorInfo.role || null,
      description,
      metadata,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('[audit] logActivity error (non-blocking):', err);
  }
}

/**
 * Subscribe to real-time audit logs with optional filters.
 * @param {{ actionType?: string, limitCount?: number }} filters
 * @param {Function} callback - receives array of log entries
 * @returns {Function} unsubscribe
 */
export function subscribeToAuditLogs(filters, callback) {
  const constraints = [orderBy('createdAt', 'desc')];

  if (filters.actionType && filters.actionType !== 'all') {
    constraints.unshift(where('action', '==', filters.actionType));
  }

  constraints.push(limit(filters.limitCount || 50));

  const q = query(collection(db, 'audit_logs'), ...constraints);

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() || null
    }));
    callback(logs);
  }, (err) => {
    console.error('[audit] subscribeToAuditLogs error:', err);
    callback([]);
  });
}

/**
 * Fetch recent activity (one-shot) for the admin dashboard.
 */
export async function fetchRecentActivity(limitCount = 4) {
  try {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() || null
    }));
  } catch (err) {
    console.error('[audit] fetchRecentActivity error:', err);
    return [];
  }
}

/**
 * Load more logs after a cursor document for pagination.
 */
export async function fetchMoreLogs(lastDoc, filters = {}, limitCount = 50) {
  try {
    const constraints = [orderBy('createdAt', 'desc')];

    if (filters.actionType && filters.actionType !== 'all') {
      constraints.unshift(where('action', '==', filters.actionType));
    }

    constraints.push(startAfter(lastDoc));
    constraints.push(limit(limitCount));

    const q = query(collection(db, 'audit_logs'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() || null
    }));
  } catch (err) {
    console.error('[audit] fetchMoreLogs error:', err);
    return [];
  }
}

/**
 * Map action types to display-friendly icon names and labels.
 */
export const ACTION_TYPES = {
  'user.login': { label: 'User Login', icon: 'LogIn', category: 'user' },
  'user.created': { label: 'User Created', icon: 'UserPlus', category: 'user' },
  'user.updated': { label: 'User Updated', icon: 'UserCog', category: 'user' },
  'user.disabled': { label: 'User Disabled', icon: 'UserX', category: 'user' },
  'user.deleted': { label: 'User Deleted', icon: 'Trash2', category: 'user' },
  'team.created': { label: 'Team Created', icon: 'Shield', category: 'team' },
  'team.updated': { label: 'Team Updated', icon: 'Shield', category: 'team' },
  'team.deleted': { label: 'Team Deleted', icon: 'Trash2', category: 'team' },
  'schedule.game_created': { label: 'Game Scheduled', icon: 'Calendar', category: 'schedule' },
  'schedule.training_created': { label: 'Training Scheduled', icon: 'Dumbbell', category: 'schedule' },
  'schedule.deleted': { label: 'Event Deleted', icon: 'Trash2', category: 'schedule' },
  'assessment.submitted': { label: 'Assessment Submitted', icon: 'ClipboardCheck', category: 'assessment' },
  'metrics.updated': { label: 'Metrics Updated', icon: 'Target', category: 'settings' }
};
