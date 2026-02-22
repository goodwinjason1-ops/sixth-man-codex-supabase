import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { dbService } from '../services/indexedDB';
import { useAuth } from './AuthContext';

const DataContext = createContext();

// Sample schedule data for testing - includes a game for TODAY
const getSampleSchedule = () => {
  const today = new Date();
  today.setHours(14, 0, 0, 0); // 2:00 PM today

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  return [
    {
      id: 'test-game-today-1',
      teamId: 'lakers-u12',
      teamName: 'Lakers U12',
      opponent: 'Hills Hawks',
      date: today,
      time: '2:00 PM',
      venue: 'Emerald Indoor Courts',
      homeAway: 'home',
      status: 'scheduled'
    },
    {
      id: 'test-game-today-2',
      teamId: 'lakers-u14',
      teamName: 'Lakers U14',
      opponent: 'North Stars',
      date: today,
      time: '4:30 PM',
      venue: 'Emerald Indoor Courts',
      homeAway: 'home',
      status: 'scheduled'
    },
    {
      id: 'test-game-tomorrow',
      teamId: 'lakers-u10',
      teamName: 'Lakers U10',
      opponent: 'Western Warriors',
      date: tomorrow,
      time: '10:00 AM',
      venue: 'Sports Centre',
      homeAway: 'away',
      status: 'scheduled'
    }
  ];
};

// All collection keys for loading/error tracking
const COLLECTION_KEYS = [
  'players', 'skills', 'evaluations', 'games', 'attendance',
  'trainingNotes', 'schedule', 'notifications', 'teams', 'trainingPlans'
];

