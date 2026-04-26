# Voice Transcription Edge Function

The coach voice notes UI posts `multipart/form-data` audio to the `voice-transcription` Supabase Edge Function with the signed-in user's Supabase bearer token. By default the frontend derives the endpoint from `VITE_SUPABASE_URL`:

```text
https://<project-ref>.supabase.co/functions/v1/voice-transcription
```

Set `VITE_VOICE_TRANSCRIPTION_ENDPOINT` only when you need to override that default. The Edge Function keeps the speech-to-text provider token server-side, verifies the Supabase user, sends the audio to Hugging Face automatic speech recognition, and returns:

```json
{
  "transcript": "Ava defense four.",
  "language": "en",
  "durationMs": 1234,
  "provider": "huggingface",
  "model": "openai/whisper-large-v3-turbo"
}
```

The existing `src/services/voiceNoteService.js` contract reads `transcript`, `provider`, `model`, and optional `confidence`; extra fields are safe.

Hugging Face's automatic speech recognition API accepts raw audio bytes when no extra parameters are required and returns a `text` field. The default provider URL is `https://router.huggingface.co/hf-inference/models/<model>`. See the official task reference: https://huggingface.co/docs/api-inference/en/tasks/automatic-speech-recognition.

## Required Secrets

Set these Supabase Edge Function secrets before deployment or before invoking locally:

```powershell
supabase secrets set HF_TOKEN="<hugging-face-token>"
```

Optional overrides:

```powershell
supabase secrets set HF_ASR_MODEL="openai/whisper-large-v3-turbo"
supabase secrets set HF_ASR_ENDPOINT="https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo"
supabase secrets set HF_TIMEOUT_MS="60000"
supabase secrets set MAX_AUDIO_BYTES="26214400"
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are supplied by Supabase Edge Functions in hosted deployments. For local function serving, include them in your local Supabase environment if the CLI does not provide them.

## Deploy

Run from the copied repo only:

```powershell
cd "C:\Users\Kidsg\OneDrive\Desktop\SIxth Man_Spud Rebuild_Supabase\sixth-man-codex-supabase"
supabase link --project-ref <project-ref>
supabase functions deploy voice-transcription --no-verify-jwt
```

The `--no-verify-jwt` flag lets the function answer unauthenticated browser `OPTIONS` preflight requests. The function still requires `Authorization: Bearer <supabase-access-token>` on `POST` and validates that token against Supabase Auth before calling Hugging Face.

After deployment, rebuild the frontend with `VITE_SUPABASE_URL` set. The app will call the function URL automatically. Only set this if you need to override the derived URL:

```powershell
VITE_VOICE_TRANSCRIPTION_ENDPOINT=https://<project-ref>.supabase.co/functions/v1/voice-transcription
```

## Local Smoke Test

With the local Supabase stack running and secrets configured:

```powershell
supabase functions serve voice-transcription
```

Then sign in through the app, record a coach voice note, and click **Transcribe**. The request must include an `audio` form field and `Authorization: Bearer <supabase-access-token>`.

## Unit Test

The function has a Deno test with mocked Supabase Auth and Hugging Face calls:

```powershell
deno test --allow-env supabase/functions/voice-transcription/index.test.ts
```

## Live Smoke Test

After `HF_TOKEN` is set and the function is deployed, run:

```powershell
$env:VITE_SUPABASE_URL="https://lipjgbcgwokhucbxinmn.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="<anon-key>"
$env:LIVE_QA_PASSWORD="<shared-qa-password>"
npm run qa:voice
```

The script signs in as `coach@test.com`, generates a short WAV voice sample on Windows, sends it to the deployed function, and expects a non-empty transcript. Set `VOICE_SMOKE_AUDIO` to a real phone recording if you want to test an actual mobile capture file.
