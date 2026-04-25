# App Migration to Supabase

This app now uses Supabase for runtime auth, document data, and feedback screenshot uploads. Existing app code can keep importing Firebase SDK modules because Vite aliases these imports to local compatibility modules in `src/lib/firebaseCompat`.

## Runtime Configuration

Required environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional:

- `VITE_SUPABASE_STORAGE_BUCKET` defaults to `feedback-screenshots`.

Firebase client environment variables are no longer used by the Vite app.

## Compatibility Layer

The Firestore compatibility adapter maps collection-style documents to `public.documents`:

- `collection` maps to the Firestore collection name.
- `id` maps to the document id.
- `data` stores the document payload as JSONB.
- `created_at`, `updated_at`, `created_by`, and `updated_by` are populated on writes when the columns are available.

Supported Firestore subset:

- References and reads: `collection`, `doc`, `getDoc`, `getDocFromServer`, `getDocs`
- Writes: `addDoc`, `setDoc`, `updateDoc`, `deleteDoc`, `writeBatch`
- Queries: `query`, `where`, `orderBy`, `limit`, `startAfter`
- Realtime: `onSnapshot` as initial fetch plus Supabase Realtime re-fetch
- Field helpers: `serverTimestamp`, `Timestamp.now`, `Timestamp.fromDate`, `increment`, `arrayUnion`, `arrayRemove`, `deleteField`

Query filtering, ordering, cursors, and limits are applied client-side after fetching all rows for a collection. This preserves app behavior first; high-volume collections should later move common filters into SQL/RPC or typed tables.

`writeBatch` is a sequential compatibility implementation, not a Postgres transaction.

## Auth Notes

`AuthContext` now uses Supabase Auth directly and normalizes users to Firebase-like objects with `uid = user.id`. Email/password sign-in, sign-up, password reset, and sign-out are direct Supabase calls.

Google and Apple sign-in use Supabase OAuth redirects, so `signInWithGoogle`, `signInWithApple`, and parent Google invitation sign-up return `null` before navigation instead of returning a user immediately. Parent invitation state is stored in session storage and completed after the redirect.

Admin secondary-app user creation flows are handled by the local Firebase Auth compatibility layer using isolated Supabase clients with separate storage keys. This avoids replacing the current admin session, but it is still client-side Supabase sign-up, not a privileged admin create-user API. For production-grade admin provisioning, move this behind a Supabase Edge Function or server using the service role key.

## Storage Notes

The only current storage path is feedback screenshots. `firebase/storage` imports are aliased to Supabase Storage:

- `ref(storage, path)`
- `uploadBytes`
- `getDownloadURL`

`getDownloadURL` first creates a 30-day signed URL for private buckets and falls back to a public URL for public buckets. If feedback screenshots must be retained longer than the signed URL lifetime, regenerate the URL from the stored object path or refresh the `screenshotUrl` field.

## Remaining Migration Caveats

The app runtime no longer depends on Firebase packages. Top-level maintenance scripts such as seed/cleanup scripts still import Firebase/Firebase Admin and need a separate Supabase migration before they are used.

Supabase Realtime must be enabled for `public.documents` if live `onSnapshot` behavior is required. Without Realtime, initial reads and writes still work, but subscribed screens will not auto-refresh until reloaded or re-queried.

## Testing and Security Follow-Up

Agent C owns the follow-up test execution and remediation plan in `docs/app-migration-testing-remediation.md`.

Agent D owns the production security hardening plan in `docs/app-migration-security-agent.md`.
