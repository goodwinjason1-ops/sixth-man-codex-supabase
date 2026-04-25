import { createClient } from '@supabase/supabase-js';
import { createE2ESupabaseClient } from './e2eSupabaseMock';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const useE2EMock =
  import.meta.env.MODE === 'e2e' &&
  import.meta.env.VITE_E2E_MOCK_SUPABASE === 'true';

if (!useE2EMock && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  throw new Error('Missing required Supabase environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY. Check your .env file.');
}

const DEFAULT_STORAGE_KEY = 'sixth-man-supabase-auth';

export const createSupabaseBrowserClient = ({
  storageKey = DEFAULT_STORAGE_KEY,
  detectSessionInUrl = true
} = {}) => useE2EMock
  ? createE2ESupabaseClient()
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl,
        persistSession: true,
        storageKey
      }
    });

export const supabase = useE2EMock
  ? createE2ESupabaseClient()
  : createSupabaseBrowserClient();

export const getOAuthRedirectTo = () => {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}${window.location.pathname}`;
};

export const normalizeSupabaseUser = (user) => {
  if (!user) return null;

  const metadata = user.user_metadata || {};
  const appMetadata = user.app_metadata || {};
  const displayName =
    metadata.displayName ||
    metadata.display_name ||
    metadata.full_name ||
    metadata.name ||
    user.email ||
    '';
  const photoURL =
    metadata.photoURL ||
    metadata.photo_url ||
    metadata.avatar_url ||
    metadata.picture ||
    null;

  return {
    ...user,
    uid: user.id,
    id: user.id,
    email: user.email || '',
    displayName,
    photoURL,
    providerData: appMetadata.provider ? [{ providerId: appMetadata.provider }] : []
  };
};

export const mapAuthError = (error) => {
  if (!error) return null;

  const message = error.message || 'Authentication failed.';
  const lower = message.toLowerCase();
  let code = error.code || error.status || 'auth/unknown';

  if (lower.includes('already registered') || lower.includes('already exists')) {
    code = 'auth/email-already-in-use';
  } else if (lower.includes('invalid email')) {
    code = 'auth/invalid-email';
  } else if (lower.includes('password')) {
    code = lower.includes('weak') || lower.includes('six') ? 'auth/weak-password' : 'auth/wrong-password';
  } else if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    code = 'auth/invalid-credential';
  }

  const mapped = new Error(message);
  mapped.code = code;
  mapped.status = error.status;
  mapped.originalError = error;
  return mapped;
};
