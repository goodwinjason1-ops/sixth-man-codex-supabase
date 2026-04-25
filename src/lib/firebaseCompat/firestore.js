import { getApp } from './app';
import { supabase as defaultSupabase } from '../supabaseClient';

const DOCUMENTS_TABLE = 'documents';
const OP_KEY = '__firestoreCompatOp';

const makeError = (code, message, originalError) => {
  const error = new Error(message);
  error.code = code;
  error.originalError = originalError;
  return error;
};

const mapDbError = (error, fallbackCode = 'unknown') => {
  if (!error) return null;
  return makeError(error.code || fallbackCode, error.message || 'Supabase request failed.', error);
};

const randomId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().replace(/-/g, '');
  }

  const bytes = globalThis.crypto?.getRandomValues?.(new Uint8Array(20));
  if (bytes) return Array.from(bytes).map((n) => (n % 36).toString(36)).join('');
  return Math.random().toString(36).slice(2, 22);
};

const isObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  !(value instanceof Date) &&
  !(value instanceof Timestamp);

const deepClone = (value) => {
  if (Array.isArray(value)) return value.map(deepClone);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, deepClone(v)])
    );
  }
  return value;
};

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const getField = (data, fieldPath) => {
  if (!fieldPath) return undefined;
  return String(fieldPath)
    .split('.')
    .reduce((current, part) => current?.[part], data);
};

const setField = (data, fieldPath, value) => {
  const parts = String(fieldPath).split('.');
  let target = data;
  parts.slice(0, -1).forEach((part) => {
    if (!isObject(target[part])) target[part] = {};
    target = target[part];
  });
  target[parts[parts.length - 1]] = value;
};

const deleteNestedField = (data, fieldPath) => {
  const parts = String(fieldPath).split('.');
  let target = data;
  parts.slice(0, -1).forEach((part) => {
    target = target?.[part];
  });
  if (target && Object.prototype.hasOwnProperty.call(target, parts[parts.length - 1])) {
    delete target[parts[parts.length - 1]];
  }
};

const toComparable = (value) => {
  if (value instanceof Timestamp) return value.toMillis();
  if (value?.toDate) return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? value.toLowerCase() : parsed;
  }
  return value;
};

const compareValues = (left, right) => {
  const a = toComparable(left);
  const b = toComparable(right);
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  return a < b ? -1 : 1;
};

export class Timestamp {
  constructor(seconds, nanoseconds = 0) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  static now() {
    return Timestamp.fromDate(new Date());
  }

  static fromDate(date) {
    const millis = date.getTime();
    const seconds = Math.floor(millis / 1000);
    return new Timestamp(seconds, (millis - seconds * 1000) * 1000000);
  }

  static fromMillis(milliseconds) {
    return Timestamp.fromDate(new Date(milliseconds));
  }

  toDate() {
    return new Date(this.seconds * 1000 + Math.floor(this.nanoseconds / 1000000));
  }

  toMillis() {
    return this.toDate().getTime();
  }

  toJSON() {
    return this.toDate().toISOString();
  }

  valueOf() {
    return this.toMillis();
  }
}

const op = (name, payload = {}) => ({ [OP_KEY]: name, ...payload });

export const serverTimestamp = () => op('serverTimestamp');
export const deleteField = () => op('deleteField');
export const increment = (by) => op('increment', { by });
export const arrayUnion = (...values) => op('arrayUnion', { values });
export const arrayRemove = (...values) => op('arrayRemove', { values });

const isOp = (value, name) => isObject(value) && value[OP_KEY] === name;

const normalizeLiteral = (value, existingValue, now, mergeObjects = false) => {
  if (value === undefined) return undefined;
  if (isOp(value, 'serverTimestamp')) return now;
  if (isOp(value, 'increment')) return (Number(existingValue) || 0) + Number(value.by || 0);
  if (isOp(value, 'arrayUnion')) {
    const base = Array.isArray(existingValue) ? [...existingValue] : [];
    value.values.map((v) => normalizeLiteral(v, undefined, now)).forEach((item) => {
      if (!base.some((existing) => deepEqual(existing, item))) base.push(item);
    });
    return base;
  }
  if (isOp(value, 'arrayRemove')) {
    const removeValues = value.values.map((v) => normalizeLiteral(v, undefined, now));
    return (Array.isArray(existingValue) ? existingValue : [])
      .filter((item) => !removeValues.some((removeValue) => deepEqual(removeValue, item)));
  }
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeLiteral(item, undefined, now, mergeObjects))
      .filter((item) => item !== undefined);
  }
  if (isObject(value)) {
    const base = mergeObjects && isObject(existingValue) ? deepClone(existingValue) : {};
    Object.entries(value).forEach(([key, childValue]) => {
      if (childValue === undefined) return;
      if (isOp(childValue, 'deleteField')) {
        deleteNestedField(base, key);
        return;
      }
      const nextValue = normalizeLiteral(childValue, base[key], now, mergeObjects);
      if (nextValue !== undefined) base[key] = nextValue;
    });
    return base;
  }
  return value;
};

