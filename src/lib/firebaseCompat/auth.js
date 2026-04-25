import { getApp } from './app';
import { getOAuthRedirectTo, mapAuthError, normalizeSupabaseUser } from '../supabaseClient';

const authByClient = new WeakMap();

const providerName = (provider) => {
  if (!provider) return 'google';
  if (provider.providerId === 'apple.com') return 'apple';
  if (provider.providerId === 'google.com') return 'google';
  return String(provider.providerId || provider).replace('.com', '');
};

const makeAuth = (app) => {
  const auth = {
    app,
    supabase: app.supabase,
    currentUser: null,
    async signOut() {
      await signOut(auth);
    }
  };
  return auth;
};

export const getAuth = (app = getApp()) => {
  const key = app.supabase;
  if (!authByClient.has(key)) {
    authByClient.set(key, makeAuth(app));
  }
  return authByClient.get(key);
};

export class GoogleAuthProvider {
  constructor() {
    this.providerId = 'google.com';
  }
}

export class OAuthProvider {
  constructor(providerId) {
    this.providerId = providerId;
  }
}

export const onAuthStateChanged = (auth, callback, errorCallback) => {
  let active = true;

  auth.supabase.auth.getUser()
    .then(({ data, error }) => {
      if (!active) return;
      if (error && error.message !== 'Auth session missing!') throw error;
      const user = normalizeSupabaseUser(data?.user);
      auth.currentUser = user;
      callback(user);
    })
    .catch((error) => {
      if (active) errorCallback?.(mapAuthError(error));
    });

  const { data: subscription } = auth.supabase.auth.onAuthStateChange((_event, session) => {
    if (!active) return;
    const user = normalizeSupabaseUser(session?.user);
    auth.currentUser = user;
    callback(user);
  });

  return () => {
    active = false;
    subscription?.subscription?.unsubscribe?.();
  };
};

export const signInWithEmailAndPassword = async (auth, email, password) => {
  const { data, error } = await auth.supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });
  if (error) throw mapAuthError(error);

  const user = normalizeSupabaseUser(data.user);
  auth.currentUser = user;
  return { user, _supabase: data };
};

export const createUserWithEmailAndPassword = async (auth, email, password) => {
  const { data, error } = await auth.supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password
  });
  if (error) throw mapAuthError(error);

  const user = normalizeSupabaseUser(data.user);
  auth.currentUser = user;
  return { user, _supabase: data };
};

export const signInWithPopup = async (auth, provider) => {
  const { data, error } = await auth.supabase.auth.signInWithOAuth({
    provider: providerName(provider),
    options: {
      redirectTo: getOAuthRedirectTo()
    }
  });
  if (error) throw mapAuthError(error);

  return { user: null, _supabase: data, redirected: true };
};

export const signInWithRedirect = signInWithPopup;

export const sendPasswordResetEmail = async (auth, email) => {
  const { error } = await auth.supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: getOAuthRedirectTo() }
  );
  if (error) throw mapAuthError(error);
};

export const signOut = async (auth) => {
  const { error } = await auth.supabase.auth.signOut();
  if (error) throw mapAuthError(error);
  auth.currentUser = null;
};

export const updateProfile = async (user, updates) => {
  const auth = getAuth();
  const { data, error } = await auth.supabase.auth.updateUser({
    data: {
      display_name: updates.displayName,
      photoURL: updates.photoURL
    }
  });
  if (error) throw mapAuthError(error);
  auth.currentUser = normalizeSupabaseUser(data.user || user);
  return auth.currentUser;
};
