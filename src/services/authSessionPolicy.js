const hoursToMs = (hours) => hours * 60 * 60 * 1000;

export const AUTH_SESSION_STARTED_AT_KEY = 'sixthMan.authSessionStartedAt';
export const AUTH_SESSION_LAST_ACTIVE_AT_KEY = 'sixthMan.authSessionLastActiveAt';
export const AUTH_SESSION_MAX_AGE_MS = hoursToMs(24);
export const AUTH_SESSION_IDLE_TIMEOUT_MS = hoursToMs(12);

const toTimestamp = (value) => {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
};

export const shouldExpireAuthSession = ({
  now = Date.now(),
  startedAt,
  lastActiveAt,
  maxAgeMs = AUTH_SESSION_MAX_AGE_MS,
  idleTimeoutMs = AUTH_SESSION_IDLE_TIMEOUT_MS
} = {}) => {
  const started = toTimestamp(startedAt);
  const active = toTimestamp(lastActiveAt);

  if (!started || !active) return true;
  if (now - started > maxAgeMs) return true;
  if (now - active > idleTimeoutMs) return true;

  return false;
};

export const getStoredAuthSessionPolicy = (storage) => ({
  startedAt: storage?.getItem(AUTH_SESSION_STARTED_AT_KEY),
  lastActiveAt: storage?.getItem(AUTH_SESSION_LAST_ACTIVE_AT_KEY)
});

export const shouldExpireStoredAuthSession = (storage, now = Date.now()) =>
  shouldExpireAuthSession({
    now,
    ...getStoredAuthSessionPolicy(storage)
  });

export const markAuthSessionActive = (storage, now = Date.now()) => {
  if (!storage) return;

  if (!storage.getItem(AUTH_SESSION_STARTED_AT_KEY)) {
    storage.setItem(AUTH_SESSION_STARTED_AT_KEY, String(now));
  }
  storage.setItem(AUTH_SESSION_LAST_ACTIVE_AT_KEY, String(now));
};

export const clearAuthSessionPolicy = (storage) => {
  storage?.removeItem(AUTH_SESSION_STARTED_AT_KEY);
  storage?.removeItem(AUTH_SESSION_LAST_ACTIVE_AT_KEY);
};
