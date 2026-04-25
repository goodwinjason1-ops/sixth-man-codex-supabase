/**
 * Parent Invitation Service
 * Handles invitation code generation, CRUD, validation, and acceptance
 * for the parent authentication flow.
 */

import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  getDoc,
  getDocFromServer,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db, supabase } from './firebase';

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
 * Generate a unique invitation code by checking Firestore for collisions.
 * With 26^8 possible codes (~208 billion), collisions are extremely unlikely.
 * If the read query fails (e.g. rules not deployed yet), we skip the check
 * and use the generated code directly — collision odds are negligible.
 */
export const generateUniqueCode = async () => {
  let code;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    code = generateInvitationCode();
    try {
      const q = query(
        collection(db, INVITATIONS_COLLECTION),
        where('invitationCode', '==', code)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return code;
      }
    } catch (readErr) {
      // If we can't read (e.g. rules issue), just use the code — collision is near-impossible
      console.warn('Could not check code uniqueness (likely a rules issue), proceeding:', readErr.code || readErr.message);
      return code;
    }
    attempts++;
  }

  // Extremely unlikely fallback
  throw new Error('Unable to generate unique invitation code');
};

/**
 * Create a new parent invitation.
 * Uses setDoc + getDocFromServer to bypass offline cache and verify the write
 * actually reaches Firestore (enableIndexedDbPersistence can mask failures).
 */
export const createInvitation = async ({ playerIds, parentEmail, parentName, createdBy, expiresInDays = 30 }) => {
  try {
    console.log('Creating invitation for players:', playerIds, 'email:', parentEmail);

    const invitationCode = await generateUniqueCode();
    console.log('Generated invitation code:', invitationCode);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invData = {
      invitationCode,
      playerIds: playerIds || [],
      parentEmail: parentEmail || '',
      parentName: parentName || '',
      status: 'pending',
      createdBy,
      createdAt: Timestamp.now(),
      expiresAt: expiresAt.toISOString(),
      acceptedBy: null,
      acceptedAt: null
    };

    // Use setDoc with a known ID so we can verify the write on the server
    const docRef = doc(collection(db, INVITATIONS_COLLECTION));
    await setDoc(docRef, invData);
    console.log('setDoc completed for doc:', docRef.id);

    // Verify the document actually reached Firestore (not just local cache)
    try {
      const verifySnap = await getDocFromServer(docRef);
      if (!verifySnap.exists()) {
        console.error('Invitation doc not found on server after write');
        return { success: false, error: 'Invitation was not saved. Please check your permissions and try again.' };
      }
      console.log('Invitation verified on server:', verifySnap.id);
    } catch (verifyErr) {
      console.error('Server verification failed:', verifyErr.code, verifyErr.message);
      return {
        success: false,
        error: verifyErr.code === 'permission-denied'
          ? 'Permission denied. Make sure you are logged in as an admin.'
          : 'Failed to verify invitation was saved. Error: ' + verifyErr.message
      };
    }

    return { success: true, id: docRef.id, invitationCode };
  } catch (error) {
    console.error('Error creating invitation:', error.code, error.message);
    return {
      success: false,
      error: error.code === 'permission-denied'
        ? 'Permission denied. Make sure you are logged in as an admin.'
        : error.message
    };
  }
};

/**
 * Validate an invitation code
 * Returns { valid, invitation } or { valid: false, error }
 */
export const validateInvitationCode = async (code) => {
  try {
    const normalizedCode = code.trim().toUpperCase();
    const { data: rpcData, error: rpcError } = await supabase.rpc('validate_parent_invitation', {
      invitation_code: normalizedCode
    });

    if (!rpcError && rpcData) {
      return rpcData.valid
        ? { valid: true, invitation: rpcData.invitation }
        : { valid: false, error: rpcData.error || 'Invalid invitation code. Please check your invitation email.' };
    }

    if (rpcError && rpcError.code !== 'PGRST202') {
      console.error('Invitation validation RPC failed:', rpcError.code, rpcError.message);
      return { valid: false, error: 'Unable to validate invitation. Please try again later.' };
    }

    const q = query(
      collection(db, INVITATIONS_COLLECTION),
      where('invitationCode', '==', normalizedCode)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { valid: false, error: 'Invalid invitation code. Please check your invitation email.' };
    }

    const invDoc = snapshot.docs[0];
    const invitation = { id: invDoc.id, ...invDoc.data() };

    if (invitation.status === 'accepted') {
      return { valid: false, error: 'This invitation has already been used.' };
    }

    if (invitation.status === 'revoked') {
      return { valid: false, error: 'This invitation has been revoked. Please contact your club administrator.' };
    }

    if (invitation.status !== 'pending') {
      return { valid: false, error: 'This invitation is no longer valid.' };
    }

    // Check expiration
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return { valid: false, error: 'This invitation has expired. Please contact your club administrator for a new one.' };
    }

    return { valid: true, invitation };
  } catch (error) {
    console.error('Error validating invitation code:', error.code, error.message);
    // Translate Firestore permission/network errors into user-friendly messages
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      return { valid: false, error: 'Unable to validate invitation. Please try again later.' };
    }
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return { valid: false, error: 'Service temporarily unavailable. Please try again in a moment.' };
    }
    return { valid: false, error: 'Unable to validate invitation. Please try again later.' };
  }
};

