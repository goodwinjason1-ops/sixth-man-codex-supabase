import { supabase } from '../lib/supabaseClient';
import { initializeApp } from '../lib/firebaseCompat/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from '../lib/firebaseCompat/auth';
import { getFirestore } from '../lib/firebaseCompat/firestore';
import { getStorage } from '../lib/firebaseCompat/storage';

const app = initializeApp({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

export { supabase };

export default app;
