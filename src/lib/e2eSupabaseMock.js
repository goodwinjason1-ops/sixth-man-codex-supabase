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

const normalizeInvitationCode = (code = '') => code.trim().toUpperCase();

const invitationPlayerNames = (playerIds = []) => getRows('documents')
  .filter((row) => row.collection === 'players' && playerIds.includes(row.id))
  .map((row) => ({
    id: row.id,
    name: row.data?.name || row.data?.displayName || `${row.data?.firstName || ''} ${row.data?.lastName || ''}`.trim() || 'Unknown'
  }));

const findInvitationByCode = (code) => {
  const normalizedCode = normalizeInvitationCode(code);
  return getRows('documents').find((row) =>
    row.collection === 'parent_invitations' &&
    normalizeInvitationCode(row.data?.invitationCode) === normalizedCode
  );
};

const validateE2EParentInvitation = (code) => {
  const invitation = findInvitationByCode(code);
  if (!invitation) {
    return {
      valid: false,
      error: 'Invalid invitation code. Please check your invitation email.'
    };
  }

  if (invitation.data.status === 'accepted') {
    return { valid: false, error: 'This invitation has already been used.' };
  }

  if (invitation.data.status === 'revoked') {
    return {
      valid: false,
      error: 'This invitation has been revoked. Please contact your club administrator.'
    };
  }

  if (invitation.data.status !== 'pending') {
    return { valid: false, error: 'This invitation is no longer valid.' };
  }

  if (invitation.data.expiresAt && new Date(invitation.data.expiresAt) < new Date()) {
    return {
      valid: false,
      error: 'This invitation has expired. Please contact your club administrator for a new one.'
    };
  }

  const playerIds = invitation.data.playerIds || [];
  return {
    valid: true,
    invitation: {
      id: invitation.id,
      invitationCode: invitation.data.invitationCode,
      parentEmail: invitation.data.parentEmail || '',
      parentName: invitation.data.parentName || '',
      status: invitation.data.status,
      expiresAt: invitation.data.expiresAt,
      playerIds,
      playerNames: invitationPlayerNames(playerIds)
    }
  };
};

