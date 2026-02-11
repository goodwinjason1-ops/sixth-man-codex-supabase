import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from './firebase';

/**
 * Subscribe to real-time user list.
 * @param {Function} callback - receives array of user objects
 * @returns {Function} unsubscribe
 */
export function subscribeToUsers(callback) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(users);
  }, (err) => {
    console.error('subscribeToUsers error:', err);
    callback([]);
  });
}

/**
 * Update any fields on a user document (admin only).
 */
export async function updateUser(uid, updates) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
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
export async function disableUser(uid, adminUid) {
  return updateUser(uid, {
    disabled: true,
    disabledAt: new Date().toISOString(),
    disabledBy: adminUid,
  });
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
export async function softDeleteUser(uid, adminUid) {
  return updateUser(uid, {
    deleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: adminUid,
  });
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
