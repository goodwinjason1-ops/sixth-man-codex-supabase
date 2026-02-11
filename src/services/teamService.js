import {
  collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc,
  query, where, getDocs, writeBatch, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import { logActivity } from './auditService';

/**
 * Subscribe to real-time team list.
 */
export function subscribeToTeams(callback) {
  return onSnapshot(collection(db, 'teams'), (snapshot) => {
    const teams = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort client-side so docs without createdAt still appear
    teams.sort((a, b) => {
      const aDate = a.createdAt || '';
      const bDate = b.createdAt || '';
      return bDate > aDate ? 1 : bDate < aDate ? -1 : 0;
    });
    callback(teams);
  }, (err) => {
    console.error('subscribeToTeams error:', err);
    callback([]);
  });
}

/**
 * Create a new team.
 */
export async function createTeam(teamData, actorInfo) {
  try {
    const docRef = await addDoc(collection(db, 'teams'), {
      ...teamData,
      playerIds: teamData.playerIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (actorInfo) {
      logActivity(actorInfo, 'team.created', `Created team: ${teamData.name || 'Unknown'}`, { teamId: docRef.id, teamName: teamData.name });
    }
    return { success: true, data: { id: docRef.id } };
  } catch (error) {
    console.error('createTeam error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a team document.
 */
export async function updateTeam(teamId, updates, actorInfo) {
  try {
    await updateDoc(doc(db, 'teams', teamId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    if (actorInfo) {
      logActivity(actorInfo, 'team.updated', `Updated team ${teamId}`, { teamId, fields: Object.keys(updates) });
    }
    return { success: true };
  } catch (error) {
    console.error('updateTeam error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a team.
 */
export async function deleteTeam(teamId, actorInfo) {
  try {
    await deleteDoc(doc(db, 'teams', teamId));
    if (actorInfo) {
      logActivity(actorInfo, 'team.deleted', `Deleted team ${teamId}`, { teamId });
    }
    return { success: true };
  } catch (error) {
    console.error('deleteTeam error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add a player to a team's playerIds array.
 */
export async function addPlayerToTeam(teamId, playerId) {
  try {
    await updateDoc(doc(db, 'teams', teamId), {
      playerIds: arrayUnion(playerId),
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('addPlayerToTeam error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove a player from a team's playerIds array.
 */
export async function removePlayerFromTeam(teamId, playerId) {
  try {
    await updateDoc(doc(db, 'teams', teamId), {
      playerIds: arrayRemove(playerId),
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('removePlayerFromTeam error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch users with coaching roles (for coach dropdown).
 */
export async function getCoaches() {
  try {
    const coachRoles = ['coach', 'youth_coach', 'youth_head_coach', 'coach_coordinator'];
    const q = query(collection(db, 'users'), where('role', 'in', coachRoles));
    const snapshot = await getDocs(q);
    return {
      success: true,
      data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })),
    };
  } catch (error) {
    console.error('getCoaches error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Parse CSV text into team objects. Returns { valid, errors }.
 * Expected format: team_name,age_group,gender,season,coach_email
 */
export function importTeamsFromCSV(csvText, coaches = []) {
  const lines = csvText.trim().split('\n');
  const valid = [];
  const errors = [];

  const validAgeGroups = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18'];
  const validGenders = ['boys', 'girls', 'mixed'];

  lines.forEach((line, idx) => {
    // Skip header row
    if (idx === 0 && line.toLowerCase().includes('team_name')) return;

    const cols = line.split(',').map(c => c.trim());
    if (cols.length < 4) {
      errors.push({ row: idx + 1, message: `Expected at least 4 columns, got ${cols.length}`, raw: line });
      return;
    }

    const [name, ageGroup, gender, season, coachEmail] = cols;
    const rowErrors = [];

    if (!name) rowErrors.push('Missing team name');
    if (!validAgeGroups.includes(ageGroup)) rowErrors.push(`Invalid age group "${ageGroup}"`);
    if (!validGenders.includes(gender)) rowErrors.push(`Invalid gender "${gender}"`);
    if (!season) rowErrors.push('Missing season');

    let coachId = null;
    let coachName = '';
    if (coachEmail) {
      const coach = coaches.find(c => c.email?.toLowerCase() === coachEmail.toLowerCase());
      if (!coach) {
        rowErrors.push(`Coach not found: ${coachEmail}`);
      } else {
        coachId = coach.id;
        coachName = coach.displayName || coach.email;
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ row: idx + 1, message: rowErrors.join('; '), raw: line });
    } else {
      valid.push({ name, ageGroup, gender, season, coachId, coachName, playerIds: [] });
    }
  });

  return { valid, errors };
}

/**
 * Batch-create multiple teams.
 */
export async function bulkCreateTeams(teams, createdBy) {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    teams.forEach(team => {
      const ref = doc(collection(db, 'teams'));
      batch.set(ref, {
        ...team,
        createdAt: now,
        updatedAt: now,
        createdBy: createdBy || null,
      });
    });

    await batch.commit();
    return { success: true, data: { count: teams.length } };
  } catch (error) {
    console.error('bulkCreateTeams error:', error);
    return { success: false, error: error.message };
  }
}