const acceptE2EParentInvitation = ({ invitation_code: invitationCode, display_name: displayName }) => {
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'auth-required' };

  const invitation = findInvitationByCode(invitationCode);
  if (!invitation) return { success: false, error: 'invalid-invitation' };
  if (invitation.data.status !== 'pending') return { success: false, error: 'invitation-not-pending' };
  if (invitation.data.expiresAt && new Date(invitation.data.expiresAt) < new Date()) {
    return { success: false, error: 'invitation-expired' };
  }
  if (invitation.data.parentEmail && user.email?.toLowerCase() !== invitation.data.parentEmail.toLowerCase()) {
    return { success: false, error: 'google-email-mismatch' };
  }

  const now = new Date().toISOString();
  const playerIds = invitation.data.playerIds || [];
  const rows = getRows('documents');
  const userIndex = rows.findIndex((row) => row.collection === 'users' && row.id === user.id);
  const existingProfile = userIndex >= 0 ? rows[userIndex].data : {};
  if (existingProfile?.role && !['pending', 'parent'].includes(existingProfile.role)) {
    return { success: false, error: 'account-has-existing-role' };
  }

  const profile = {
    ...existingProfile,
    uid: user.id,
    email: user.email,
    displayName: displayName || existingProfile.displayName || invitation.data.parentName || user.email,
    role: 'parent',
    linkedPlayerIds: [...new Set([...(existingProfile.linkedPlayerIds || []), ...playerIds])],
    invitationCode: invitation.data.invitationCode,
    createdAt: existingProfile.createdAt || now,
    photoURL: existingProfile.photoURL || null
  };

  if (userIndex >= 0) {
    rows[userIndex] = { ...rows[userIndex], data: profile, updated_at: now, updated_by: user.id };
  } else {
    rows.push({
      collection: 'users',
      id: user.id,
      data: profile,
      created_at: now,
      updated_at: now,
      created_by: user.id,
      updated_by: user.id
    });
  }

  const invitationIndex = rows.findIndex((row) => row.collection === 'parent_invitations' && row.id === invitation.id);
  if (invitationIndex >= 0) {
    rows[invitationIndex] = {
      ...rows[invitationIndex],
      data: {
        ...rows[invitationIndex].data,
        status: 'accepted',
        acceptedBy: user.id,
        acceptedAt: now
      },
      updated_at: now,
      updated_by: user.id
    };
  }

  playerIds.forEach((playerId) => {
    const playerIndex = rows.findIndex((row) => row.collection === 'players' && row.id === playerId);
    if (playerIndex < 0) return;
    rows[playerIndex] = {
      ...rows[playerIndex],
      data: {
        ...rows[playerIndex].data,
        linkedParentIds: [...new Set([...(rows[playerIndex].data.linkedParentIds || []), user.id])]
      },
      updated_at: now,
      updated_by: user.id
    };
  });

  setRows('documents', rows);
  return {
    success: true,
    profile,
    invitation: {
      id: invitation.id,
      invitationCode: invitation.data.invitationCode,
      playerIds
    }
  };
};

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
    async signInWithOAuth({ provider, options = {} }) {
      if (window.__SIXTH_MAN_E2E_OAUTH_URL__) {
        const url = new URL(window.__SIXTH_MAN_E2E_OAUTH_URL__, window.location.origin);
        Object.entries(options.queryParams || {}).forEach(([key, value]) => {
          if (value != null) url.searchParams.set(key, value);
        });
        return { data: { provider, url: url.toString() }, error: null };
      }
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

const processE2EVideoWorker = ({ limit = 3, jobId } = {}) => {
  const now = new Date().toISOString();
  const allJobs = getRows('video_analysis_jobs');
  const claimed = allJobs
    .filter((job) => job.status === 'queued' && (!jobId || job.id === jobId))
    .sort((a, b) => (a.priority || 50) - (b.priority || 50) || String(a.created_at || '').localeCompare(String(b.created_at || '')))
    .slice(0, Math.max(1, Math.min(Number(limit) || 3, 10)));

  if (claimed.length === 0) return { claimed: 0, processed: [] };

  let jobs = allJobs;
  let events = getRows('video_events');
  let stats = getRows('game_video_stats');
  const processed = [];
  const sessionIds = new Set();

  claimed.forEach((job) => {
    sessionIds.add(job.session_id);
    const result = {
      summary: 'Video AI worker processed this job in the E2E environment.',
      eventRowsWritten: 0,
      statRowsWritten: 0,
      shotDocumentsWritten: 0
    };
    let status = 'succeeded';
    let provider = 'e2e-video-worker';
    let model = 'mock-video-analysis';

    if (job.job_kind === 'transcode') {
      result.summary = 'Source video retained in private Supabase Storage for staff review.';
      model = 'source-retained';
    } else if (job.job_kind === 'vision_event_detection') {
      const event = {
        id: makeId(),
        session_id: job.session_id,
        recording_id: job.recording_id || null,
        analysis_job_id: job.id,
        event_type: 'video_classification',
        start_ms: 0,
        end_ms: null,
        team_id: job.input?.teamId || null,
        player_id: null,
        confidence: 0.82,
        source: 'ai',
        status: 'detected',
        court_position: {},
        bounding_boxes: [],
        attributes: {
          label: 'basketball action',
          e2e: true
        },
        created_at: now,
        updated_at: now
      };
      events = events.filter((row) => row.analysis_job_id !== job.id).concat(event);
      result.summary = 'Top video classification: basketball action (82%).';
      result.eventsDetected = 1;
      result.eventRowsWritten = 1;
    } else if (job.job_kind === 'stat_extraction') {
      const sessionEvents = events.filter((event) => event.session_id === job.session_id);
      const stat = {
        id: makeId(),
        session_id: job.session_id,
        game_id: job.input?.gameId || null,
        team_id: job.input?.teamId || null,
        player_id: null,
        stat_type: 'video_classification_count',
        stat_value: sessionEvents.length,
        confidence: null,
        source: 'ai',
        status: 'detected',
        metadata: {
          analysisJobId: job.id,
          e2e: true
        },
        created_at: now,
        updated_at: now
      };
      stats = stats.filter((row) => row.metadata?.analysisJobId !== job.id).concat(stat);
      result.summary = `Generated 1 stat rollup from ${sessionEvents.length} detected event${sessionEvents.length === 1 ? '' : 's'}.`;
      result.statsGenerated = 1;
      result.statRowsWritten = 1;
      provider = 'e2e-video-worker';
      model = 'event-rollup';
    } else {
      status = 'needs_review';
      result.summary = `${job.job_kind || 'Video job'} needs manual review in the E2E environment.`;
    }

    jobs = jobs.map((row) => row.id === job.id ? {
      ...row,
      status,
      provider,
      model,
      result,
      attempts: (row.attempts || 0) + 1,
      started_at: row.started_at || now,
      completed_at: now,
      locked_by: null,
      locked_at: null,
      updated_at: now
    } : row);

    processed.push({
      id: job.id,
      jobKind: job.job_kind,
      status,
      eventRowsWritten: result.eventRowsWritten,
      statRowsWritten: result.statRowsWritten,
      shotDocumentsWritten: 0
    });
  });

  let sessions = getRows('video_recording_sessions');
  sessions = sessions.map((session) => {
    if (!sessionIds.has(session.id)) return session;
    const sessionJobs = jobs.filter((job) => job.session_id === session.id);
    const active = sessionJobs.some((job) => ['queued', 'running'].includes(job.status));
    return {
      ...session,
      status: active ? 'analysing' : 'review',
      metadata: {
        ...(session.metadata || {}),
        workerUpdatedAt: now,
        jobStatuses: sessionJobs.map((job) => job.status)
      },
      updated_at: now
    };
  });

  setRows('video_analysis_jobs', jobs);
  setRows('video_events', events);
  setRows('game_video_stats', stats);
  setRows('video_recording_sessions', sessions);

  return {
    claimed: claimed.length,
    processed
  };
};

export const createE2ESupabaseClient = () => ({
  auth: createAuthApi(),
  async rpc(functionName, args = {}) {
    if (functionName === 'validate_parent_invitation') {
      return { data: validateE2EParentInvitation(args.invitation_code), error: null };
    }
    if (functionName === 'accept_parent_invitation') {
      return { data: acceptE2EParentInvitation(args), error: null };
    }
    return {
      data: null,
      error: {
        code: 'PGRST202',
        message: `Function ${functionName} not found in the E2E Supabase mock`
      }
    };
  },
  from(table) {
    return makeTableApi(table);
  },
  functions: {
    async invoke(functionName, options = {}) {
      if (functionName === 'video-job-worker') {
        return { data: processE2EVideoWorker(options.body || {}), error: null };
      }
      return {
        data: null,
        error: {
          message: `Function ${functionName} not found in the E2E Supabase mock`
        }
      };
    }
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