const initialLoadingStates = Object.fromEntries(COLLECTION_KEYS.map(k => [k, true]));
const initialErrors = {};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [players, setPlayers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [games, setGames] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [trainingNotes, setTrainingNotes] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [teams, setTeams] = useState([]);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);

  // BUG 1 FIX: Per-collection loading states
  const [loadingStates, setLoadingStates] = useState(initialLoadingStates);

  // BUG 3: Per-collection error tracking
  const [errors, setErrors] = useState(initialErrors);

  // Derive overall loading — true until ALL collections have received first snapshot (or errored)
  const loading = useMemo(
    () => Object.values(loadingStates).some(v => v === true),
    [loadingStates]
  );

  // Helper to mark a collection as loaded
  const markLoaded = useCallback((key) => {
    setLoadingStates(prev => {
      if (!prev[key]) return prev; // already false, skip re-render
      return { ...prev, [key]: false };
    });
  }, []);

  // Helper to record a collection error
  const markError = useCallback((key, errorCode) => {
    setErrors(prev => ({ ...prev, [key]: errorCode }));
    markLoaded(key); // stop loading even on error
  }, [markLoaded]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending sync operations
  useEffect(() => {
    const loadPendingSync = async () => {
      const pending = await dbService.getPendingSync();
      setPendingSync(pending);
    };
    loadPendingSync();
  }, []);

  // Sync pending operations when online
  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      syncPendingOperations();
    }
  }, [isOnline, pendingSync]);

  const syncPendingOperations = async () => {
    for (const operation of pendingSync) {
      try {
        switch (operation.type) {
          case 'add':
            await addDoc(collection(db, operation.collection), operation.data);
            break;
          case 'update':
            await updateDoc(doc(db, operation.collection, operation.id), operation.data);
            break;
          case 'delete':
            await deleteDoc(doc(db, operation.collection, operation.id));
            break;
          case 'set':
            await setDoc(doc(db, operation.collection, operation.id), operation.data);
            break;
        }
        await dbService.removePendingSync(operation.id);
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
    setPendingSync([]);
  };

  // Subscribe to Firestore collections
  useEffect(() => {
    if (!currentUser) {
      // Reset loading states when no user (prevents stale loading on logout/login)
      setLoadingStates(initialLoadingStates);
      setErrors({});
      return;
    }

    const unsubscribers = [];

    // Players
    const playersQuery = query(collection(db, 'players'));
    unsubscribers.push(
      onSnapshot(playersQuery, async (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setPlayers(data);
        markLoaded('players');
        await dbService.setAll('players', data);
      }, async (error) => {
        console.error('Players snapshot error:', error.code, error.message);
        markError('players', error.code || 'unknown');
        const offlineData = await dbService.getAll('players');
        setPlayers(offlineData || []);
      })
    );

    // Skills/Curriculum
    const skillsQuery = query(collection(db, 'curriculum'));
    unsubscribers.push(
      onSnapshot(skillsQuery, async (snapshot) => {
        const data = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          drills: Array.isArray(d.data().drills) ? d.data().drills : [],
          category: d.data().category || 'Uncategorized'
        }));
        setSkills(data);
        markLoaded('skills');
        await dbService.setAll('skills', data);
      }, async (error) => {
        console.error('Skills snapshot error:', error.code, error.message);
        markError('skills', error.code || 'unknown');
        const offlineData = await dbService.getAll('skills');
        setSkills(offlineData || []);
      })
    );

    // Evaluations
    const evalsQuery = query(collection(db, 'evaluations'));
    unsubscribers.push(
      onSnapshot(evalsQuery, async (snapshot) => {
        const evalsObj = {};
        const evalsArray = [];
        snapshot.docs.forEach(d => {
          const data = { id: d.id, ...d.data() };
          if (data.skills && typeof data.skills === 'object') {
            Object.entries(data.skills).forEach(([skillId, skillData]) => {
              const flatEntry = { ...data, skillId, level: skillData.level, skillNotes: skillData.notes };
              evalsObj[`${data.playerId}_${skillId}`] = flatEntry;
              evalsArray.push(flatEntry);
            });
          } else if (data.skillId) {
            evalsObj[`${data.playerId}_${data.skillId}`] = data;
            evalsArray.push(data);
          }
        });
        setEvaluations(evalsObj);
        markLoaded('evaluations');
        await dbService.setAll('evaluations', evalsArray);
      }, async (error) => {
        console.error('Evaluations snapshot error:', error.code, error.message);
        markError('evaluations', error.code || 'unknown');
        const offlineData = await dbService.getAll('evaluations');
        const evalsObj = {};
        (offlineData || []).forEach(data => {
          if (data.skills && typeof data.skills === 'object') {
            Object.entries(data.skills).forEach(([skillId, skillData]) => {
              const flatEntry = { ...data, skillId, level: skillData.level, skillNotes: skillData.notes };
              evalsObj[`${data.playerId}_${skillId}`] = flatEntry;
            });
          } else if (data.skillId) {
            evalsObj[`${data.playerId}_${data.skillId}`] = data;
          }
        });
        setEvaluations(evalsObj);
      })
    );

    // Games
    const gamesQuery = query(collection(db, 'games'), orderBy('date', 'desc'));
    unsubscribers.push(
      onSnapshot(gamesQuery, async (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setGames(data);
        markLoaded('games');
        await dbService.setAll('games', data);
      }, async (error) => {
        console.error('Games snapshot error:', error.code, error.message);
        markError('games', error.code || 'unknown');
        const offlineData = await dbService.getAll('games');
        setGames(offlineData || []);
      })
    );

    // Attendance
    const attendanceQuery = query(collection(db, 'attendance'));
    unsubscribers.push(
      onSnapshot(attendanceQuery, async (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setAttendance(data);
        markLoaded('attendance');
        await dbService.setAll('attendance', data);
      }, async (error) => {
        console.error('Attendance snapshot error:', error.code, error.message);
        markError('attendance', error.code || 'unknown');
        const offlineData = await dbService.getAll('attendance');
        setAttendance(offlineData || []);
      })
    );

    // Training Notes
    const notesQuery = query(collection(db, 'training_notes'), orderBy('date', 'desc'));
    unsubscribers.push(
      onSnapshot(notesQuery, async (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setTrainingNotes(data);
        markLoaded('trainingNotes');
        await dbService.setAll('trainingNotes', data);
      }, async (error) => {
        console.error('Training notes snapshot error:', error.code, error.message);
        markError('trainingNotes', error.code || 'unknown');
        const offlineData = await dbService.getAll('trainingNotes');
        setTrainingNotes(offlineData || []);
      })
    );

    // Schedule - with IndexedDB caching and sample fallback for testing
    const scheduleQuery = query(collection(db, 'schedule'), orderBy('date', 'asc'));
    unsubscribers.push(
      onSnapshot(scheduleQuery, async (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        if (data.length === 0) {
          const cached = await dbService.getAll('schedule');
          if (cached && cached.length > 0) {
            setSchedule(cached);
          } else {
            console.log('[DataContext] No schedule data found, using sample data for testing');
            setSchedule(getSampleSchedule());
          }
        } else {
          setSchedule(data);
          await dbService.setAll('schedule', data);
        }
        markLoaded('schedule');
      }, async (error) => {
        console.error('Schedule snapshot error:', error.code, error.message);
        markError('schedule', error.code || 'unknown');
        const offlineData = await dbService.getAll('schedule');
        if (offlineData && offlineData.length > 0) {
          setSchedule(offlineData);
        } else {
          setSchedule(getSampleSchedule());
        }
      })
    );

    // Notifications (with IndexedDB caching)
    const notifsQuery = query(
      collection(db, 'notifications'),
      orderBy('date', 'desc'),
      limit(50)
    );
    unsubscribers.push(
      onSnapshot(notifsQuery, async (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setNotifications(data);
        markLoaded('notifications');
        await dbService.setAll('notifications', data);
      }, async (error) => {
        console.error('Notifications snapshot error:', error.code, error.message);
        markError('notifications', error.code || 'unknown');
        const offlineData = await dbService.getAll('notifications');
        setNotifications(offlineData || []);
      })
    );

    // Teams
    const teamsQuery = query(collection(db, 'teams'));
    unsubscribers.push(
      onSnapshot(teamsQuery, async (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setTeams(data);
        markLoaded('teams');
        await dbService.setAll('teams', data);
      }, async (error) => {
        console.error('Teams snapshot error:', error.code, error.message);
        markError('teams', error.code || 'unknown');
        const offlineData = await dbService.getAll('teams');
        setTeams(offlineData || []);
      })
    );

    // Training Plans
    const trainingPlansQuery = query(collection(db, 'training_plans'), orderBy('updatedAt', 'desc'));
    unsubscribers.push(
      onSnapshot(trainingPlansQuery, async (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setTrainingPlans(data);
        markLoaded('trainingPlans');
        await dbService.setAll('trainingPlans', data);
      }, async (error) => {
        console.error('Training plans snapshot error:', error.code, error.message);
        markError('trainingPlans', error.code || 'unknown');
        const offlineData = await dbService.getAll('trainingPlans');
        setTrainingPlans(offlineData || []);
      })
    );

    // NO synchronous setLoading(false) here — loading is derived from loadingStates

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [currentUser, markLoaded, markError]);

  // BUG 2 FIX: Mutation helpers with try-catch returning { success, error }
  // All writes include updatedBy + updatedAt

  const addDocument = async (collectionName, data) => {
    const writeData = {
      ...data,
      updatedBy: currentUser?.uid || 'unknown',
      updatedAt: serverTimestamp()
    };
    try {
      if (isOnline) {
        const docRef = await addDoc(collection(db, collectionName), writeData);
        return { success: true, id: docRef.id };
      } else {
        await dbService.addPendingSync({
          type: 'add',
          collection: collectionName,
          data: { ...writeData, updatedAt: new Date().toISOString() },
          timestamp: Date.now()
        });
        return { success: true, id: null, offline: true };
      }
    } catch (error) {
      console.error(`Error adding to ${collectionName}:`, error.code, error.message);
      return { success: false, error: error.code || error.message };
    }
  };

  const updateDocument = async (collectionName, docId, data) => {
    const writeData = {
      ...data,
      updatedBy: currentUser?.uid || 'unknown',
      updatedAt: serverTimestamp()
    };
    try {
      if (isOnline) {
        await updateDoc(doc(db, collectionName, docId), writeData);
        return { success: true };
      } else {
        await dbService.addPendingSync({
          type: 'update',
          collection: collectionName,
          id: docId,
          data: { ...writeData, updatedAt: new Date().toISOString() },
          timestamp: Date.now()
        });
        return { success: true, offline: true };
      }
    } catch (error) {
      console.error(`Error updating ${collectionName}/${docId}:`, error.code, error.message);
      return { success: false, error: error.code || error.message };
    }
  };

  const deleteDocument = async (collectionName, docId) => {
    try {
      if (isOnline) {
        await deleteDoc(doc(db, collectionName, docId));
        return { success: true };
      } else {
        await dbService.addPendingSync({
          type: 'delete',
          collection: collectionName,
          id: docId,
          timestamp: Date.now()
        });
        return { success: true, offline: true };
      }
    } catch (error) {
      console.error(`Error deleting ${collectionName}/${docId}:`, error.code, error.message);
      return { success: false, error: error.code || error.message };
    }
  };

  // Fetch a single document by ID
  const fetchDocument = async (collectionName, docId) => {
    try {
      if (isOnline) {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
      } else {
        const offlineData = await dbService.getAll(collectionName);
        return (offlineData || []).find(item => item.id === docId) || null;
      }
    } catch (error) {
      console.error(`Error fetching ${collectionName}/${docId}:`, error.code, error.message);
      return null;
    }
  };

  // Set a document with a specific ID
  const setDocument = async (collectionName, docId, data) => {
    const writeData = {
      ...data,
      updatedBy: currentUser?.uid || 'unknown',
      updatedAt: serverTimestamp()
    };
    try {
      if (isOnline) {
        await setDoc(doc(db, collectionName, docId), writeData);
        return { success: true };
      } else {
        await dbService.addPendingSync({
          type: 'set',
          collection: collectionName,
          id: docId,
          data: { ...writeData, updatedAt: new Date().toISOString() },
          timestamp: Date.now()
        });
        return { success: true, offline: true };
      }
    } catch (error) {
      console.error(`Error setting ${collectionName}/${docId}:`, error.code, error.message);
      return { success: false, error: error.code || error.message };
    }
  };

  const value = {
    players,
    skills,
    evaluations,
    games,
    attendance,
    trainingNotes,
    schedule,
    notifications,
    teams,
    trainingPlans,
    loading,
    loadingStates,
    errors,
    isOnline,
    pendingSync: pendingSync.length,
    addDocument,
    updateDocument,
    deleteDocument,
    fetchDocument,
    setDocument,
    syncPendingOperations
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