const applyWriteData = (baseData, writeData, now, { mergeObjects = false } = {}) => {
  const next = deepClone(baseData || {});
  Object.entries(writeData || {}).forEach(([fieldPath, value]) => {
    if (value === undefined) return;
    if (isOp(value, 'deleteField')) {
      deleteNestedField(next, fieldPath);
      return;
    }
    const existingValue = getField(next, fieldPath);
    const resolved = normalizeLiteral(value, existingValue, now, mergeObjects);
    if (resolved !== undefined) setField(next, fieldPath, resolved);
  });
  return next;
};

const dbByClient = new WeakMap();

export const getFirestore = (app = getApp()) => {
  const client = app?.supabase || defaultSupabase;
  if (!dbByClient.has(client)) {
    dbByClient.set(client, { type: 'firestoreCompatDb', supabase: client });
  }
  return dbByClient.get(client);
};

export const enableIndexedDbPersistence = async () => {
  console.warn('Firestore IndexedDB persistence is disabled in the Supabase compatibility layer.');
};

const ensureDb = (value) => {
  if (value?.type === 'firestoreCompatDb') return value;
  if (value?.db) return value.db;
  return getFirestore();
};

export const collection = (parent, ...segments) => {
  const db = ensureDb(parent);
  const prefix = parent?.type === 'documentRef' ? parent.path : '';
  const path = [prefix, ...segments].filter(Boolean).join('/');
  return {
    type: 'collectionRef',
    db,
    id: path.split('/').filter(Boolean).at(-1),
    path
  };
};

export const doc = (parent, ...segments) => {
  if (parent?.type === 'collectionRef') {
    const id = segments[0] || randomId();
    return {
      type: 'documentRef',
      db: parent.db,
      id,
      collection: parent.path,
      path: `${parent.path}/${id}`,
      parent
    };
  }

  const db = ensureDb(parent);
  const path = segments.join('/');
  const parts = path.split('/').filter(Boolean);
  const id = parts.at(-1) || randomId();
  const collectionPath = parts.slice(0, -1).join('/');
  const parentCollection = collection(db, collectionPath);
  return {
    type: 'documentRef',
    db,
    id,
    collection: collectionPath,
    path: `${collectionPath}/${id}`,
    parent: parentCollection
  };
};

const makeDocumentSnapshot = (ref, data, exists = true) => ({
  id: ref.id,
  ref,
  metadata: { fromCache: false, hasPendingWrites: false },
  exists: () => exists,
  data: () => (exists ? deepClone(data || {}) : undefined),
  get: (fieldPath) => (exists ? getField(data || {}, fieldPath) : undefined)
});

const makeQuerySnapshot = (docs) => ({
  docs,
  empty: docs.length === 0,
  size: docs.length,
  metadata: { fromCache: false, hasPendingWrites: false },
  forEach: (callback) => docs.forEach(callback),
  docChanges: () => docs.map((document) => ({ type: 'added', doc: document }))
});

const asQuery = (refOrQuery) => {
  if (refOrQuery?.type === 'query') return refOrQuery;
  if (refOrQuery?.type === 'collectionRef') {
    return { type: 'query', collectionRef: refOrQuery, constraints: [] };
  }
  throw makeError('invalid-argument', 'Expected a collection reference or query.');
};

export const query = (base, ...constraints) => {
  const existing = asQuery(base);
  return {
    type: 'query',
    collectionRef: existing.collectionRef,
    constraints: [...existing.constraints, ...constraints.filter(Boolean)]
  };
};

export const where = (fieldPath, operator, value) => ({
  type: 'where',
  fieldPath,
  operator,
  value
});

export const orderBy = (fieldPath, direction = 'asc') => ({
  type: 'orderBy',
  fieldPath,
  direction
});

export const limit = (count) => ({
  type: 'limit',
  count
});

