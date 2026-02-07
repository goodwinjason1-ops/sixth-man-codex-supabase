import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  setDoc
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
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);

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
    if (!currentUser) return;

    const unsubscribers = [];

    // Players
    const playersQuery = query(collection(db, 'players'));
    unsubscribers.push(
      onSnapshot(playersQuery, async (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlayers(data);
        await dbService.setAll('players', data);
      }, async (error) => {
        console.error('Players snapshot error:', error);
        // Load from IndexedDB on error
        const offlineData = await dbService.getAll('players');
        setPlayers(offlineData);
      })
    );

    // Skills/Curriculum
    const skillsQuery = query(collection(db, 'curriculum'));
    unsubscribers.push(
      onSnapshot(skillsQuery, async (snapshot) => {
        const data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          drills: Array.isArray(doc.data().drills) ? doc.data().drills : [],
          category: doc.data().category || 'Uncategorized'
        }));
        setSkills(data);
        await dbService.setAll('skills', data);
      }, async (error) => {
        console.error('Skills snapshot error:', error);
        const offlineData = await dbService.getAll('skills');
        setSkills(offlineData);
      })
    );

    // Evaluations
    const evalsQuery = query(collection(db, 'evaluations'));
    unsubscribers.push(
      onSnapshot(evalsQuery, async (snapshot) => {
        const evalsObj = {};
        const evalsArray = [];
        snapshot.docs.forEach(doc => {
          const data = { id: doc.id, ...doc.data() };
          evalsObj[`${data.playerId}_${data.skillId}`] = data;
          evalsArray.push(data);
        });
        setEvaluations(evalsObj);
        await dbService.setAll('evaluations', evalsArray);
      }, async (error) => {
        console.error('Evaluations snapshot error:', error);
        const offlineData = await dbService.getAll('evaluations');
        const evalsObj = {};
        offlineData.forEach(data => {
          evalsObj[`${data.playerId}_${data.skillId}`] = data;
        });
        setEvaluations(evalsObj);
      })
    );

    // Games
    const gamesQuery = query(collection(db, 'games'), orderBy('date', 'desc'));
    unsubscribers.push(
      onSnapshot(gamesQuery, async (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGames(data);
        await dbService.setAll('games', data);
      }, async (error) => {
        console.error('Games snapshot error:', error);
        const offlineData = await dbService.getAll('games');
        setGames(offlineData);
      })
    );

    // Attendance
    const attendanceQuery = query(collection(db, 'attendance'));
    unsubscribers.push(
      onSnapshot(attendanceQuery, async (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAttendance(data);
        await dbService.setAll('attendance', data);
      }, async (error) => {
        console.error('Attendance snapshot error:', error);
        const offlineData = await dbService.getAll('attendance');
        setAttendance(offlineData);
      })
    );

    // Training Notes
    const notesQuery = query(collection(db, 'training_notes'), orderBy('date', 'desc'));
    unsubscribers.push(
      onSnapshot(notesQuery, async (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTrainingNotes(data);
        await dbService.setAll('trainingNotes', data);
      }, async (error) => {
        console.error('Training notes snapshot error:', error);
        const offlineData = await dbService.getAll('trainingNotes');
        setTrainingNotes(offlineData);
      })
    );

    // Schedule - with IndexedDB caching and sample fallback for testing
    const scheduleQuery = query(collection(db, 'schedule'), orderBy('date', 'asc'));
    unsubscribers.push(
      onSnapshot(scheduleQuery, async (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (data.length === 0) {
          // Check IndexedDB cache first before falling back to sample data
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
      }, async (error) => {
        console.error('Schedule snapshot error:', error);
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
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(data);
        await dbService.setAll('notifications', data);
      }, async (error) => {
        console.error('Notifications snapshot error:', error);
        const offlineData = await dbService.getAll('notifications');
        setNotifications(offlineData);
      })
    );

    // Teams
    const teamsQuery = query(collection(db, 'teams'));
    unsubscribers.push(
      onSnapshot(teamsQuery, async (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('[DataContext] Teams loaded:', data.length);
        setTeams(data);
        await dbService.setAll('teams', data);
      }, async (error) => {
        console.error('Teams snapshot error:', error);
        const offlineData = await dbService.getAll('teams');
        setTeams(offlineData);
      })
    );

    setLoading(false);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [currentUser]);

  // Helper methods for offline-first operations
  const addDocument = async (collectionName, data) => {
    if (isOnline) {
      return await addDoc(collection(db, collectionName), data);
    } else {
      await dbService.addPendingSync({
        type: 'add',
        collection: collectionName,
        data,
        timestamp: Date.now()
      });
    }
  };

  const updateDocument = async (collectionName, docId, data) => {
    if (isOnline) {
      return await updateDoc(doc(db, collectionName, docId), data);
    } else {
      await dbService.addPendingSync({
        type: 'update',
        collection: collectionName,
        id: docId,
        data,
        timestamp: Date.now()
      });
    }
  };

  const deleteDocument = async (collectionName, docId) => {
    if (isOnline) {
      return await deleteDoc(doc(db, collectionName, docId));
    } else {
      await dbService.addPendingSync({
        type: 'delete',
        collection: collectionName,
        id: docId,
        timestamp: Date.now()
      });
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
        // Try to get from IndexedDB when offline
        const offlineData = await dbService.getAll(collectionName);
        return offlineData.find(item => item.id === docId) || null;
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      return null;
    }
  };

  // Set a document with a specific ID (for admin operations)
  const setDocument = async (collectionName, docId, data) => {
    if (isOnline) {
      return await setDoc(doc(db, collectionName, docId), data);
    } else {
      await dbService.addPendingSync({
        type: 'set',
        collection: collectionName,
        id: docId,
        data,
        timestamp: Date.now()
      });
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
    loading,
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
