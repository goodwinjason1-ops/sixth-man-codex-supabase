/**
 * Youth Programs Service
 * Handles all Firestore operations for Little Lakers & Lakers Ready programs
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
const PROGRAMS_COLLECTION = 'youth_programs';
const SESSIONS_COLLECTION = 'youth_sessions';
const ENROLLMENTS_COLLECTION = 'youth_enrollments';
const MILESTONES_COLLECTION = 'youth_milestones';
const ATTENDANCE_COLLECTION = 'youth_attendance';
const PARENT_MESSAGES_COLLECTION = 'youth_parent_messages';

// ============================================
// PROGRAMS (Little Lakers / Lakers Ready terms)
// ============================================

/**
 * Create a new program term (e.g., "Little Lakers Term 1 2026")
 */
export const createProgram = async (programData) => {
  try {
    const docRef = await addDoc(collection(db, PROGRAMS_COLLECTION), {
      ...programData,
      status: programData.status || 'draft',
      enrolledCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating youth program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a program
 */
export const updateProgram = async (programId, updates) => {
  try {
    const docRef = doc(db, PROGRAMS_COLLECTION, programId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating youth program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a program
 */
export const deleteProgram = async (programId) => {
  try {
    await deleteDoc(doc(db, PROGRAMS_COLLECTION, programId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting youth program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all programs
 */
export const getAllPrograms = async () => {
  try {
    const q = query(collection(db, PROGRAMS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const programs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data: programs };
  } catch (error) {
    console.error('Error getting youth programs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to programs (real-time)
 */
export const subscribePrograms = (callback) => {
  const q = query(collection(db, PROGRAMS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const programs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(programs);
  }, (error) => {
    console.error('Error subscribing to youth programs:', error);
    callback([]);
  });
};

/**
 * Get a single program
 */
export const getProgram = async (programId) => {
  try {
    const docSnap = await getDoc(doc(db, PROGRAMS_COLLECTION, programId));
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Program not found' };
  } catch (error) {
    console.error('Error getting youth program:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ENROLLMENTS
// ============================================

/**
 * Enroll a child in a program
 */
export const enrollChild = async (enrollmentData) => {
  try {
    // Check for duplicate enrollment
    const existingQ = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where('programId', '==', enrollmentData.programId),
      where('childName', '==', enrollmentData.childName)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      return { success: false, error: 'Child is already enrolled in this program' };
    }

    const docRef = await addDoc(collection(db, ENROLLMENTS_COLLECTION), {
      ...enrollmentData,
      status: 'active',
      enrolledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Update enrolled count on program
    const programRef = doc(db, PROGRAMS_COLLECTION, enrollmentData.programId);
    const programSnap = await getDoc(programRef);
    if (programSnap.exists()) {
      const currentCount = programSnap.data().enrolledCount || 0;
      await updateDoc(programRef, { enrolledCount: currentCount + 1, updatedAt: serverTimestamp() });
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error enrolling child:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove enrollment
 */
export const removeEnrollment = async (enrollmentId, programId) => {
  try {
    await deleteDoc(doc(db, ENROLLMENTS_COLLECTION, enrollmentId));

    // Update enrolled count on program
    if (programId) {
      const programRef = doc(db, PROGRAMS_COLLECTION, programId);
      const programSnap = await getDoc(programRef);
      if (programSnap.exists()) {
        const currentCount = programSnap.data().enrolledCount || 0;
        await updateDoc(programRef, { enrolledCount: Math.max(0, currentCount - 1), updatedAt: serverTimestamp() });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing enrollment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get enrollments for a program
 */
export const getProgramEnrollments = async (programId) => {
  try {
    const q = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where('programId', '==', programId)
    );
    const snapshot = await getDocs(q);
    const enrollments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data: enrollments };
  } catch (error) {
    console.error('Error getting enrollments:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to enrollments for a program (real-time)
 */
export const subscribeEnrollments = (programId, callback) => {
  const q = query(
    collection(db, ENROLLMENTS_COLLECTION),
    where('programId', '==', programId)
  );
  return onSnapshot(q, (snapshot) => {
    const enrollments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(enrollments);
  }, (error) => {
    console.error('Error subscribing to enrollments:', error);
    callback([]);
  });
};

// ============================================
// SESSIONS (Weekly sessions within a program)
// ============================================

/**
 * Create a session record (when coach starts a weekly session)
 */
export const createSession = async (sessionData) => {
  try {
    const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
      ...sessionData,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating youth session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a session
 */
export const updateSession = async (sessionId, updates) => {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating youth session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get sessions for a program
 */
export const getProgramSessions = async (programId) => {
  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('programId', '==', programId),
      orderBy('weekNumber', 'asc')
    );
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data: sessions };
  } catch (error) {
    console.error('Error getting youth sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to sessions for a program
 */
export const subscribeSessions = (programId, callback) => {
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('programId', '==', programId)
  );
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(sessions);
  }, (error) => {
    console.error('Error subscribing to youth sessions:', error);
    callback([]);
  });
};

// ============================================
// ATTENDANCE
// ============================================

/**
 * Record attendance for a session
 */
export const recordAttendance = async (attendanceData) => {
  try {
    // Check for existing attendance record
    const existingQ = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('sessionId', '==', attendanceData.sessionId),
      where('enrollmentId', '==', attendanceData.enrollmentId)
    );
    const existingSnap = await getDocs(existingQ);

    if (!existingSnap.empty) {
      // Update existing
      const existingDoc = existingSnap.docs[0];
      await updateDoc(doc(db, ATTENDANCE_COLLECTION, existingDoc.id), {
        ...attendanceData,
        updatedAt: serverTimestamp()
      });
      return { success: true, id: existingDoc.id, updated: true };
    }

    const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), {
      ...attendanceData,
      recordedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id, updated: false };
  } catch (error) {
    console.error('Error recording attendance:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Batch record attendance for all enrolled children in a session
 */
export const batchRecordAttendance = async (sessionId, programId, attendanceRecords) => {
  try {
    const batch = writeBatch(db);

    for (const record of attendanceRecords) {
      // Check for existing
      const existingQ = query(
        collection(db, ATTENDANCE_COLLECTION),
        where('sessionId', '==', sessionId),
        where('enrollmentId', '==', record.enrollmentId)
      );
      const existingSnap = await getDocs(existingQ);

      if (!existingSnap.empty) {
        const existingDoc = existingSnap.docs[0];
        batch.update(doc(db, ATTENDANCE_COLLECTION, existingDoc.id), {
          present: record.present,
          note: record.note || '',
          updatedAt: serverTimestamp()
        });
      } else {
        const newRef = doc(collection(db, ATTENDANCE_COLLECTION));
        batch.set(newRef, {
          sessionId,
          programId,
          enrollmentId: record.enrollmentId,
          childName: record.childName,
          present: record.present,
          note: record.note || '',
          recordedAt: serverTimestamp()
        });
      }
    }

    await batch.commit();
    return { success: true, count: attendanceRecords.length };
  } catch (error) {
    console.error('Error batch recording attendance:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance for a session
 */
export const getSessionAttendance = async (sessionId) => {
  try {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('sessionId', '==', sessionId)
    );
    const snapshot = await getDocs(q);
    const attendance = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data: attendance };
  } catch (error) {
    console.error('Error getting attendance:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance history for a child across all sessions
 */
export const getChildAttendance = async (enrollmentId) => {
  try {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('enrollmentId', '==', enrollmentId)
    );
    const snapshot = await getDocs(q);
    const attendance = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data: attendance };
  } catch (error) {
    console.error('Error getting child attendance:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// MILESTONES (Developmental tracking)
// ============================================

/**
 * Update milestone status for a child
 */
export const updateMilestone = async (milestoneData) => {
  try {
    // Check for existing milestone record
    const existingQ = query(
      collection(db, MILESTONES_COLLECTION),
      where('enrollmentId', '==', milestoneData.enrollmentId),
      where('milestoneId', '==', milestoneData.milestoneId)
    );
    const existingSnap = await getDocs(existingQ);

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      await updateDoc(doc(db, MILESTONES_COLLECTION, existingDoc.id), {
        status: milestoneData.status,
        note: milestoneData.note || '',
        updatedAt: serverTimestamp(),
        updatedBy: milestoneData.updatedBy
      });
      return { success: true, id: existingDoc.id, updated: true };
    }

    const docRef = await addDoc(collection(db, MILESTONES_COLLECTION), {
      ...milestoneData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id, updated: false };
  } catch (error) {
    console.error('Error updating milestone:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all milestones for a child enrollment
 */
export const getChildMilestones = async (enrollmentId) => {
  try {
    const q = query(
      collection(db, MILESTONES_COLLECTION),
      where('enrollmentId', '==', enrollmentId)
    );
    const snapshot = await getDocs(q);
    const milestones = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data: milestones };
  } catch (error) {
    console.error('Error getting child milestones:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all milestones for a program (all children)
 */
export const getProgramMilestones = async (programId) => {
  try {
    const q = query(
      collection(db, MILESTONES_COLLECTION),
      where('programId', '==', programId)
    );
    const snapshot = await getDocs(q);
    const milestones = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data: milestones };
  } catch (error) {
    console.error('Error getting program milestones:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PARENT MESSAGES (Session notes to parents)
// ============================================

/**
 * Send a parent message (session summary / notes)
 */
export const sendParentMessage = async (messageData) => {
  try {
    const docRef = await addDoc(collection(db, PARENT_MESSAGES_COLLECTION), {
      ...messageData,
      sentAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error sending parent message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send batch parent messages (one per enrolled child after a session)
 */
export const sendBatchParentMessages = async (sessionId, programId, messages) => {
  try {
    const batch = writeBatch(db);

    for (const msg of messages) {
      const newRef = doc(collection(db, PARENT_MESSAGES_COLLECTION));
      batch.set(newRef, {
        sessionId,
        programId,
        enrollmentId: msg.enrollmentId,
        childName: msg.childName,
        parentEmail: msg.parentEmail || '',
        subject: msg.subject || 'Session Update',
        message: msg.message,
        coachName: msg.coachName,
        weekNumber: msg.weekNumber,
        sentAt: serverTimestamp()
      });
    }

    await batch.commit();
    return { success: true, count: messages.length };
  } catch (error) {
    console.error('Error sending batch parent messages:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get parent messages for a program
 */
export const getProgramParentMessages = async (programId) => {
  try {
    const q = query(
      collection(db, PARENT_MESSAGES_COLLECTION),
      where('programId', '==', programId),
      orderBy('sentAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data: messages };
  } catch (error) {
    console.error('Error getting parent messages:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ANALYTICS & REPORTING
// ============================================

/**
 * Get program statistics
 */
export const getProgramStats = async (programId) => {
  try {
    // Get enrollments
    const enrollResult = await getProgramEnrollments(programId);
    const enrollments = enrollResult.success ? enrollResult.data : [];

    // Get sessions
    const sessionsResult = await getProgramSessions(programId);
    const sessions = sessionsResult.success ? sessionsResult.data : [];

    // Get all attendance for this program
    const attendanceQ = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('programId', '==', programId)
    );
    const attendanceSnap = await getDocs(attendanceQ);
    const attendance = attendanceSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get milestones
    const milestonesResult = await getProgramMilestones(programId);
    const milestones = milestonesResult.success ? milestonesResult.data : [];

    // Calculate stats
    const totalEnrolled = enrollments.filter(e => e.status === 'active').length;
    const sessionsCompleted = sessions.filter(s => s.status === 'completed').length;

    // Attendance rate
    const totalAttendanceRecords = attendance.length;
    const presentCount = attendance.filter(a => a.present).length;
    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round((presentCount / totalAttendanceRecords) * 100)
      : 0;

    // Milestone progress
    const achievedMilestones = milestones.filter(m => m.status === 'achieved').length;
    const improvingMilestones = milestones.filter(m => m.status === 'improving').length;
    const totalMilestoneRecords = milestones.length;

    return {
      success: true,
      data: {
        totalEnrolled,
        sessionsCompleted,
        totalSessions: sessions.length,
        attendanceRate,
        achievedMilestones,
        improvingMilestones,
        totalMilestoneRecords,
        enrollments,
        sessions,
        attendance,
        milestones
      }
    };
  } catch (error) {
    console.error('Error getting program stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get child progress report (for parent communication)
 */
export const getChildProgressReport = async (enrollmentId, programType) => {
  try {
    // Get attendance
    const attendanceResult = await getChildAttendance(enrollmentId);
    const attendance = attendanceResult.success ? attendanceResult.data : [];

    // Get milestones
    const milestonesResult = await getChildMilestones(enrollmentId);
    const milestones = milestonesResult.success ? milestonesResult.data : [];

    const sessionsAttended = attendance.filter(a => a.present).length;
    const totalSessions = attendance.length;
    const attendanceRate = totalSessions > 0
      ? Math.round((sessionsAttended / totalSessions) * 100)
      : 0;

    const achievedCount = milestones.filter(m => m.status === 'achieved').length;
    const improvingCount = milestones.filter(m => m.status === 'improving').length;

    return {
      success: true,
      data: {
        sessionsAttended,
        totalSessions,
        attendanceRate,
        milestones,
        achievedCount,
        improvingCount,
        programType
      }
    };
  } catch (error) {
    console.error('Error getting child progress report:', error);
    return { success: false, error: error.message };
  }
};

export default {
  createProgram,
  updateProgram,
  deleteProgram,
  getAllPrograms,
  subscribePrograms,
  getProgram,
  enrollChild,
  removeEnrollment,
  getProgramEnrollments,
  subscribeEnrollments,
  createSession,
  updateSession,
  getProgramSessions,
  subscribeSessions,
  recordAttendance,
  batchRecordAttendance,
  getSessionAttendance,
  getChildAttendance,
  updateMilestone,
  getChildMilestones,
  getProgramMilestones,
  sendParentMessage,
  sendBatchParentMessages,
  getProgramParentMessages,
  getProgramStats,
  getChildProgressReport
};
