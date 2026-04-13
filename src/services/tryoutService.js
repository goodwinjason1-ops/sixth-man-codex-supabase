/**
 * Tryout Evaluation Service
 * Handles all Firestore operations for tryout sessions and evaluations
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

// Collection names
const SESSIONS_COLLECTION = 'tryout_sessions';
const EVALUATIONS_COLLECTION = 'tryout_evaluations';

// ============================================
// TRYOUT SESSIONS
// ============================================

/**
 * Create a new tryout session
 */
export const createTryoutSession = async (sessionData) => {
  try {
    const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
      ...sessionData,
      status: 'draft',
      players: sessionData.players || [],
      assessors: sessionData.assessors || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating tryout session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a tryout session
 */
export const updateTryoutSession = async (sessionId, updates) => {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating tryout session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a tryout session
 */
export const deleteTryoutSession = async (sessionId) => {
  try {
    await deleteDoc(doc(db, SESSIONS_COLLECTION, sessionId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting tryout session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get a single tryout session
 */
export const getTryoutSession = async (sessionId) => {
  try {
    const docSnap = await getDoc(doc(db, SESSIONS_COLLECTION, sessionId));
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Session not found' };
  } catch (error) {
    console.error('Error getting tryout session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all tryout sessions
 */
export const getAllTryoutSessions = async () => {
  try {
    const q = query(collection(db, SESSIONS_COLLECTION), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: sessions };
  } catch (error) {
    console.error('Error getting tryout sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to tryout sessions (real-time updates)
 */
export const subscribeTryoutSessions = (callback) => {
  const q = query(collection(db, SESSIONS_COLLECTION), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(sessions);
  });
};

/**
 * Get sessions assigned to a specific assessor
 */
export const getAssessorSessions = async (assessorUserId, assessorEmail) => {
  try {
    // Fetch all non-draft sessions
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('status', 'in', ['active', 'completed', 'closed'])
    );
    const snapshot = await getDocs(q);
    const normalizedEmail = (assessorEmail || '').toLowerCase().trim();
    const allSessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter sessions where assessor is assigned (match by userId or email, case-insensitive)
    const sessions = allSessions.filter(session => {
      const assessors = session.assessors || [];
      return assessors.some(a => {
        // Handle both object format {email: "..."} and string format
        const aEmail = (typeof a === 'string' ? a : (a.email || '')).toLowerCase().trim();
        const aUserId = typeof a === 'object' ? a.userId : null;
        const emailMatch = normalizedEmail && aEmail === normalizedEmail;
        const uidMatch = aUserId && aUserId === assessorUserId;
        return emailMatch || uidMatch;
      });
    });
    return { success: true, data: sessions };
  } catch (error) {
    console.error('Error getting assessor sessions:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// TRYOUT EVALUATIONS
// ============================================

/**
 * Create or update an evaluation
 */
export const saveEvaluation = async (evaluationData) => {
  try {
    // Check if evaluation already exists
    const existingQuery = query(
      collection(db, EVALUATIONS_COLLECTION),
      where('sessionId', '==', evaluationData.sessionId),
      where('playerId', '==', evaluationData.playerId),
      where('assessorId', '==', evaluationData.assessorId)
    );
    const existingSnap = await getDocs(existingQuery);

    if (!existingSnap.empty) {
      // Update existing evaluation
      const existingDoc = existingSnap.docs[0];
      await updateDoc(doc(db, EVALUATIONS_COLLECTION, existingDoc.id), {
        ...evaluationData,
        updatedAt: serverTimestamp()
      });
      return { success: true, id: existingDoc.id, updated: true };
    } else {
      // Create new evaluation
      const docRef = await addDoc(collection(db, EVALUATIONS_COLLECTION), {
        ...evaluationData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id, updated: false };
    }
  } catch (error) {
    console.error('Error saving evaluation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all evaluations for a session
 */
export const getSessionEvaluations = async (sessionId) => {
  try {
    const q = query(
      collection(db, EVALUATIONS_COLLECTION),
      where('sessionId', '==', sessionId)
    );
    const snapshot = await getDocs(q);
    const evaluations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: evaluations };
  } catch (error) {
    console.error('Error getting session evaluations:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to session evaluations (real-time updates)
 */
export const subscribeSessionEvaluations = (sessionId, callback) => {
  const q = query(
    collection(db, EVALUATIONS_COLLECTION),
    where('sessionId', '==', sessionId)
  );
  return onSnapshot(q, (snapshot) => {
    const evaluations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(evaluations);
  });
};

/**
 * Get evaluations by assessor for a session
 */
export const getAssessorEvaluations = async (sessionId, assessorId) => {
  try {
    const q = query(
      collection(db, EVALUATIONS_COLLECTION),
      where('sessionId', '==', sessionId),
      where('assessorId', '==', assessorId)
    );
    const snapshot = await getDocs(q);
    const evaluations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: evaluations };
  } catch (error) {
    console.error('Error getting assessor evaluations:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to assessor's evaluations for a session (real-time)
 */
export const subscribeAssessorEvaluations = (sessionId, assessorId, callback) => {
  const q = query(
    collection(db, EVALUATIONS_COLLECTION),
    where('sessionId', '==', sessionId),
    where('assessorId', '==', assessorId)
  );
  return onSnapshot(q, (snapshot) => {
    const evaluations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(evaluations);
  });
};

/**
 * Delete an evaluation
 */
export const deleteEvaluation = async (evaluationId) => {
  try {
    await deleteDoc(doc(db, EVALUATIONS_COLLECTION, evaluationId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ANALYTICS & EXPORT
// ============================================

/**
 * Get player summary with average ratings across all assessors
 */
export const getPlayerSummary = (evaluations, playerId) => {
  const playerEvals = evaluations.filter(e => e.playerId === playerId);
  if (playerEvals.length === 0) return null;

  const metrics = ['athleticism', 'ballSkills', 'gameUnderstanding', 'coachability', 'effort'];
  const averages = {};

  metrics.forEach(metric => {
    const values = playerEvals.map(e => e.ratings?.[metric]).filter(v => v != null);
    averages[metric] = values.length > 0
      ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      : null;
  });

  const overallValues = playerEvals.map(e => e.overallImpression).filter(v => v != null);
  const avgOverall = overallValues.length > 0
    ? (overallValues.reduce((a, b) => a + b, 0) / overallValues.length).toFixed(1)
    : null;

  // Get most common team recommendation
  const recommendations = playerEvals.map(e => e.teamRecommendation).filter(Boolean);
  const recCounts = recommendations.reduce((acc, rec) => {
    acc[rec] = (acc[rec] || 0) + 1;
    return acc;
  }, {});
  const topRecommendation = Object.entries(recCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    playerId,
    playerName: playerEvals[0].playerName,
    playerNumber: playerEvals[0].playerNumber,
    evaluationCount: playerEvals.length,
    averages,
    avgOverall,
    topRecommendation,
    recommendations: recCounts,
    evaluations: playerEvals
  };
};

/**
 * Export evaluations to CSV format
 */
export const exportToCSV = (evaluations, session) => {
  const headers = [
    'Player Name',
    'Player Number',
    'Assessor',
    'Athleticism',
    'Ball Skills',
    'Game Understanding',
    'Coachability',
    'Effort',
    'Overall',
    'Team Rec',
    'Notes'
  ];

  const rows = evaluations.map(e => [
    e.playerName,
    e.playerNumber,
    e.assessorName,
    e.ratings?.athleticism || '',
    e.ratings?.ballSkills || '',
    e.ratings?.gameUnderstanding || '',
    e.ratings?.coachability || '',
    e.ratings?.effort || '',
    e.overallImpression || '',
    e.teamRecommendation || '',
    `"${(e.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    `Tryout Session: ${session?.name || 'Unknown'}`,
    `Date: ${session?.date ? new Date(session.date.seconds * 1000).toLocaleDateString() : 'Unknown'}`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Fetch users from Firestore by role (e.g. 'coach', 'admin')
 */
export const fetchUsersByRole = async (role) => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', role));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        displayName: data.displayName || data.name || '',
        email: data.email || '',
        role: data.role || '',
        teams: data.teams || [],
        teamNames: data.teamNames || []
      };
    });
  } catch (error) {
    console.error(`Error fetching users by role "${role}":`, error);
    return [];
  }
};

// Evaluation metrics config
export const EVAL_METRICS = [
  { id: 'ballSkills', name: 'Skills & Technique', description: 'Ball handling, passing, catching, shooting form' },
  { id: 'gameUnderstanding', name: 'Game Awareness', description: 'Court awareness, decision making, positioning' },
  { id: 'athleticism', name: 'Athleticism', description: 'Speed, agility, coordination, jumping ability' },
  { id: 'coachability', name: 'Attitude & Coachability', description: 'Listens, applies feedback, positive attitude, effort' },
  { id: 'effort', name: 'Teamwork & Communication', description: 'Works with teammates, communicates on court' }
];

export const TEAM_OPTIONS = [
  { id: 'team-1', label: 'Team 1', color: 'bg-green-500' },
  { id: 'team-2', label: 'Team 2', color: 'bg-blue-500' },
  { id: 'team-3', label: 'Team 3', color: 'bg-yellow-500' }
];

// Session types for 2-stage tryouts
export const SESSION_TYPES = [
  {
    id: 'hour-1',
    label: 'Hour 1 - Development',
    description: 'Team 3 players + newcomers',
    durationLabel: '60 minutes',
    defaultDurationMins: 60
  },
  {
    id: 'hour-2',
    label: 'Hour 2 - Advanced',
    description: 'Team 1 & 2 + promoted players',
    durationLabel: '60 minutes',
    defaultDurationMins: 60
  }
];

// Age groups
export const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior'];

// Max age for each age group (player must be under this age)
export const AGE_GROUP_MAX_AGE = {
  'U8': 8, 'U10': 10, 'U12': 12, 'U14': 14, 'U16': 16, 'U18': 18, 'Senior': 99
};

// Evaluation statuses
export const EVAL_STATUSES = {
  draft: { id: 'draft', label: 'Draft', color: 'bg-amber-500/20 text-amber-300 border-amber-500' },
  submitted: { id: 'submitted', label: 'Submitted', color: 'bg-blue-500/20 text-blue-300 border-blue-500' },
  finalized: { id: 'finalized', label: 'Finalized', color: 'bg-green-500/20 text-green-300 border-green-500' }
};

// Tryout scoring level labels
export const TRYOUT_LEVEL_LABELS = {
  1: 'Foundational',
  2: 'Emerging',
  3: 'At Level',
  4: 'Above Level',
  5: 'Exceptional'
};

// Tryout scoring level colors (hex values)
export const TRYOUT_LEVEL_COLORS = {
  1: '#94a3b8',
  2: '#f59e0b',
  3: '#eab308',
  4: '#2563eb',
  5: '#005028'
};

// Tryout scoring criteria — age-appropriate descriptions for each metric at each level
export const TRYOUT_SCORING_CRITERIA = {
  ballSkills: {
    1: 'Just starting to learn the basics. Ball handling, passing, and shooting need significant development. Movements are uncoordinated.',
    2: 'Beginning to show understanding of fundamentals. Skills inconsistent but showing positive signs of development.',
    3: 'Demonstrates solid fundamentals. Can perform core skills reliably in practice. Developing consistency under pressure.',
    4: 'Skills and understanding exceed typical expectations for this age group. Confident with ball, accurate passing and shooting.',
    5: 'Outstanding ability demonstrating advanced skills, tactical maturity, and composure well beyond age expectations.'
  },
  gameUnderstanding: {
    1: 'Struggles to understand game flow. Often out of position. Limited awareness of what\'s happening on court.',
    2: 'Starting to recognise basic game situations. Positioning improving but still often reactive rather than proactive.',
    3: 'Understands basic game concepts. Generally in the right position. Can read simple offensive and defensive situations.',
    4: 'Reads the game well. Anticipates plays. Makes good decisions under pressure. Court vision above average.',
    5: 'Elite court vision and game reading. Consistently makes the right decision. Controls tempo and flow.'
  },
  athleticism: {
    1: 'Physical development is early stage. Speed, agility, and coordination need significant improvement.',
    2: 'Showing improvement in physical capabilities. Some coordination and speed developing but inconsistent.',
    3: 'Good physical development for age. Moves well, reasonable speed and agility. Consistent effort in physical tasks.',
    4: 'Physical attributes stand out. Quick, agile, strong for age. Can sustain high effort throughout a session.',
    5: 'Exceptional physical tools. Dominant speed, agility, strength. Can change the game through athleticism alone.'
  },
  coachability: {
    1: 'Reluctant to engage. Struggles to follow instructions. May lack confidence or interest.',
    2: 'Responds to coaching when prompted. Effort is inconsistent. Shows flashes of positive attitude.',
    3: 'Positive attitude, listens to coaches, applies feedback. Consistent effort. Good training habits.',
    4: 'Actively seeks feedback. Self-motivated. Positive influence on other players. Leads by example.',
    5: 'Model player. Exceptional attitude, coachable, resilient. Inspires others. Natural leader.'
  },
  effort: {
    1: 'Plays in isolation. Rarely communicates with teammates. Unaware of team dynamics.',
    2: 'Beginning to look for teammates. Occasional communication. Starting to understand team concepts.',
    3: 'Works well with teammates. Communicates on court. Understands and fills their role in the team.',
    4: 'Strong communicator. Lifts teammates. Creates opportunities for others. Natural team player.',
    5: 'Elite communicator and team player. Makes everyone around them better. Organises teammates naturally.'
  }
};

/**
 * Promote players from Hour 1 to linked Hour 2 session
 */
export const promotePlayersToHour2 = async (hour1SessionId, hour2SessionId, playerIds) => {
  try {
    // Get Hour 1 session to get player details
    const hour1Result = await getTryoutSession(hour1SessionId);
    if (!hour1Result.success) {
      return { success: false, error: 'Could not find Hour 1 session' };
    }

    const hour1Session = hour1Result.data;
    const playersToPromote = hour1Session.players?.filter(p => playerIds.includes(p.id)) || [];

    if (playersToPromote.length === 0) {
      return { success: false, error: 'No players selected for promotion' };
    }

    // Add promoted flag to players
    const promotedPlayers = playersToPromote.map(p => ({
      ...p,
      promotedFromHour1: true,
      promotedAt: new Date().toISOString()
    }));

    // Get Hour 2 session
    const hour2Result = await getTryoutSession(hour2SessionId);
    if (!hour2Result.success) {
      return { success: false, error: 'Could not find Hour 2 session' };
    }

    const hour2Session = hour2Result.data;
    const existingPlayerIds = hour2Session.players?.map(p => p.id) || [];

    // Filter out already added players
    const newPlayers = promotedPlayers.filter(p => !existingPlayerIds.includes(p.id));

    if (newPlayers.length === 0) {
      return { success: false, error: 'All selected players are already in Hour 2 session' };
    }

    // Update Hour 2 session with promoted players
    const updatedPlayers = [...(hour2Session.players || []), ...newPlayers];
    const result = await updateTryoutSession(hour2SessionId, { players: updatedPlayers });

    if (result.success) {
      // Also update Hour 1 session to mark which players were promoted
      const hour1Players = hour1Session.players.map(p =>
        playerIds.includes(p.id)
          ? { ...p, promotedToHour2: true, promotedToSessionId: hour2SessionId }
          : p
      );
      await updateTryoutSession(hour1SessionId, { players: hour1Players });
    }

    return {
      success: result.success,
      promotedCount: newPlayers.length,
      error: result.error
    };
  } catch (error) {
    console.error('Error promoting players:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get Hour 1 sessions for linking (for Hour 2 session creation)
 */
export const getHour1Sessions = async (ageGroup) => {
  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('sessionType', '==', 'hour-1')
    );
    const snapshot = await getDocs(q);
    let sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter by age group if provided
    if (ageGroup) {
      sessions = sessions.filter(s => s.ageGroup === ageGroup);
    }

    return { success: true, data: sessions };
  } catch (error) {
    console.error('Error getting Hour 1 sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate session duration from start and end times
 */
export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return null;

  const parseTime = (timeStr) => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return null;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3]?.toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const startMins = parseTime(startTime);
  const endMins = parseTime(endTime);

  if (startMins === null || endMins === null) return null;

  const durationMins = endMins - startMins;
  if (durationMins <= 0) return null;

  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
};

/**
 * Auto-calculate end time from a 24h start time and duration in minutes.
 * @param {string} startTime24 - "HH:MM" 24-hour format from <input type="time">
 * @param {number} durationMins - duration in minutes
 * @returns {string} "HH:MM" 24-hour format
 */
export const autoCalcEndTime = (startTime24, durationMins) => {
  if (!startTime24 || !durationMins) return '';
  const [h, m] = startTime24.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '';
  const totalMins = h * 60 + m + durationMins;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

/**
 * Format 24h time to display string e.g. "17:00" → "5:00 PM"
 */
export const formatTime24to12 = (time24) => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

/**
 * Calculate duration between two 24h time strings in minutes
 */
export const durationBetween = (start24, end24) => {
  if (!start24 || !end24) return null;
  const [sh, sm] = start24.split(':').map(Number);
  const [eh, em] = end24.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? diff : null;
};

/**
 * Get assessor statistics across all sessions
 */
export const getAssessorVolunteerStats = async () => {
  try {
    // Get all sessions
    const sessionsQ = query(collection(db, SESSIONS_COLLECTION));
    const sessionsSnap = await getDocs(sessionsQ);
    const sessions = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get all evaluations
    const evalsQ = query(collection(db, EVALUATIONS_COLLECTION));
    const evalsSnap = await getDocs(evalsQ);
    const evaluations = evalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Build per-assessor stats
    const assessorMap = {};

    // From session.assessors (assigned)
    sessions.forEach(sess => {
      (sess.assessors || []).forEach(a => {
        const key = a.email || a.name;
        if (!assessorMap[key]) {
          assessorMap[key] = {
            name: a.name,
            email: a.email || '',
            sessionsAssigned: [],
            ageGroups: new Set(),
            evaluationCount: 0,
            avgRating: 0,
            totalRating: 0,
            ratingCount: 0
          };
        }
        assessorMap[key].sessionsAssigned.push({
          sessionId: sess.id,
          sessionName: sess.name,
          sessionType: sess.sessionType,
          ageGroup: sess.ageGroup,
          date: sess.date
        });
        if (sess.ageGroup) assessorMap[key].ageGroups.add(sess.ageGroup);
      });
    });

    // From evaluations (actual work done)
    evaluations.forEach(ev => {
      const key = ev.assessorName || ev.assessorId;
      if (!assessorMap[key]) {
        assessorMap[key] = {
          name: ev.assessorName || ev.assessorId,
          email: '',
          sessionsAssigned: [],
          ageGroups: new Set(),
          evaluationCount: 0,
          avgRating: 0,
          totalRating: 0,
          ratingCount: 0
        };
      }
      assessorMap[key].evaluationCount++;
      if (ev.overallImpression) {
        assessorMap[key].totalRating += ev.overallImpression;
        assessorMap[key].ratingCount++;
      }
    });

    // Finalize
    const result = Object.values(assessorMap).map(a => ({
      ...a,
      ageGroups: Array.from(a.ageGroups),
      avgRating: a.ratingCount > 0 ? (a.totalRating / a.ratingCount).toFixed(1) : null,
      sessionsCount: a.sessionsAssigned.length
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting assessor stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get assessor consistency data for a session
 * Returns each assessor's average vs the session average
 */
export const getAssessorConsistency = (evaluations) => {
  if (!evaluations || evaluations.length === 0) return [];

  // Global average
  const allOverall = evaluations.map(e => e.overallImpression).filter(Boolean);
  const globalAvg = allOverall.length > 0
    ? allOverall.reduce((a, b) => a + b, 0) / allOverall.length
    : 0;

  // Per-assessor
  const byAssessor = {};
  evaluations.forEach(e => {
    const key = e.assessorId || e.assessorName;
    if (!byAssessor[key]) {
      byAssessor[key] = { name: e.assessorName, ratings: [], evals: 0 };
    }
    byAssessor[key].evals++;
    if (e.overallImpression) byAssessor[key].ratings.push(e.overallImpression);
  });

  return Object.entries(byAssessor).map(([id, data]) => {
    const avg = data.ratings.length > 0
      ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
      : 0;
    return {
      assessorId: id,
      assessorName: data.name,
      evaluationCount: data.evals,
      avgOverall: parseFloat(avg.toFixed(1)),
      deviation: parseFloat((avg - globalAvg).toFixed(1)),
      globalAvg: parseFloat(globalAvg.toFixed(1))
    };
  });
};

/**
 * Close a tryout session - locks all evaluations as finalized
 */
export const closeSession = async (sessionId) => {
  try {
    const batch = writeBatch(db);

    // Update session status to closed
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    batch.update(sessionRef, {
      status: 'closed',
      closedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Finalize all submitted evaluations for this session
    const evalsQuery = query(
      collection(db, EVALUATIONS_COLLECTION),
      where('sessionId', '==', sessionId)
    );
    const evalsSnap = await getDocs(evalsQuery);
    evalsSnap.docs.forEach(evalDoc => {
      const evalData = evalDoc.data();
      // Only finalize if submitted or draft (skip if already finalized)
      if (evalData.evalStatus !== 'finalized') {
        batch.update(doc(db, EVALUATIONS_COLLECTION, evalDoc.id), {
          evalStatus: 'finalized',
          finalizedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    });

    await batch.commit();
    return { success: true, finalizedCount: evalsSnap.size };
  } catch (error) {
    console.error('Error closing session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get completion stats for a session (for coordinator overview)
 * Returns per-assessor completion breakdown
 */
export const getSessionCompletionStats = (evaluations, session) => {
  if (!session?.players || !session?.assessors) {
    return { assessors: [], totalExpected: 0, totalCompleted: 0 };
  }

  const totalPlayers = session.players.length;
  const assessorStats = (session.assessors || []).map(assessor => {
    const assessorEvals = evaluations.filter(
      e => e.assessorId === assessor.id || e.assessorName === assessor.name
    );
    const submitted = assessorEvals.filter(e => e.evalStatus === 'submitted' || e.evalStatus === 'finalized').length;
    const drafts = assessorEvals.filter(e => e.evalStatus === 'draft').length;
    const notStarted = totalPlayers - submitted - drafts;

    return {
      ...assessor,
      submitted,
      drafts,
      notStarted: Math.max(0, notStarted),
      total: totalPlayers,
      isComplete: submitted + drafts >= totalPlayers
    };
  });

  const totalExpected = totalPlayers * (session.assessors?.length || 0);
  const totalCompleted = evaluations.filter(
    e => e.evalStatus === 'submitted' || e.evalStatus === 'finalized'
  ).length;

  return { assessors: assessorStats, totalExpected, totalCompleted };
};

/**
 * Calculate standard deviation for an array of numbers
 */
export const stdDev = (values) => {
  if (!values || values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map(v => (v - mean) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length);
};

/**
 * Get enhanced player summary including std dev and per-assessor breakdowns
 */
export const getEnhancedPlayerSummary = (evaluations, playerId) => {
  const base = getPlayerSummary(evaluations, playerId);
  if (!base) return null;

  // Calculate std dev of overall impression ratings
  const overallValues = base.evaluations
    .map(e => e.overallImpression)
    .filter(v => v != null);
  const overallStdDev = stdDev(overallValues);

  // Per-metric std devs
  const metrics = ['athleticism', 'ballSkills', 'gameUnderstanding', 'coachability', 'effort'];
  const metricStdDevs = {};
  metrics.forEach(metric => {
    const vals = base.evaluations.map(e => e.ratings?.[metric]).filter(v => v != null);
    metricStdDevs[metric] = stdDev(vals);
  });

  // Compute overall average across all 5 metric averages (not from overallImpression)
  const metricAvgValues = metrics.map(m => parseFloat(base.averages[m])).filter(v => !isNaN(v));
  const compositeAvg = metricAvgValues.length > 0
    ? (metricAvgValues.reduce((a, b) => a + b, 0) / metricAvgValues.length).toFixed(1)
    : base.avgOverall;

  // Recommendation percentages
  const totalRecs = Object.values(base.recommendations || {}).reduce((a, b) => a + b, 0);
  const recPercentages = {};
  if (totalRecs > 0) {
    Object.entries(base.recommendations).forEach(([k, v]) => {
      recPercentages[k] = Math.round((v / totalRecs) * 100);
    });
  }

  // Flags
  const flags = [];
  if (base.evaluationCount === 1) flags.push('needs-more-evals');
  if (base.evaluationCount === 0) flags.push('not-assessed');
  if (overallStdDev > 1.0 && base.evaluationCount >= 2) flags.push('inconsistent');

  return {
    ...base,
    overallStdDev: parseFloat(overallStdDev.toFixed(2)),
    metricStdDevs,
    compositeAvg,
    recPercentages,
    flags
  };
};

/**
 * Detect outlier ratings: individual ratings that differ significantly from the player mean
 */
export const detectOutlierRatings = (evaluations, sessionPlayers) => {
  const outliers = [];
  if (!sessionPlayers) return outliers;

  sessionPlayers.forEach(player => {
    const playerEvals = evaluations.filter(e => e.playerId === player.id);
    if (playerEvals.length < 2) return;

    const overallValues = playerEvals.map(e => e.overallImpression).filter(v => v != null);
    if (overallValues.length < 2) return;

    const mean = overallValues.reduce((a, b) => a + b, 0) / overallValues.length;
    const sd = stdDev(overallValues);
    if (sd < 0.5) return; // Not enough variance to flag

    playerEvals.forEach(eval_ => {
      if (eval_.overallImpression == null) return;
      const diff = Math.abs(eval_.overallImpression - mean);
      if (diff > 1.2) {
        outliers.push({
          playerName: player.name,
          playerId: player.id,
          assessorName: eval_.assessorName,
          assessorId: eval_.assessorId,
          rating: eval_.overallImpression,
          playerMean: parseFloat(mean.toFixed(1)),
          deviation: parseFloat((eval_.overallImpression - mean).toFixed(1)),
          direction: eval_.overallImpression > mean ? 'high' : 'low'
        });
      }
    });
  });

  return outliers.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
};

/**
 * Export team roster CSV (for team builder results)
 */
export const exportTeamRosterCSV = (playerSummaries, session) => {
  const headers = [
    'Team Assignment',
    'Player Name',
    'Player Number',
    'Age Group',
    'Overall Average',
    'Athleticism',
    'Ball Skills',
    'Game IQ',
    'Coachability',
    'Effort',
    'Std Dev',
    '# Assessors',
    'Top Recommendation'
  ];

  const teamLabels = { 'team-1': 'Team 1', 'team-2': 'Team 2', 'development': 'Development', '': 'Unassigned' };

  const rows = playerSummaries
    .sort((a, b) => {
      const order = { 'team-1': 0, 'team-2': 1, 'development': 2, '': 3 };
      return (order[a.teamAssignment || ''] || 3) - (order[b.teamAssignment || ''] || 3);
    })
    .map(s => [
      teamLabels[s.teamAssignment || ''] || 'Unassigned',
      s.playerName,
      s.playerNumber || '',
      s.playerAgeGroup || '',
      s.compositeAvg || s.avgOverall || '',
      s.averages?.athleticism || '',
      s.averages?.ballSkills || '',
      s.averages?.gameUnderstanding || '',
      s.averages?.coachability || '',
      s.averages?.effort || '',
      s.overallStdDev != null ? s.overallStdDev : '',
      s.evaluationCount,
      s.topRecommendation || ''
    ]);

  const csvContent = [
    `Tryout Results: ${session?.name || 'Unknown'}`,
    `Age Group: ${session?.ageGroup || ''}`,
    `Date: ${session?.date ? new Date(session.date.seconds * 1000).toLocaleDateString() : 'Unknown'}`,
    `Generated: ${new Date().toLocaleDateString()}`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  return csvContent;
};

export default {
  createTryoutSession,
  updateTryoutSession,
  deleteTryoutSession,
  getTryoutSession,
  getAllTryoutSessions,
  subscribeTryoutSessions,
  getAssessorSessions,
  saveEvaluation,
  getSessionEvaluations,
  subscribeSessionEvaluations,
  getAssessorEvaluations,
  subscribeAssessorEvaluations,
  deleteEvaluation,
  getPlayerSummary,
  exportToCSV,
  downloadCSV,
  promotePlayersToHour2,
  getHour1Sessions,
  calculateDuration,
  autoCalcEndTime,
  formatTime24to12,
  durationBetween,
  getAssessorVolunteerStats,
  getAssessorConsistency,
  closeSession,
  getSessionCompletionStats,
  fetchUsersByRole,
  stdDev,
  getEnhancedPlayerSummary,
  detectOutlierRatings,
  exportTeamRosterCSV,
  EVAL_METRICS,
  TEAM_OPTIONS,
  SESSION_TYPES,
  AGE_GROUPS,
  AGE_GROUP_MAX_AGE,
  EVAL_STATUSES
};
