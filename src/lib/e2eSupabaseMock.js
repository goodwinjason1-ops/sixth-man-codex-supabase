const AUTH_STORAGE_KEY = 'sixthMan.e2eUser';
const DOCUMENTS_STORAGE_KEY = 'sixthMan.e2eDocuments';

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

const getRows = () => json.read(DOCUMENTS_STORAGE_KEY, []);

const setRows = (rows) => json.write(DOCUMENTS_STORAGE_KEY, rows);

const matches = (row, filters) =>
  filters.every(({ column, value }) => row[column] === value);

class DocumentsQuery {
  constructor(action = 'select', payload = null) {
    this.action = action;
    this.payload = payload;
    this.filters = [];
    this.single = false;
  }

  select() {
    this.action = 'select';
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, value });
    return this;
  }

  maybeSingle() {
    this.single = true;
    return this;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    const rows = getRows();

    if (this.action === 'delete') {
      setRows(rows.filter((row) => !matches(row, this.filters)));
      return { data: null, error: null };
    }

    const data = rows.filter((row) => matches(row, this.filters));
    return {
      data: this.single ? (data[0] || null) : data,
      error: null
    };
  }
}

const makeDocumentsApi = () => ({
  select() {
    return new DocumentsQuery('select');
  },
  upsert(payload) {
    const rows = getRows();
    const incoming = Array.isArray(payload) ? payload : [payload];
    incoming.forEach((row) => {
      const index = rows.findIndex((existing) =>
        existing.collection === row.collection && existing.id === row.id
      );
      if (index >= 0) rows[index] = { ...rows[index], ...row };
      else rows.push(row);
    });
    setRows(rows);
    return Promise.resolve({ data: payload, error: null });
  },
  delete() {
    return new DocumentsQuery('delete');
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
    if (table !== 'documents') {
      throw new Error(`E2E Supabase mock only supports public.documents, got ${table}.`);
    }
    return makeDocumentsApi();
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