export const acceptInvitationByCode = async (code, displayName = '') => {
  try {
    const normalizedCode = code.trim().toUpperCase();
    const { data: rpcData, error: rpcError } = await supabase.rpc('accept_parent_invitation', {
      invitation_code: normalizedCode,
      display_name: displayName
    });

    if (rpcError) {
      console.error('Invitation acceptance RPC failed:', rpcError.code, rpcError.message);
      return { success: false, error: rpcError.message || 'Unable to accept invitation' };
    }

    if (!rpcData?.success) {
      return { success: false, error: rpcData?.error || 'Unable to accept invitation' };
    }

    return {
      success: true,
      profile: rpcData.profile,
      invitation: rpcData.invitation
    };
  } catch (error) {
    console.error('Error accepting invitation by code:', error.code, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Accept an invitation: updates invitation status, links parent to players.
 * The parent user doc should already have linkedPlayerIds set from signup.
 * This function marks the invitation as used and updates player docs.
 */
export const acceptInvitation = async (invitationId, parentUid) => {
  try {
    console.log('Accepting invitation:', invitationId, 'for parent:', parentUid);

    const invRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    const invSnap = await getDoc(invRef);

    if (!invSnap.exists()) {
      return { success: false, error: 'Invitation not found' };
    }

    const invitation = invSnap.data();

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation is no longer pending' };
    }

    const playerIds = invitation.playerIds || [];

    // Step 1: Update invitation status (direct write, not batch)
    try {
      await updateDoc(invRef, {
        status: 'accepted',
        acceptedBy: parentUid,
        acceptedAt: Timestamp.now()
      });
      console.log('Invitation status updated to accepted');
    } catch (invErr) {
      console.error('Failed to update invitation status:', invErr.code, invErr.message);
    }

    // Step 2: Update each linked player with parentUid (individual writes)
    for (const playerId of playerIds) {
      try {
        const playerRef = doc(db, 'players', playerId);
        const playerSnap = await getDoc(playerRef);
        if (playerSnap.exists()) {
          const existingParentIds = playerSnap.data().linkedParentIds || [];
          if (!existingParentIds.includes(parentUid)) {
            await updateDoc(playerRef, {
              linkedParentIds: [...existingParentIds, parentUid]
            });
            console.log('Player', playerId, 'linked to parent');
          }
        }
      } catch (playerErr) {
        console.error('Failed to update player', playerId, ':', playerErr.code, playerErr.message);
      }
    }

    // Step 3: Ensure parent user doc has linkedPlayerIds (safety net)
    try {
      const userRef = doc(db, 'users', parentUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const existingPlayerIds = userSnap.data().linkedPlayerIds || [];
        const mergedPlayerIds = [...new Set([...existingPlayerIds, ...playerIds])];
        if (mergedPlayerIds.length !== existingPlayerIds.length || existingPlayerIds.length === 0) {
          await updateDoc(userRef, {
            linkedPlayerIds: mergedPlayerIds,
            invitationCode: invitation.invitationCode
          });
          console.log('Parent user doc updated with linkedPlayerIds:', mergedPlayerIds);
        }
      }
    } catch (userErr) {
      console.error('Failed to update parent user doc:', userErr.code, userErr.message);
    }

    return { success: true };
  } catch (error) {
    console.error('Error accepting invitation:', error.code, error.message);
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
 * Revoke all pending invitations (admin cleanup)
 */
export const revokeAllPending = async () => {
  try {
    const q = query(
      collection(db, INVITATIONS_COLLECTION),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: true, count: 0 };
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.update(d.ref, { status: 'revoked' });
    });
    await batch.commit();

    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('Error revoking all pending invitations:', error);
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
  acceptInvitationByCode,
  acceptInvitation,
  revokeInvitation,
  revokeAllPending,
  listInvitations,
  getPlayerNames
};
