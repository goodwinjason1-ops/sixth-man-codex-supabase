import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from './firebase';
import { logActivity } from './auditService';

/**
 * Subscribe to real-time user list.
 * @param {Function} callback - receives array of user objects
 * @returns {Function} unsubscribe
 */
export function subscribeToUsers(callback) {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort client-side so docs without createdAt still appear
    users.sort((a, b) => {
      const aDate = a.createdAt || '';
      const bDate = b.createdAt || '';
      return bDate > aDate ? 1 : bDate < aDate ? -1 : 0;
    });
    callback(users);
  }, (err) => {
    console.error('subscribeToUsers error:', err);
    callback([]);
  });
}

/**
 * Update any fields on a user document (admin only).
 */
export async function updateUser(uid, updates, actorInfo) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    if (actorInfo) {
      logActivity(actorInfo, 'user.updated', `Updated user ${uid}`, { targetUid: uid, fields: Object.keys(updates) });
    }
    return { success: true };
  } catch (error) {
    console.error('updateUser error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Change a user's role.
 */
export async function updateUserRole(uid, newRole) {
  return updateUser(uid, { role: newRole });
}

/**
 * Disable a user account (soft — enforced at login).
 */
export async function disableUser(uid, adminUid, actorInfo) {
  const result = await updateUser(uid, {
    disabled: true,
    disabledAt: new Date().toISOString(),
    disabledBy: adminUid,
  });
  if (result.success && actorInfo) {
    logActivity(actorInfo, 'user.disabled', `Disabled user ${uid}`, { targetUid: uid });
  }
  return result;
}

/**
 * Re-enable a disabled user account.
 */
export async function enableUser(uid) {
  return updateUser(uid, {
    disabled: false,
    disabledAt: null,
    disabledBy: null,
  });
}

/**
 * Soft-delete a user (cannot remove Firebase Auth without Admin SDK).
 */
export async function softDeleteUser(uid, adminUid, actorInfo) {
  const result = await updateUser(uid, {
    deleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: adminUid,
  });
  if (result.success && actorInfo) {
    logActivity(actorInfo, 'user.deleted', `Deleted user ${uid}`, { targetUid: uid });
  }
  return result;
}

/**
 * Send a password-reset email via client SDK.
 */
export async function sendPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('sendPasswordReset error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Compute stats from a users array (call client-side).
 */
export function getUserStats(users) {
  const total = users.length;
  const active = users.filter(u => !u.disabled && !u.deleted).length;
  const disabled = users.filter(u => u.disabled && !u.deleted).length;
  const deleted = users.filter(u => u.deleted).length;

  const byRole = {};
  users.forEach(u => {
    if (!u.deleted) {
      byRole[u.role] = (byRole[u.role] || 0) + 1;
    }
  });

  return { total, active, disabled, deleted, byRole };
}