export const startAfter = (...values) => ({
  type: 'startAfter',
  values
});

const matchesWhere = (document, constraint) => {
  const actual = document.get(constraint.fieldPath);
  const expected = constraint.value;

  switch (constraint.operator) {
    case '==':
      return deepEqual(actual, expected);
    case '!=':
      return !deepEqual(actual, expected);
    case 'in':
      return Array.isArray(expected) && expected.some((item) => deepEqual(actual, item));
    case 'array-contains':
      return Array.isArray(actual) && actual.some((item) => deepEqual(item, expected));
    case 'array-contains-any':
      return Array.isArray(actual) && Array.isArray(expected) &&
        actual.some((item) => expected.some((expectedItem) => deepEqual(item, expectedItem)));
    case '<':
      return compareValues(actual, expected) < 0;
    case '<=':
      return compareValues(actual, expected) <= 0;
    case '>':
      return compareValues(actual, expected) > 0;
    case '>=':
      return compareValues(actual, expected) >= 0;
    default:
      return true;
  }
};

const applyConstraints = (docs, constraints) => {
  let result = [...docs];
  const whereConstraints = constraints.filter((c) => c.type === 'where');
  const orderConstraints = constraints.filter((c) => c.type === 'orderBy');
  const startAfterConstraint = constraints.find((c) => c.type === 'startAfter');
  const limitConstraint = constraints.find((c) => c.type === 'limit');

  whereConstraints.forEach((constraint) => {
    result = result.filter((document) => matchesWhere(document, constraint));
  });

  if (orderConstraints.length > 0) {
    result.sort((a, b) => {
      for (const constraint of orderConstraints) {
        const direction = constraint.direction === 'desc' ? -1 : 1;
        const comparison = compareValues(a.get(constraint.fieldPath), b.get(constraint.fieldPath));
        if (comparison !== 0) return comparison * direction;
      }
      return a.id.localeCompare(b.id);
    });
  }

  if (startAfterConstraint) {
    const [cursor] = startAfterConstraint.values;
    if (cursor?.id) {
      const index = result.findIndex((document) => document.id === cursor.id);
      if (index >= 0) result = result.slice(index + 1);
    } else if (orderConstraints.length > 0) {
      const cursorValues = startAfterConstraint.values;
      result = result.filter((document) => orderConstraints.some((constraint, index) => {
        const comparison = compareValues(document.get(constraint.fieldPath), cursorValues[index]);
        return constraint.direction === 'desc' ? comparison < 0 : comparison > 0;
      }));
    }
  }

  if (limitConstraint) {
    result = result.slice(0, Number(limitConstraint.count));
  }

  return result;
};

export const getDoc = async (documentRef) => {
  const ref = documentRef;
  const { data, error } = await ref.db.supabase
    .from(DOCUMENTS_TABLE)
    .select('collection,id,data,created_at,updated_at,created_by,updated_by')
    .eq('collection', ref.collection)
    .eq('id', ref.id)
    .maybeSingle();

  if (error) throw mapDbError(error);
  return makeDocumentSnapshot(ref, data?.data, Boolean(data));
};

export const getDocFromServer = getDoc;

export const getDocs = async (refOrQuery) => {
  const queryRef = asQuery(refOrQuery);
  const { data, error } = await queryRef.collectionRef.db.supabase
    .from(DOCUMENTS_TABLE)
    .select('collection,id,data,created_at,updated_at,created_by,updated_by')
    .eq('collection', queryRef.collectionRef.path);

  if (error) throw mapDbError(error);

  const docs = (data || []).map((row) => {
    const ref = doc(queryRef.collectionRef, row.id);
    return makeDocumentSnapshot(ref, row.data || {}, true);
  });

  return makeQuerySnapshot(applyConstraints(docs, queryRef.constraints));
};

const getCurrentUid = async (db) => {
  try {
    const { data } = await db.supabase.auth.getUser();
    return data?.user?.id || null;
  } catch (_) {
    return null;
  }
};

