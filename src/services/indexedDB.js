import { openDB } from 'idb';

const DB_NAME = 'emerald-lakers-db';
const DB_VERSION = 3;

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores
      if (!db.objectStoreNames.contains('players')) {
        db.createObjectStore('players', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('games')) {
        db.createObjectStore('games', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('evaluations')) {
        db.createObjectStore('evaluations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('skills')) {
        db.createObjectStore('skills', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('attendance')) {
        db.createObjectStore('attendance', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('trainingNotes')) {
        db.createObjectStore('trainingNotes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingSync')) {
        const pendingStore = db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
        pendingStore.createIndex('timestamp', 'timestamp');
      }
      // v2: Add schedule, notifications, and teams stores
      if (!db.objectStoreNames.contains('schedule')) {
        db.createObjectStore('schedule', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('teams')) {
        db.createObjectStore('teams', { keyPath: 'id' });
      }
      // v3: Add parent_invitations store
      if (!db.objectStoreNames.contains('parent_invitations')) {
        db.createObjectStore('parent_invitations', { keyPath: 'id' });
      }
    },
  });
};

export const dbService = {
  // Generic get/set operations
  async getAll(storeName) {
    const db = await initDB();
    return db.getAll(storeName);
  },

  async get(storeName, id) {
    const db = await initDB();
    return db.get(storeName, id);
  },

  async set(storeName, data) {
    const db = await initDB();
    return db.put(storeName, data);
  },

  async setAll(storeName, dataArray) {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    await Promise.all([
      ...dataArray.map(item => tx.store.put(item)),
      tx.done
    ]);
  },

  async delete(storeName, id) {
    const db = await initDB();
    return db.delete(storeName, id);
  },

  async clear(storeName) {
    const db = await initDB();
    return db.clear(storeName);
  },

  // Pending sync operations
  async addPendingSync(operation) {
    const db = await initDB();
    return db.add('pendingSync', {
      ...operation,
      timestamp: Date.now()
    });
  },

  async getPendingSync() {
    const db = await initDB();
    return db.getAll('pendingSync');
  },

  async removePendingSync(id) {
    const db = await initDB();
    return db.delete('pendingSync', id);
  },

  async clearPendingSync() {
    const db = await initDB();
    return db.clear('pendingSync');
  }
};

export default dbService;
