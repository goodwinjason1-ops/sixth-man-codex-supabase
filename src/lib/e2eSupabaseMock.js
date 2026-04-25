const AUTH_STORAGE_KEY = 'sixthMan.e2eUser';
const DOCUMENTS_STORAGE_KEY = 'sixthMan.e2eDocuments';
const TABLE_STORAGE_PREFIX = 'sixthMan.e2eTable.';

const json = {
  read(key, fallback) {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  },
  write(key, value) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  }
};

const roleFromEmail = (email = '') => {
  const prefix = email.split('@')[0];
  const roles = {
    admin: 'admin',
    president: 'president',
    vice: 'vice_president',
    coordinator: 'coach_coordinator',
    coachcoordinator: 'coach_coordinator',
    coach_coordinator: 'coach_coordinator',
    girls: 'girls_coordinator',
    boys: 'boys_coordinator',
    coach: 'coach',
    youthhead: 'youth_head_coach',
    youth: 'youth_coach',
    player: 'player',
    parent: 'parent',
    manager: 'team_manager',
    assessor: 'tryout_assessor',
    pending: 'pending'
  };
  return roles[prefix] || 'admin';
};

const userForEmail = (email) => {
  const role = roleFromEmail(email);
  return {
    id: `${role}-user`,
    email,
    user_metadata: {
      display_name: `${role.replace(/_/g, ' ')} User`
    },
    app_metadata: {
      provider: 'email'
    }
  };
};

const getCurrentUser = () => json.read(AUTH_STORAGE_KEY, null);

const setCurrentUser = (user) => {
  if (user) json.write(AUTH_STORAGE_KEY, user);
  else json.remove(AUTH_STORAGE_KEY);
};

const tableStorageKey = (table) =>
  table === 'documents' ? DOCUMENTS_STORAGE_KEY : `${TABLE_STORAGE_PREFIX}${table}`;

const getRows = (table = 'documents') => json.read(tableStorageKey(table), []);

const setRows = (table = 'documents', rows) => json.write(tableStorageKey(table), rows);

const makeId = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const matches = (row, filters) =>
  filters.every(({ column, value }) => row[column] === value);

class TableQuery {
  constructor(table, action = 'select', payload = null) {
    this.table = table;
    this.action = action;
    this.payload = payload;
    this.filters = [];
    this.singleResult = false;
    this.ordering = null;
    this.limitCount = null;
  }

  select() {
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, value });
    return this;
  }

  maybeSingle() {
    this.singleResult = true;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  order(column, options = {}) {
    this.ordering = { column, ascending: options.ascending !== false };
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    const rows = getRows(this.table);
    const now = new Date().toISOString();

    if (this.action === 'delete') {
      setRows(this.table, rows.filter((row) => !matches(row, this.filters)));
      return { data: null, error: null };
    }

    if (this.action === 'insert' || this.action === 'upsert') {
      const incoming = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((row) => ({
        ...row,
        id: row.id || makeId(),
        created_at: row.created_at || now,
        updated_at: row.updated_at || now
      }));

      incoming.forEach((row) => {
        const index = rows.findIndex((existing) =>
          existing.id === row.id ||
          (existing.collection === row.collection && existing.id === row.id)
        );
        if (index >= 0) rows[index] = { ...rows[index], ...row, updated_at: row.updated_at || now };
        else rows.push(row);
      });

      setRows(this.table, rows);
      return {
        data: this.singleResult ? incoming[0] : incoming,
        error: null
      };
    }

    if (this.action === 'update') {
      const updated = [];
      const nextRows = rows.map((row) => {
        if (!matches(row, this.filters)) return row;
        const next = { ...row, ...this.payload, updated_at: now };
        updated.push(next);
        return next;
      });
      setRows(this.table, nextRows);
      return {
        data: this.singleResult ? (updated[0] || null) : updated,
        error: null
      };
    }

    let data = rows.filter((row) => matches(row, this.filters));
    if (this.ordering) {
      const { column, ascending } = this.ordering;
      data = [...data].sort((a, b) => {
        const left = a[column] || '';
        const right = b[column] || '';
        if (left === right) return 0;
        return (left > right ? 1 : -1) * (ascending ? 1 : -1);
      });
    }
    if (this.limitCount != null) data = data.slice(0, this.limitCount);

    return {
      data: this.singleResult ? (data[0] || null) : data,
      error: null
    };
  }
}

const makeTableApi = (table) => ({
  select() {
    return new TableQuery(table, 'select');
  },
  insert(payload) {
    return new TableQuery(table, 'insert', payload);
  },
  upsert(payload) {
    return new TableQuery(table, 'upsert', payload);
  },
  update(payload) {
    return new TableQuery(table, 'update', payload);
  },
  delete() {
    return new TableQuery(table, 'delete');
  }
});

const createAuthApi = () => {
  const listeners = new Set();

  const emit = (event, user) => {
    listeners.forEach((callback) => callback(event, user ? { user } : null));
  };

  return {
    async getUser() {
      const user = getCurrentUser();
      if (!user) {
        return {
          data: { user: null },
          error: { message: 'Auth session missing!' }
        };
      }
      return { data: { user }, error: null };
    },
    onAuthStateChange(callback) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback)
          }
        }
      };
    },
    async signInWithPassword({ email }) {
      const user = userForEmail(email);
      setCurrentUser(user);
      emit('SIGNED_IN', user);
      return { data: { user, session: { user } }, error: null };
    },
    async signUp({ email, options }) {
      const user = {
        ...userForEmail(email),
        id: `user-${Date.now()}`,
        user_metadata: {
          display_name: options?.data?.display_name || email
        }
      };
      setCurrentUser(user);
      emit('SIGNED_IN', user);
      return { data: { user, session: { user } }, error: null };
    },
    async signInWithOAuth({ provider }) {
      const user = userForEmail(`${provider}@test.com`);
      setCurrentUser(user);
      emit('SIGNED_IN', user);
      return { data: { provider, url: '/welcome' }, error: null };
    },
    async resetPasswordForEmail() {
      return { data: {}, error: null };
    },
    async signOut() {
      setCurrentUser(null);
      emit('SIGNED_OUT', null);
      return { error: null };
    },
    async updateUser({ data }) {
      const user = {
        ...getCurrentUser(),
        user_metadata: {
          ...(getCurrentUser()?.user_metadata || {}),
          ...data
        }
      };
      setCurrentUser(user);
      emit('USER_UPDATED', user);
      return { data: { user }, error: null };
    }
  };
};

export const createE2ESupabaseClient = () => ({
  auth: createAuthApi(),
  from(table) {
    return makeTableApi(table);
  },
  channel() {
    return {
      on() {
        return this;
      },
      subscribe(callback) {
        callback?.('SUBSCRIBED');
        return this;
      }
    };
  },
  removeChannel() {},
  storage: {
    from(bucket) {
      return {
        async upload(path) {
          return { data: { path, bucket }, error: null };
        },
        getPublicUrl(path) {
          return { data: { publicUrl: `https://e2e.local/storage/${bucket}/${path}` } };
        },
        async createSignedUrl(path) {
          return {
            data: { signedUrl: `https://e2e.local/storage/${bucket}/${path}?signed=e2e` },
            error: null
          };
        }
      };
    }
  }
});
