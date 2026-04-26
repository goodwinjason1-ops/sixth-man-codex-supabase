import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const env = { ...process.env };

const help = env.npm_config_help === 'true' || process.argv.includes('--help') || process.argv.includes('-h');

if (help) {
  console.log(`
Run a live Supabase Edge Function voice transcription smoke test.

Required:
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  LIVE_QA_PASSWORD

Optional:
  LIVE_QA_EMAIL=coach@test.com
  VITE_VOICE_TRANSCRIPTION_ENDPOINT=https://<project-ref>.supabase.co/functions/v1/voice-transcription
  VOICE_SMOKE_AUDIO=C:\\path\\to\\speech.wav
  VOICE_SMOKE_TEXT="Ava defense four. Mia teamwork five."

The script signs in as the QA coach, sends an audio file to the deployed Edge Function,
and expects a non-empty transcript back.
`);
  process.exit(0);
}

const supabaseUrl = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const anonKey = env.VITE_SUPABASE_ANON_KEY || '';
const email = env.LIVE_QA_EMAIL || 'coach@test.com';
const password = env.LIVE_QA_PASSWORD || '';
const endpoint = (env.VITE_VOICE_TRANSCRIPTION_ENDPOINT || `${supabaseUrl}/functions/v1/voice-transcription`).replace(/\/$/, '');
const smokeText = env.VOICE_SMOKE_TEXT || 'Ava defense four. Mia teamwork five.';

const missing = [];
if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
if (!anonKey) missing.push('VITE_SUPABASE_ANON_KEY');
if (!password) missing.push('LIVE_QA_PASSWORD');

if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
  console.error('');
  console.error('Example:');
  console.error('  $env:VITE_SUPABASE_URL="https://<project-ref>.supabase.co"');
  console.error('  $env:VITE_SUPABASE_ANON_KEY="<anon-key>"');
  console.error('  $env:LIVE_QA_PASSWORD="<shared-qa-password>"');
  console.error('  npm run qa:voice');
  process.exit(1);
}

async function signIn() {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`QA sign-in failed (${response.status}). ${detail.slice(0, 200)}`);
  }

  const payload = await response.json();
  if (!payload.access_token) throw new Error('QA sign-in did not return an access token.');
  return payload.access_token;
}

async function createSpeechAudio() {
  if (env.VOICE_SMOKE_AUDIO) {
    const filePath = resolve(env.VOICE_SMOKE_AUDIO);
    if (!existsSync(filePath)) throw new Error(`VOICE_SMOKE_AUDIO does not exist: ${filePath}`);
    return { filePath, cleanup: async () => {} };
  }

  if (process.platform !== 'win32') {
    throw new Error('Set VOICE_SMOKE_AUDIO to a speech WAV/WebM file on non-Windows platforms.');
  }

  const dir = await mkdtemp(join(tmpdir(), 'sixth-man-voice-'));
  const filePath = join(dir, 'voice-smoke.wav');
  const ps = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.SetOutputToWaveFile('${filePath.replace(/'/g, "''")}')
$synth.Speak('${smokeText.replace(/'/g, "''")}')
$synth.Dispose()
`;

  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', ps], {
    encoding: 'utf8',
    shell: false
  });

  if (result.status !== 0 || !existsSync(filePath)) {
    await rm(dir, { recursive: true, force: true });
    throw new Error(`Unable to generate Windows speech audio. Set VOICE_SMOKE_AUDIO manually. ${result.stderr || result.stdout}`.trim());
  }

  return {
    filePath,
    cleanup: async () => {
      await rm(dir, { recursive: true, force: true });
    }
  };
}

async function transcribe({ token, filePath }) {
  const bytes = await readFile(filePath);
  const formData = new FormData();
  formData.append('audio', new Blob([bytes], { type: 'audio/wav' }), 'voice-smoke.wav');
  formData.append('context', JSON.stringify({ source: 'live-voice-smoke', expectedText: smokeText }));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const payload = await response.json().catch(async () => ({
    error: await response.text().catch(() => 'Unable to read response.')
  }));

  if (!response.ok) {
    throw new Error(`Transcription function failed (${response.status}): ${payload.error || JSON.stringify(payload)}`);
  }

  if (!payload.transcript || typeof payload.transcript !== 'string') {
    throw new Error(`Transcription response did not include transcript: ${JSON.stringify(payload)}`);
  }

  return payload;
}

let audio;

try {
  const token = await signIn();
  audio = await createSpeechAudio();
  const payload = await transcribe({ token, filePath: audio.filePath });

  console.log('Voice transcription smoke test passed.');
  console.log(`Provider: ${payload.provider || 'unknown'}`);
  console.log(`Model: ${payload.model || 'unknown'}`);
  console.log(`Transcript: ${payload.transcript}`);
} finally {
  await audio?.cleanup?.();
}
