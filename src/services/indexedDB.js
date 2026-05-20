import { openDB, deleteDB } from 'idb';

const DB_NAME = 'emerald-lakers-db';
const DB_VERSION = 5;

let dbPromise = null;
let dbDisabled = false;

const createDB = () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const stores = [
        'players', 'games', 'evaluations', 'skills', 'attendance',
        'trainingNotes', 'schedule', 'notifications', 'teams',
        'trainingPlans', 'trainingRecords', 'playboards',
        'parent_invitations', 'match_assessments',
      ];
      stores.forEach(name => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      });
      if (!db.objectStoreNames.contains('pendingSync')) {
        const ps = db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
        ps.createIndex('timestamp', 'timestamp');
      }
    },
  });
};

const initDB = async () => {
  if (dbDisabled) return null;
  if (!dbPromise) {
    dbPromise = createDB().catch(async (err) => {
      console.warn('IndexedDB failed, disabling cache:', err.message);
      dbPromise = null;
      dbDisabled = true;
      try { await deleteDB(DB_NAME); } catch (_) { /* ignore */ }
      return null;
    });
  }
  return dbPromise;
};

/**
 * Safely run an IndexedDB operation.
 * On ANY error: delete the database, disable IndexedDB for the rest of
 * this page session, and return undefined. Never retry.
 * Firestore snapshots are the source of truth — IndexedDB is just a cache.
 */
const safeOp = async (fn) => {
  if (dbDisabled) return undefined;
  try {
    const db = await initDB();
    if (!db) return undefined;
    return await fn(db);
  } catch (_) {
    // Any error at all: nuke DB and disable for this session
    dbPromise = null;
    dbDisabled = true;
    try { await deleteDB(DB_NAME); } catch (__) { /* ignore */ }
    return undefined;
  }
};

export const dbService = {
  async getAll(storeName) {
    return safeOp(db => db.getAll(storeName));
  },

  async get(storeName, id) {
    return safeOp(db => db.get(storeName, id));
  },

  async set(storeName, data) {
    return safeOp(db => db.put(storeName, data));
  },

  async setAll(storeName, dataArray) {
    return safeOp(async (db) => {
      const tx = db.transaction(storeName, 'readwrite');
      await tx.store.clear();
      await Promise.all(dataArray.map(item => tx.store.put(item)));
      await tx.done;
    });
  },

  async delete(storeName, id) {
    return safeOp(db => db.delete(storeName, id));
  },

  async clear(storeName) {
    return safeOp(db => db.clear(storeName));
  },

  async addPendingSync(operation) {
    return safeOp(db => db.add('pendingSync', {
      ...operation,
      timestamp: Date.now()
    }));
  },

  async getPendingSync() {
    return safeOp(db => db.getAll('pendingSync'));
  },

  async removePendingSync(id) {
    return safeOp(db => db.delete('pendingSync', id));
  },

  async clearPendingSync() {
    return safeOp(db => db.clear('pendingSync'));
  }
};

export default dbService;