const writeDocument = async (documentRef, writeData, options = {}) => {
  const now = new Date().toISOString();
  const currentSnap = await getDoc(documentRef);
  const exists = currentSnap.exists();

  if (options.requireExists && !exists) {
    throw makeError('not-found', `Document ${documentRef.path} does not exist.`);
  }

  const baseData = options.merge || options.requireExists ? currentSnap.data() || {} : {};
  const nextData = applyWriteData(baseData, writeData, now, {
    mergeObjects: Boolean(options.merge)
  });
  const uid = await getCurrentUid(documentRef.db);
  const row = {
    collection: documentRef.collection,
    id: documentRef.id,
    data: nextData,
    updated_at: now,
    updated_by: uid
  };

  if (!exists) {
    row.created_at = now;
    row.created_by = uid;
  }

  const { error } = await documentRef.db.supabase
    .from(DOCUMENTS_TABLE)
    .upsert(row, { onConflict: 'collection,id' });

  if (error) throw mapDbError(error);
  return documentRef;
};

const normalizeFieldArgs = (dataOrField, value, moreFieldsAndValues) => {
  if (typeof dataOrField !== 'string') return dataOrField || {};

  const result = { [dataOrField]: value };
  for (let i = 0; i < moreFieldsAndValues.length; i += 2) {
    result[moreFieldsAndValues[i]] = moreFieldsAndValues[i + 1];
  }
  return result;
};

export const setDoc = async (documentRef, data, options = {}) =>
  writeDocument(documentRef, data, { merge: Boolean(options?.merge) });

export const updateDoc = async (documentRef, dataOrField, value, ...moreFieldsAndValues) =>
  writeDocument(
    documentRef,
    normalizeFieldArgs(dataOrField, value, moreFieldsAndValues),
    { requireExists: true }
  );

export const addDoc = async (collectionRef, data) => {
  const documentRef = doc(collectionRef);
  await setDoc(documentRef, data);
  return documentRef;
};

export const deleteDoc = async (documentRef) => {
  const { error } = await documentRef.db.supabase
    .from(DOCUMENTS_TABLE)
    .delete()
    .eq('collection', documentRef.collection)
    .eq('id', documentRef.id);

  if (error) throw mapDbError(error);
};

export const writeBatch = () => {
  const operations = [];
  return {
    set: (documentRef, data, options = {}) => {
      operations.push(() => setDoc(documentRef, data, options));
    },
    update: (documentRef, dataOrField, value, ...moreFieldsAndValues) => {
      operations.push(() => updateDoc(documentRef, dataOrField, value, ...moreFieldsAndValues));
    },
    delete: (documentRef) => {
      operations.push(() => deleteDoc(documentRef));
    },
    commit: async () => {
      for (const operation of operations) {
        await operation();
      }
    }
  };
};

export const onSnapshot = (refOrQuery, next, errorCallback) => {
  if (refOrQuery?.type === 'documentRef') {
    const documentRef = refOrQuery;
    let active = true;
    let timeoutId = null;

    const refresh = async () => {
      try {
        const snapshot = await getDoc(documentRef);
        if (active) {
          await Promise.resolve(next(snapshot));
        }
      } catch (error) {
        if (active) errorCallback?.(error);
      }
    };

    const scheduleRefresh = (payload) => {
      const changedId = payload?.new?.id || payload?.old?.id;
      if (!active || (changedId && changedId !== documentRef.id)) return;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(refresh, 100);
    };

    refresh();

    const channel = documentRef.db.supabase
      .channel(`documents:${documentRef.path}:${randomId()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: DOCUMENTS_TABLE,
          filter: `collection=eq.${documentRef.collection}`
        },
        scheduleRefresh
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          errorCallback?.(makeError('unavailable', 'Supabase realtime subscription failed.'));
        }
      });

    return () => {
      active = false;
      clearTimeout(timeoutId);
      documentRef.db.supabase.removeChannel(channel);
    };
  }

  const queryRef = asQuery(refOrQuery);
  let active = true;
  let timeoutId = null;

  const refresh = async () => {
    try {
      const snapshot = await getDocs(queryRef);
      if (active) {
        await Promise.resolve(next(snapshot));
      }
    } catch (error) {
      if (active) errorCallback?.(error);
    }
  };

  const scheduleRefresh = () => {
    if (!active) return;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(refresh, 100);
  };

  refresh();

  const channel = queryRef.collectionRef.db.supabase
    .channel(`documents:${queryRef.collectionRef.path}:${randomId()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: DOCUMENTS_TABLE,
        filter: `collection=eq.${queryRef.collectionRef.path}`
      },
      scheduleRefresh
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        errorCallback?.(makeError('unavailable', 'Supabase realtime subscription failed.'));
      }
    });

  return () => {
    active = false;
    clearTimeout(timeoutId);
    queryRef.collectionRef.db.supabase.removeChannel(channel);
  };
};
