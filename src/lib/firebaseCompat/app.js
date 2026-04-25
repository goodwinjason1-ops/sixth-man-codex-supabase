import { createSupabaseBrowserClient, supabase } from '../supabaseClient';

const DEFAULT_APP_NAME = '[DEFAULT]';
const apps = new Map();

const normalizeStorageKey = (name) =>
  `sixth-man-supabase-auth-${String(name).replace(/[^a-z0-9_-]/gi, '_')}`;

const createApp = (options = {}, name = DEFAULT_APP_NAME) => ({
  name,
  options,
  supabase: name === DEFAULT_APP_NAME
    ? supabase
    : createSupabaseBrowserClient({
        storageKey: normalizeStorageKey(name),
        detectSessionInUrl: false
      }),
  __firebaseCompat: true
});

export const initializeApp = (options = {}, name = DEFAULT_APP_NAME) => {
  if (apps.has(name)) return apps.get(name);

  const app = createApp(options, name);
  apps.set(name, app);
  return app;
};

export const getApp = (name = DEFAULT_APP_NAME) => {
  if (!apps.has(name)) {
    return initializeApp({}, name);
  }
  return apps.get(name);
};

export const getApps = () => Array.from(apps.values());

export const deleteApp = async (app) => {
  if (!app) return;

  if (app.name !== DEFAULT_APP_NAME) {
    try {
      await app.supabase?.auth?.signOut?.();
    } catch (_) {
      // Best-effort cleanup for secondary auth clients.
    }
    apps.delete(app.name);
  }
};

initializeApp();

export default {
  initializeApp,
  getApp,
  getApps,
  deleteApp
};
