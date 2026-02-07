/**
 * Parent Invitation Service
 * Handles invitation code generation, CRUD, validation, and acceptance
 * for the parent authentication flow.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

const INVITATIONS_COLLECTION = 'parent_invitations';

// Characters that avoid ambiguity (no 0/O/1/I/l)
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate an 8-char human-readable invitation code (XXXX-XXXX)
 */
export const generateInvitationCode = () => {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
};

/**
 * Generate a unique invitation code by checking Firestore for collisions
 */
export const generateUniqueCode = async () => {
  let code;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    code = generateInvitationCode();
    const q = query(
      collection(db, INVITATIONS_COLLECTION),
      where('invitationCode', '==', code)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return code;
    }
    attempts++;
  }

  // Extremely unlikely fallback
  throw new Error('Unable to generate unique invitation code');
};

/**
 * Create a new parent invitation
 */
export const createInvitation = async ({ playerIds, parentEmail, parentName, createdBy, expiresInDays = 30 }) => {
  try {
    const invitationCode = await generateUniqueCode();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const docRef = await addDoc(collection(db, INVITATIONS_COLLECTION), {
      invitationCode,
      playerIds: playerIds || [],
      parentEmail: parentEmail || '',
      parentName: parentName || '',
      status: 'pending',
      createdBy,
      createdAt: serverTimestamp(),
      expiresAt: expiresAt.toISOString(),
      acceptedBy: null,
      acceptedAt: null
    });

    return { success: true, id: docRef.id, invitationCode };
  } catch (error) {
    console.error('Error creating invitation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validate an invitation code
 * Returns { valid, invitation } or { valid: false, error }
 */
export const validateInvitationCode = async (code) => {
  try {
    const normalizedCode = code.trim().toUpperCase();
    const q = query(
      collection(db, INVITATIONS_COLLECTION),
      where('invitationCode', '==', normalizedCode)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { valid: false, error: 'Invalid invitation code' };
    }

    const invDoc = snapshot.docs[0];
    const invitation = { id: invDoc.id, ...invDoc.data() };

    if (invitation.status === 'accepted') {
      return { valid: false, error: 'This invitation has already been used' };
    }

    if (invitation.status === 'revoked') {
      return { valid: false, error: 'This invitation has been revoked' };
    }

    if (invitation.status !== 'pending') {
      return { valid: false, error: 'This invitation is no longer valid' };
    }

    // Check expiration
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return { valid: false, error: 'This invitation has expired' };
    }

    return { valid: true, invitation };
  } catch (error) {
    console.error('Error validating invitation code:', error);
    return { valid: false, error: error.message };
  }
};

/**
 * Accept an invitation: updates invitation status, links parent to players
 * Uses a batch write for atomicity.
 */
export const acceptInvitation = async (invitationId, parentUid) => {
  try {
    const batch = writeBatch(db);
    const invRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    const invSnap = await getDoc(invRef);

    if (!invSnap.exists()) {
      return { success: false, error: 'Invitation not found' };
    }

    const invitation = invSnap.data();

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation is no longer pending' };
    }

    // Update invitation status
    batch.update(invRef, {
      status: 'accepted',
      acceptedBy: parentUid,
      acceptedAt: serverTimestamp()
    });

    // Update each linked player with parentUid
    const playerIds = invitation.playerIds || [];
    for (const playerId of playerIds) {
      const playerRef = doc(db, 'players', playerId);
      const playerSnap = await getDoc(playerRef);
      if (playerSnap.exists()) {
        const existingParentIds = playerSnap.data().linkedParentIds || [];
        if (!existingParentIds.includes(parentUid)) {
          batch.update(playerRef, {
            linkedParentIds: [...existingParentIds, parentUid]
          });
        }
      }
    }

    // Update parent user doc with linked player IDs and invitation code
    const userRef = doc(db, 'users', parentUid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const existingPlayerIds = userSnap.data().linkedPlayerIds || [];
      const mergedPlayerIds = [...new Set([...existingPlayerIds, ...playerIds])];
      batch.update(userRef, {
        linkedPlayerIds: mergedPlayerIds,
        invitationCode: invitation.invitationCode
      });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Revoke an invitation
 */
export const revokeInvitation = async (invitationId) => {
  try {
    const invRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    await updateDoc(invRef, {
      status: 'revoked'
    });
    return { success: true };
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * List all invitations (admin use)
 */
export const listInvitations = async () => {
  try {
    const q = query(
      collection(db, INVITATIONS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const invitations = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data: invitations };
  } catch (error) {
    console.error('Error listing invitations:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get player names for an array of player IDs
 */
export const getPlayerNames = async (playerIds) => {
  try {
    const names = [];
    for (const id of playerIds) {
      const playerSnap = await getDoc(doc(db, 'players', id));
      if (playerSnap.exists()) {
        names.push({ id, name: playerSnap.data().name || 'Unknown' });
      }
    }
    return names;
  } catch (error) {
    console.error('Error getting player names:', error);
    return [];
  }
};

export default {
  generateInvitationCode,
  generateUniqueCode,
  createInvitation,
  validateInvitationCode,
  acceptInvitation,
  revokeInvitation,
  listInvitations,
  getPlayerNames
};
